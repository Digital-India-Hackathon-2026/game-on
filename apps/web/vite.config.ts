import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

const SIMPLIFY_ERROR = "Couldn't simplify this page, please try again";
const MAX_PAGE_TEXT_CHARS = 12000;
const CACHE_TTL_MS = 10 * 60 * 1000;
const PROXY_CACHE_TTL_MS = 12 * 60 * 1000;
const TARGET_TIMEOUT_MS = 10000;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX = 8;
const simplifyCache = new Map<string, { expiresAt: number; body: SimplifyResponse }>();
const proxyCache = new Map<string, { expiresAt: number; html: string; visibleText: string; finalUrl: string }>();
const rateLimits = new Map<string, { windowStart: number; count: number }>();
const adhdBookmarkRateLimits = new Map<string, { windowStart: number; count: number }>();
const adhdBookmarks = new Map<string, Map<string, AdhdBookmark>>();
const adhdTimerStates = new Map<string, AdhdTimerState>();

type SimplifyResponse = {
  summary: string;
  primaryActions: string[];
  ok?: boolean;
  error?: string;
  cached?: boolean;
};

type SummaryMode = 'quick' | 'standard' | 'detailed' | 'action';

type AdhdBookmark = {
  id: string;
  url: string;
  scrollPosition: number;
  timestamp: string;
};

type AdhdTimerState = {
  status: 'idle' | 'running' | 'paused' | 'completed';
  durationMinutes: number;
  remainingSeconds: number;
  updatedAt: string;
};

function sendJson(res: any, statusCode: number, body: unknown) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

function sendApiError(res: any, statusCode: number, code: string, message: string, requestId: string) {
  sendJson(res, statusCode, { ok: false, error: { code, message, requestId } });
}

function stableRequestId() {
  return `simplify_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function logSimplify(event: string, data: Record<string, unknown>) {
  const safe = { event, timestamp: new Date().toISOString(), ...data };
  console.info(JSON.stringify(safe));
}

function logProxy(event: string, data: Record<string, unknown>) {
  const safe = { event, timestamp: new Date().toISOString(), ...data };
  console.info(JSON.stringify(safe));
}

function logAdhd(event: string, data: Record<string, unknown>) {
  const safe = { event, timestamp: new Date().toISOString(), ...data };
  console.info(JSON.stringify(safe));
}

function hashForLog(input: string) {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  return hash.toString(16);
}

function validateUrl(value: unknown): string {
  if (typeof value !== 'string' || value.trim().length === 0) throw new Error('url is required');
  const parsed = new URL(value.trim());
  if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('url must be http or https');
  parsed.hash = '';
  return parsed.toString();
}

function sanitizePageText(value: unknown): string {
  if (typeof value !== 'string') throw new Error('pageText is required');
  const stripped = value
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, '[redacted-email]')
    .replace(/\+?\d[\d\s().-]{7,}\d/g, '[redacted-phone]')
    .replace(/\b(?:\d[ -]*?){13,19}\b/g, '[redacted-number]')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (stripped.length < 20) throw new Error('pageText is too short to simplify');
  return stripped.slice(0, MAX_PAGE_TEXT_CHARS);
}

function sanitizeOptionalPageText(value: unknown, fallback: string): string {
  const candidate = typeof value === 'string' && value.trim().length > 0 ? value : fallback;
  return sanitizePageText(candidate);
}

function checkRateLimit(key: string) {
  const now = Date.now();
  const current = rateLimits.get(key);
  if (!current || now - current.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimits.set(key, { windowStart: now, count: 1 });
    return true;
  }
  current.count += 1;
  return current.count <= RATE_LIMIT_MAX;
}

function checkMapRateLimit(store: Map<string, { windowStart: number; count: number }>, key: string, max: number, windowMs: number) {
  const now = Date.now();
  const current = store.get(key);
  if (!current || now - current.windowStart > windowMs) {
    store.set(key, { windowStart: now, count: 1 });
    return true;
  }
  current.count += 1;
  return current.count <= max;
}

function getSessionKey(req: any) {
  return String(req.headers['x-saralo-session'] || req.headers.authorization || req.socket.remoteAddress || 'anonymous').slice(0, 160);
}

function adhdRequestId() {
  return `adhd_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function readJsonBody(req: any, maxBytes = 100000): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let rawBody = '';
    req.on('data', (chunk: Buffer) => {
      rawBody += chunk.toString('utf8');
      if (rawBody.length > maxBytes) {
        reject(new Error('request_body_too_large'));
        req.destroy();
      }
    });
    req.on('end', () => {
      try {
        resolve(rawBody ? JSON.parse(rawBody) : {});
      } catch {
        reject(new Error('malformed_json'));
      }
    });
    req.on('error', reject);
  });
}

function countWords(value: string) {
  const matches = value.trim().match(/[A-Za-z0-9]+(?:[-'][A-Za-z0-9]+)*/g);
  return matches?.length ?? 0;
}

function validateAdhdPageText(value: unknown) {
  if (typeof value !== 'string') throw new Error('pageText is required');
  const text = value.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  if (!text) throw new Error('pageText is required');
  return text.slice(0, 200000);
}

function validateScrollPosition(value: unknown) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) throw new Error('scrollPosition must be a non-negative number');
  return Math.round(value);
}

function validateTimestamp(value: unknown) {
  if (value == null || value === '') return new Date().toISOString();
  if (typeof value !== 'string') throw new Error('timestamp must be an ISO string');
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) throw new Error('timestamp must be a valid ISO string');
  return parsed.toISOString();
}

function validateBookmarkId(value: unknown) {
  if (typeof value !== 'string' || !/^[a-z0-9_-]{6,80}$/i.test(value)) throw new Error('bookmark id is invalid');
  return value;
}

function createAdhdBookmarkId(url: string, timestamp: string) {
  return `bm_${hashForLog(`${url}:${timestamp}:${Math.random()}`)}`;
}

function validateTimerState(body: any): AdhdTimerState {
  const allowed = new Set(['idle', 'running', 'paused', 'completed']);
  const status = typeof body.status === 'string' && allowed.has(body.status) ? body.status as AdhdTimerState['status'] : null;
  if (!status) throw new Error('status must be idle, running, paused, or completed');
  if (typeof body.durationMinutes !== 'number' || !Number.isFinite(body.durationMinutes) || body.durationMinutes < 1 || body.durationMinutes > 240) {
    throw new Error('durationMinutes must be between 1 and 240');
  }
  if (typeof body.remainingSeconds !== 'number' || !Number.isFinite(body.remainingSeconds) || body.remainingSeconds < 0 || body.remainingSeconds > body.durationMinutes * 60) {
    throw new Error('remainingSeconds must be between 0 and the timer duration');
  }
  return {
    status,
    durationMinutes: Math.round(body.durationMinutes),
    remainingSeconds: Math.round(body.remainingSeconds),
    updatedAt: new Date().toISOString(),
  };
}

const adhdDeclutterConfig = {
  version: '2026-07-08.adhd-focus.v1',
  suppressSelectors: [
    '[autoplay]',
    'video[autoplay]',
    'audio[autoplay]',
    '[role="dialog"]',
    '[aria-modal="true"]',
    '.modal',
    '.popup',
    '.popover',
    '.newsletter',
    '.cookie-banner',
    '.cookie-consent',
    '.ad',
    '.ads',
    '.advert',
    '.advertisement',
    '[class*=" ad-"]',
    '[class^="ad-"]',
    '[id*="ad-"]',
    '[class*="sponsor"]',
    '[id*="sponsor"]',
    '[class*="outbrain"]',
    '[class*="taboola"]',
    '[class*="doubleclick"]',
    'iframe[src*="doubleclick"]',
    'iframe[src*="googlesyndication"]',
  ],
  preserveSelectors: ['main', 'article', 'form', 'nav[aria-label]', '[role="main"]'],
  behavior: {
    suppressDialogsOnInitialLoad: true,
    pauseAutoplayMedia: true,
    hideStickyDistractions: true,
    maxSuppressedNodesPerPage: 250,
  },
};

const adhdPalette = {
  version: '2026-07-08.adhd-focus.v1',
  saturationReductionPercent: 18,
  brightnessAdjustmentPercent: 2,
  contrastAdjustmentPercent: -4,
  hueTargets: {
    calmingBlue: '#7aa7c7',
    softGreen: '#8bbf9f',
    pastelMint: '#c7ead9',
    warmNeutral: '#f2f0e8',
  },
  avoid: {
    highSaturationRedPercentAbove: 65,
    flashingAnimation: true,
    rapidHueShift: true,
  },
};

function hasRedisRest() {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

async function redisRestCommand(args: string[]) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  const response = await fetchWithTimeout(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(args),
  }, 2000);
  if (!response.ok) throw new Error(`redis_${response.status}`);
  return await response.json() as { result?: unknown; error?: string };
}

async function redisGetJson<T>(key: string): Promise<T | null> {
  if (!hasRedisRest()) return null;
  const data = await redisRestCommand(['GET', key]);
  if (!data?.result || typeof data.result !== 'string') return null;
  return JSON.parse(data.result) as T;
}

async function redisSetJson(key: string, value: unknown, ttlSeconds: number) {
  if (!hasRedisRest()) return false;
  await redisRestCommand(['SET', key, JSON.stringify(value), 'EX', String(ttlSeconds)]);
  return true;
}

function adhdBookmarksKey(sessionKey: string) {
  return `saralo:adhd:bookmarks:${hashForLog(sessionKey)}`;
}

function adhdTimerKey(sessionKey: string) {
  return `saralo:adhd:timer:${hashForLog(sessionKey)}`;
}

async function loadAdhdBookmarks(sessionKey: string) {
  try {
    const redisBookmarks = await redisGetJson<AdhdBookmark[]>(adhdBookmarksKey(sessionKey));
    if (redisBookmarks) {
      return new Map(redisBookmarks.map((bookmark) => [bookmark.id, bookmark]));
    }
  } catch (error) {
    logAdhd('adhd_redis_fallback', { store: 'bookmarks', error: error instanceof Error ? error.message : 'unknown' });
  }
  const store = adhdBookmarks.get(sessionKey) ?? new Map<string, AdhdBookmark>();
  adhdBookmarks.set(sessionKey, store);
  return store;
}

async function saveAdhdBookmarks(sessionKey: string, store: Map<string, AdhdBookmark>) {
  const bookmarks = Array.from(store.values());
  if (hasRedisRest()) {
    try {
      await redisSetJson(adhdBookmarksKey(sessionKey), bookmarks, 60 * 60 * 24 * 30);
      return 'redis';
    } catch (error) {
      logAdhd('adhd_redis_fallback', { store: 'bookmarks', error: error instanceof Error ? error.message : 'unknown' });
    }
  }
  adhdBookmarks.set(sessionKey, store);
  return 'memory';
}

async function loadAdhdTimerState(sessionKey: string): Promise<AdhdTimerState | null> {
  try {
    return await redisGetJson<AdhdTimerState>(adhdTimerKey(sessionKey));
  } catch (error) {
    logAdhd('adhd_redis_fallback', { store: 'timer', error: error instanceof Error ? error.message : 'unknown' });
  }
  return adhdTimerStates.get(sessionKey) ?? null;
}

async function saveAdhdTimerState(sessionKey: string, timerState: AdhdTimerState) {
  if (hasRedisRest()) {
    try {
      await redisSetJson(adhdTimerKey(sessionKey), timerState, 60 * 60 * 24 * 7);
      return 'redis';
    } catch (error) {
      logAdhd('adhd_redis_fallback', { store: 'timer', error: error instanceof Error ? error.message : 'unknown' });
    }
  }
  adhdTimerStates.set(sessionKey, timerState);
  return 'memory';
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withTimeout<T>(work: Promise<T>, timeoutMs: number): Promise<T> {
  let timeout: ReturnType<typeof setTimeout>;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => reject(new Error('simplify_timeout')), timeoutMs);
  });
  try {
    return await Promise.race([work, timeoutPromise]);
  } finally {
    clearTimeout(timeout!);
  }
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function proxyFallbackPage(targetUrl: string, reason: string) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Saralo could not open this site</title>
  <style>
    body{margin:0;font-family:system-ui,-apple-system,Segoe UI,sans-serif;background:#f8fafc;color:#0f172a;display:grid;min-height:100vh;place-items:center;padding:24px}
    main{max-width:680px;border:1px solid #dbe3ef;border-radius:12px;background:white;padding:28px;box-shadow:0 20px 60px rgba(15,23,42,.12)}
    h1{font-size:1.6rem;margin:0 0 12px} p{font-size:1.05rem;line-height:1.6} code{word-break:break-all}
  </style>
</head>
<body>
  <main role="alert">
    <h1>This website could not be safely transformed.</h1>
    <p>Saralo could not load <code>${escapeHtml(targetUrl)}</code>. The site may block automated fetching, require sign-in, or use protections that prevent proxying.</p>
    <p>Please try another page from the same site, or open the original website in a normal browser tab.</p>
    <p><strong>Reason:</strong> ${escapeHtml(reason)}</p>
  </main>
</body>
</html>`;
}

function extractVisibleTextFromHtml(html: string) {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
    .replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_PAGE_TEXT_CHARS);
}

function rewriteAttributeUrls(html: string, finalUrl: string) {
  return html.replace(/\b(src|href|poster|action)=["']([^"']+)["']/gi, (match, attr, rawValue) => {
    if (/^(?:https?:|data:|blob:|mailto:|tel:|javascript:|#)/i.test(rawValue)) return match;
    try {
      return `${attr}="${new URL(rawValue, finalUrl).toString()}"`;
    } catch {
      return match;
    }
  }).replace(/\bsrcset=["']([^"']+)["']/gi, (match, rawValue) => {
    const rewritten = rawValue.split(',').map((part: string) => {
      const [urlPart, descriptor] = part.trim().split(/\s+/, 2);
      if (!urlPart || /^(?:https?:|data:|blob:)/i.test(urlPart)) return part.trim();
      try {
        return `${new URL(urlPart, finalUrl).toString()}${descriptor ? ` ${descriptor}` : ''}`;
      } catch {
        return part.trim();
      }
    }).join(', ');
    return `srcset="${rewritten}"`;
  });
}

function sanitizeProxiedHtml(html: string) {
  return html
    .replace(/<meta[^>]*http-equiv=["']Content-Security-Policy["'][^>]*>/gi, '')
    .replace(/<meta[^>]*http-equiv=["']X-Frame-Options["'][^>]*>/gi, '')
    .replace(/\s(on\w+)=["'][^"']*["']/gi, '')
    .replace(/\s(href|src)=["']javascript:[^"']*["']/gi, ' $1="#"');
}

function modeEngineSnippet(visibleText: string) {
  const css = `
    html.saralo-mode-adhd,html.saralo-mode-dyslexia,html.saralo-mode-low-vision,html.saralo-mode-astigmatism,html.saralo-mode-colorblind,html.saralo-mode-cognitive-overload{font-size-adjust:from-font;text-rendering:optimizeLegibility!important;-webkit-font-smoothing:antialiased!important;scroll-behavior:smooth!important}
    html[class*="saralo-mode-"] body{min-width:0!important;overflow-x:auto!important}
    html[class*="saralo-mode-"] *,html[class*="saralo-mode-"] *::before,html[class*="saralo-mode-"] *::after{box-sizing:border-box!important}
    html[class*="saralo-mode-"] img,html[class*="saralo-mode-"] picture,html[class*="saralo-mode-"] video,html[class*="saralo-mode-"] canvas{max-width:100%!important;height:auto;image-rendering:auto!important}
    html[class*="saralo-mode-"] a:focus-visible,html[class*="saralo-mode-"] button:focus-visible,html[class*="saralo-mode-"] input:focus-visible,html[class*="saralo-mode-"] select:focus-visible,html[class*="saralo-mode-"] textarea:focus-visible,html[class*="saralo-mode-"] [tabindex]:focus-visible{outline:4px solid #ffbf00!important;outline-offset:4px!important}
    html[class*="saralo-mode-"] button,html[class*="saralo-mode-"] input,html[class*="saralo-mode-"] select,html[class*="saralo-mode-"] textarea{font:inherit}
    html[class*="saralo-mode-"] p,html[class*="saralo-mode-"] li,html[class*="saralo-mode-"] td,html[class*="saralo-mode-"] th{overflow-wrap:anywhere}
    html.saralo-mode-dyslexia *{font-family:Arial,Verdana,sans-serif!important;letter-spacing:.08em!important;word-spacing:.16em!important;line-height:1.85!important}
    html.saralo-mode-astigmatism button,html.saralo-mode-astigmatism a,html.saralo-mode-astigmatism input,html.saralo-mode-astigmatism select,html.saralo-mode-astigmatism textarea,html.saralo-mode-astigmatism [role="button"],html.saralo-mode-astigmatism [role="link"]{min-width:48px!important;min-height:48px!important;padding:12px 18px!important;font-size:1.2rem!important;margin:6px!important}
    html.saralo-mode-astigmatism body,html.saralo-mode-astigmatism p,html.saralo-mode-astigmatism li{font-size:112%!important;line-height:1.85!important}
    html.saralo-mode-low-vision{--saralo-lowvision-zoom:1.2;--saralo-lowvision-text:1.9;--saralo-lowvision-heading:1.22;--saralo-lowvision-button:1.2;--saralo-lowvision-icon:1.25;--saralo-lowvision-bg:#f6f9fc;--saralo-lowvision-surface:#ffffff;--saralo-lowvision-text-color:#08111f;--saralo-lowvision-accent:#074fb0;--saralo-lowvision-accent-soft:#e3efff;--saralo-lowvision-border:#123d73;color-scheme:light!important;cursor:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 48 48'%3E%3Cpath d='M7 4l29 24-14 2-7 14z' fill='%2307142b' stroke='%23ffffff' stroke-width='4'/%3E%3C/svg%3E") 4 4,auto!important;scroll-behavior:smooth!important}
    html.saralo-mode-low-vision body{background:var(--saralo-lowvision-bg)!important;color:var(--saralo-lowvision-text-color)!important;filter:contrast(116%) brightness(104%)!important;font-size:calc(100%*var(--saralo-lowvision-zoom))!important;line-height:1.72!important;font-weight:600!important;text-rendering:optimizeLegibility!important;overflow-wrap:anywhere!important}
    html.saralo-mode-low-vision *,html.saralo-mode-low-vision *::before,html.saralo-mode-low-vision *::after{box-sizing:border-box!important;max-width:100%!important;letter-spacing:0!important;scroll-margin-top:96px!important;transition:font-size 220ms ease,line-height 220ms ease,background-color 220ms ease,color 220ms ease,border-color 220ms ease,box-shadow 220ms ease,opacity 220ms ease,filter 220ms ease!important}
    html.saralo-mode-low-vision main,html.saralo-mode-low-vision article,html.saralo-mode-low-vision [role="main"],html.saralo-mode-low-vision .content,html.saralo-mode-low-vision #content,html.saralo-mode-low-vision .mw-body,html.saralo-mode-low-vision #bodyContent{width:min(100%,1120px)!important;max-width:1120px!important;margin-left:auto!important;margin-right:auto!important;padding-left:clamp(16px,3vw,34px)!important;padding-right:clamp(16px,3vw,34px)!important}
    html.saralo-mode-low-vision p,html.saralo-mode-low-vision li,html.saralo-mode-low-vision td,html.saralo-mode-low-vision th,html.saralo-mode-low-vision label,html.saralo-mode-low-vision summary,html.saralo-mode-low-vision blockquote{line-height:1.76!important;font-weight:650!important;color:var(--saralo-lowvision-text-color)!important;overflow-wrap:anywhere!important}
    html.saralo-mode-low-vision h1,html.saralo-mode-low-vision h2,html.saralo-mode-low-vision h3,html.saralo-mode-low-vision h4{font-size:calc(1em*var(--saralo-lowvision-heading))!important;line-height:1.22!important;font-weight:850!important;color:#03101f!important;overflow-wrap:anywhere!important}
    html.saralo-mode-low-vision p,html.saralo-mode-low-vision ul,html.saralo-mode-low-vision ol,html.saralo-mode-low-vision blockquote{margin-block:1.05em!important;max-width:76ch!important}
    html.saralo-mode-low-vision a{color:var(--saralo-lowvision-accent)!important;text-decoration:underline!important;text-decoration-thickness:max(2px,.11em)!important;text-underline-offset:.18em!important;border-radius:8px!important}
    html.saralo-mode-low-vision button,html.saralo-mode-low-vision input,html.saralo-mode-low-vision select,html.saralo-mode-low-vision textarea,html.saralo-mode-low-vision [role="button"],html.saralo-mode-low-vision [role="link"]{min-width:64px!important;min-height:64px!important;font-size:calc(1em*var(--saralo-lowvision-button))!important;line-height:1.35!important;font-weight:800!important;padding:max(12px,.7em) max(16px,1em)!important;border:3px solid var(--saralo-lowvision-border)!important;border-radius:12px!important;background:var(--saralo-lowvision-surface)!important;color:var(--saralo-lowvision-text-color)!important;box-shadow:0 0 0 2px rgba(7,79,176,.12)!important;white-space:normal!important}
    html.saralo-mode-low-vision a:focus-visible,html.saralo-mode-low-vision button:focus-visible,html.saralo-mode-low-vision input:focus-visible,html.saralo-mode-low-vision select:focus-visible,html.saralo-mode-low-vision textarea:focus-visible,html.saralo-mode-low-vision [tabindex]:focus-visible{outline:6px solid #ffbf00!important;outline-offset:5px!important}
    html.saralo-mode-low-vision a:hover,html.saralo-mode-low-vision button:hover{background:var(--saralo-lowvision-accent-soft)!important}
    html.saralo-mode-low-vision svg,html.saralo-mode-low-vision [class*="icon"],html.saralo-mode-low-vision [class*="Icon"]{min-width:28px!important;min-height:28px!important;transform:scale(var(--saralo-lowvision-icon))!important;transform-origin:center!important}
    html.saralo-mode-low-vision img,html.saralo-mode-low-vision picture,html.saralo-mode-low-vision video,html.saralo-mode-low-vision canvas{height:auto!important;object-fit:contain!important;filter:contrast(112%) brightness(104%)!important;outline:2px solid rgba(7,79,176,.34)!important;outline-offset:3px!important}
    html.saralo-mode-low-vision.saralo-setting-simplifiedLayout aside,html.saralo-mode-low-vision.saralo-setting-simplifiedLayout footer,html.saralo-mode-low-vision.saralo-setting-simplifiedLayout [role="complementary"],html.saralo-mode-low-vision.saralo-setting-simplifiedLayout [class*="sidebar" i],html.saralo-mode-low-vision.saralo-setting-simplifiedLayout [id*="sidebar" i],html.saralo-mode-low-vision.saralo-setting-simplifiedLayout [class*="secondary" i],html.saralo-mode-low-vision.saralo-setting-simplifiedLayout [id*="secondary" i],html.saralo-mode-low-vision.saralo-setting-simplifiedLayout [class*="recommend" i],html.saralo-mode-low-vision.saralo-setting-simplifiedLayout [class*="related" i],html.saralo-mode-low-vision.saralo-setting-simplifiedLayout [class*="ad-" i],html.saralo-mode-low-vision.saralo-setting-simplifiedLayout [id*="ad-" i]{max-height:150px!important;overflow:auto!important;opacity:.58!important;filter:saturate(.65) contrast(.9)!important;border:2px solid rgba(7,79,176,.22)!important;border-radius:12px!important;background:rgba(255,255,255,.72)!important}
    html.saralo-mode-low-vision table,html.saralo-mode-low-vision th,html.saralo-mode-low-vision td,html.saralo-mode-low-vision hr,html.saralo-mode-low-vision fieldset{border-color:#194a8d!important;border-width:2px!important}
    html.saralo-mode-low-vision .saralo-lowvision-magnifier{position:fixed!important;z-index:2147483646!important;width:min(460px,calc(100vw - 48px))!important;min-height:104px!important;padding:16px!important;border:4px solid var(--saralo-lowvision-border)!important;border-radius:16px!important;background:#fff!important;color:#07111f!important;font:850 30px/1.38 Arial,system-ui,sans-serif!important;box-shadow:0 16px 46px rgba(3,16,31,.25)!important;pointer-events:none!important}
    html.saralo-mode-low-vision .saralo-lowvision-image-reader{position:absolute!important;z-index:2147483645!important;padding:10px 12px!important;border:2px solid #194a8d!important;border-radius:12px!important;background:#fff!important;color:#07111f!important;font:800 16px/1.25 Arial,system-ui,sans-serif!important;box-shadow:0 8px 26px rgba(3,16,31,.22)!important}
    html.saralo-mode-colorblind-protanopia{filter:url(#saralo-protanopia)!important}
    html.saralo-mode-colorblind-deuteranopia{filter:url(#saralo-deuteranopia)!important}
    html.saralo-mode-colorblind-tritanopia{filter:url(#saralo-tritanopia)!important}
    html.saralo-mode-colorblind-achromatopsia{filter:url(#saralo-achromatopsia)!important}
    html.saralo-mode-cognitive-overload{--saralo-cog-bg:#f7f7fb;--saralo-cog-surface:#fff;--saralo-cog-text:#101323;--saralo-cog-muted:#5b6072;--saralo-cog-accent:#5b35d5;--saralo-cog-soft:#eee9ff;color-scheme:light!important;scroll-behavior:smooth!important}
    html.saralo-mode-cognitive-overload.saralo-setting-theme-dark{--saralo-cog-bg:#090815;--saralo-cog-surface:#151226;--saralo-cog-text:#f7f3ff;--saralo-cog-muted:#c9c2da;--saralo-cog-accent:#bda8ff;--saralo-cog-soft:#211a3a;color-scheme:dark!important}
    html.saralo-mode-cognitive-overload body{background:var(--saralo-cog-bg)!important;color:var(--saralo-cog-text)!important;font:1.08rem/1.72 Inter,system-ui,-apple-system,Segoe UI,sans-serif!important;padding-bottom:86px!important}
    html.saralo-mode-cognitive-overload *,html.saralo-mode-cognitive-overload *::before,html.saralo-mode-cognitive-overload *::after{transition:background-color 260ms ease,color 260ms ease,border-color 260ms ease,opacity 260ms ease,max-height 260ms ease,filter 260ms ease!important;scroll-margin-top:120px!important}
    html.saralo-mode-cognitive-overload.saralo-setting-theme-dark body,html.saralo-mode-cognitive-overload.saralo-setting-theme-dark main,html.saralo-mode-cognitive-overload.saralo-setting-theme-dark article,html.saralo-mode-cognitive-overload.saralo-setting-theme-dark section,html.saralo-mode-cognitive-overload.saralo-setting-theme-dark div{background-color:var(--saralo-cog-bg)!important;color:var(--saralo-cog-text)!important}
    html.saralo-mode-cognitive-overload main,html.saralo-mode-cognitive-overload article,html.saralo-mode-cognitive-overload [role="main"],html.saralo-mode-cognitive-overload .content,html.saralo-mode-cognitive-overload #content{max-width:1100px!important;margin-left:auto!important;margin-right:auto!important;padding:24px!important}
    html.saralo-mode-cognitive-overload h1,html.saralo-mode-cognitive-overload h2,html.saralo-mode-cognitive-overload h3{line-height:1.22!important;color:var(--saralo-cog-text)!important;letter-spacing:0!important}
    html.saralo-mode-cognitive-overload p,html.saralo-mode-cognitive-overload li{max-width:76ch!important;line-height:1.78!important}
    html.saralo-mode-cognitive-overload aside,html.saralo-mode-cognitive-overload footer,html.saralo-mode-cognitive-overload [role="complementary"],html.saralo-mode-cognitive-overload [class*="sidebar"],html.saralo-mode-cognitive-overload [id*="sidebar"],html.saralo-mode-cognitive-overload [class*="recommend"],html.saralo-mode-cognitive-overload [class*="related"],html.saralo-mode-cognitive-overload [class*="trending"],html.saralo-mode-cognitive-overload [class*="ad"],html.saralo-mode-cognitive-overload [id*="ad"]{max-height:96px!important;overflow:auto!important;opacity:.48!important;filter:saturate(.7) contrast(.9)!important;border:1px solid #ded8f7!important;border-radius:14px!important;background:rgba(255,255,255,.62)!important}
    html.saralo-mode-cognitive-overload .popup,html.saralo-mode-cognitive-overload .modal,html.saralo-mode-cognitive-overload [role="dialog"]:not(.saralo-cog-card){opacity:.35!important;transform:scale(.98)!important}
    html.saralo-mode-cognitive-overload .saralo-cog-card{display:block!important;max-width:1100px!important;margin:18px auto 20px!important;padding:22px!important;border:1px solid #ddd5ff!important;border-radius:18px!important;background:var(--saralo-cog-surface)!important;color:var(--saralo-cog-text)!important;box-shadow:0 14px 42px rgba(24,18,54,.12)!important}
    html.saralo-mode-cognitive-overload .saralo-cog-card h2{margin:0 0 10px!important;font:850 1.45rem/1.2 Inter,system-ui,sans-serif!important;color:var(--saralo-cog-text)!important}
    html.saralo-mode-cognitive-overload .saralo-cog-card ul{display:grid!important;gap:8px!important;margin:12px 0 0!important;padding:0!important;list-style:none!important}
    html.saralo-mode-cognitive-overload .saralo-cog-card li{padding:10px 12px!important;border-radius:12px!important;background:var(--saralo-cog-soft)!important;color:var(--saralo-cog-text)!important;font-weight:700!important}
    html.saralo-mode-cognitive-overload .saralo-cog-primary{outline:4px solid rgba(91,53,213,.22)!important;outline-offset:5px!important;border-radius:14px!important}
    html.saralo-mode-cognitive-overload .saralo-cog-simplified{padding:12px 14px!important;border-left:5px solid var(--saralo-cog-accent)!important;border-radius:12px!important;background:var(--saralo-cog-surface)!important}
    html.saralo-mode-cognitive-overload .saralo-cog-original{display:none!important;margin-top:10px!important;color:#33384d!important}
    html.saralo-mode-cognitive-overload .saralo-cog-simplified.is-expanded .saralo-cog-original{display:block!important}
    html.saralo-mode-cognitive-overload .saralo-cog-expand{margin-top:8px!important;border:1px solid #cfc5ff!important;border-radius:999px!important;background:#f2efff!important;color:#28156f!important;padding:7px 12px!important;font-weight:800!important;cursor:pointer!important}
    .saralo-ai-summary-card{display:none!important;max-width:1100px!important;margin:18px auto!important;overflow:auto!important;padding:18px!important;border:1px solid rgba(207,197,255,.9)!important;border-radius:20px!important;background:var(--saralo-cog-surface,#fff)!important;color:var(--saralo-cog-text,#17142f)!important;font:650 15px/1.55 Inter,system-ui,-apple-system,Segoe UI,sans-serif!important;box-shadow:0 20px 54px rgba(24,18,54,.14)!important;transition:opacity 240ms ease,transform 240ms ease!important}
    .saralo-ai-summary-card.is-open{opacity:1!important;transform:translateY(0) scale(1)!important;pointer-events:auto!important}
    .saralo-ai-summary-card h2{margin:0 0 8px!important;color:var(--saralo-cog-text,#241167)!important;font:900 1.25rem/1.2 Inter,system-ui,sans-serif!important;letter-spacing:0!important}
    .saralo-ai-summary-card p{margin:0 0 12px!important;color:#555b6f!important;font:650 14px/1.5 Inter,system-ui,sans-serif!important}
    .saralo-ai-summary-card label{display:grid!important;gap:5px!important;margin:0 0 10px!important;color:#302661!important;font:800 13px/1.2 Inter,system-ui,sans-serif!important}
    .saralo-ai-summary-card select{min-height:38px!important;border:1px solid #cfc5ff!important;border-radius:10px!important;background:#fff!important;color:#17142f!important;padding:8px 10px!important;font:750 14px/1 Inter,system-ui,sans-serif!important}
    .saralo-ai-summary-card ul{display:grid!important;gap:8px!important;margin:0!important;padding:0!important;list-style:none!important}
    .saralo-ai-summary-card li{padding:10px 12px!important;border-radius:12px!important;background:#f2efff!important;color:#17142f!important;font:750 14px/1.45 Inter,system-ui,sans-serif!important}
    .saralo-ai-summary-card button{margin-top:12px!important;min-height:40px!important;padding:9px 12px!important;border:1px solid #cfc5ff!important;border-radius:12px!important;background:#fff!important;color:#28156f!important;font:850 14px/1 Inter,system-ui,sans-serif!important;cursor:pointer!important}
    .saralo-ai-summary-card.is-open{display:block!important}
    html.saralo-setting-theme-dark body{background:#070711!important;color:#f7f5ff!important;color-scheme:dark!important}
    html.saralo-setting-theme-light body{background:#fff!important;color:#101323!important;color-scheme:light!important}
    html.saralo-setting-reduceAnimations *,html.saralo-setting-reduceAnimations *::before,html.saralo-setting-reduceAnimations *::after{animation:none!important;transition:none!important;scroll-behavior:auto!important}
    html.saralo-setting-hideSidebar aside,html.saralo-setting-hideSidebar [role="complementary"],html.saralo-setting-hideSidebar [class*="sidebar"],html.saralo-setting-hideSidebar [id*="sidebar"]{display:none!important}
    html.saralo-setting-hideImages img,html.saralo-setting-hideImages picture,html.saralo-setting-hideImages video,html.saralo-setting-hideImages canvas{opacity:.08!important;filter:grayscale(1)!important;max-height:80px!important}
    html.saralo-setting-chunkParagraphs p{max-width:68ch!important;padding:12px 14px!important;margin-block:14px!important;border-left:4px solid rgba(123,77,255,.42)!important;border-radius:10px!important;background:rgba(255,255,255,.74)!important}
    html.saralo-setting-highlightActiveParagraph p:hover,html.saralo-setting-highlightActiveParagraph li:hover{outline:3px solid rgba(123,77,255,.35)!important;background:rgba(239,235,255,.9)!important;border-radius:10px!important}
    html.saralo-mode-dyslexia{--saralo-letter-spacing:.08em;--saralo-word-spacing:.16em;--saralo-line-height:1.7}
    html.saralo-mode-dyslexia *{letter-spacing:var(--saralo-letter-spacing)!important;word-spacing:var(--saralo-word-spacing)!important;line-height:var(--saralo-line-height)!important}
    html.saralo-mode-dyslexia.saralo-setting-dyslexiaFont *{font-family:Arial,Verdana,Tahoma,sans-serif!important;font-weight:650!important}
    html.saralo-mode-dyslexia.saralo-setting-warmReadingTheme-light body{background:#fff8e8!important;color:#21190f!important}
    html.saralo-mode-dyslexia.saralo-setting-warmReadingTheme-dark body{background:#17120d!important;color:#fff1d0!important}
    html.saralo-setting-readingRuler .saralo-reading-ruler{position:fixed!important;left:0!important;right:0!important;top:var(--saralo-y,45vh)!important;height:72px!important;z-index:2147483644!important;pointer-events:none!important;border-top:3px solid rgba(91,53,213,.55)!important;border-bottom:3px solid rgba(91,53,213,.55)!important;background:rgba(255,240,167,.18)!important;box-shadow:0 -999px 0 999px rgba(0,0,0,.16),0 999px 0 999px rgba(0,0,0,.16)!important}
    html.saralo-setting-syllableHighlight .saralo-syllable{background:linear-gradient(transparent 58%,rgba(255,216,74,.55) 0)!important;border-radius:3px!important}
    html.saralo-setting-readAlong .saralo-readalong-current{background:#2f1aa6!important;color:#fff!important;border-radius:6px!important;padding:1px 4px!important}
    html.saralo-mode-astigmatism{--saralo-astig-font:650;--saralo-astig-width:850px;--saralo-astig-glare:.08;--saralo-astig-sharp:1.08}
    html.saralo-mode-astigmatism main,html.saralo-mode-astigmatism article,html.saralo-mode-astigmatism [role="main"],html.saralo-mode-astigmatism .content,html.saralo-mode-astigmatism #content{max-width:var(--saralo-astig-width)!important;margin-inline:auto!important}
    html.saralo-mode-astigmatism p,html.saralo-mode-astigmatism li,html.saralo-mode-astigmatism a,html.saralo-mode-astigmatism span,html.saralo-mode-astigmatism h1,html.saralo-mode-astigmatism h2,html.saralo-mode-astigmatism h3{font-weight:var(--saralo-astig-font)!important;text-shadow:0 0 calc(1px * var(--saralo-astig-sharp)) rgba(0,0,0,.22)!important}
    html.saralo-mode-astigmatism body::before{content:""!important;position:fixed!important;inset:0!important;z-index:2147483640!important;pointer-events:none!important;background:rgba(255,248,228,var(--saralo-astig-glare))!important;mix-blend-mode:multiply!important}
    html.saralo-setting-reduceVisualNoise aside,html.saralo-setting-reduceVisualNoise footer,html.saralo-setting-reduceVisualNoise [class*="ad"],html.saralo-setting-reduceVisualNoise [id*="ad"],html.saralo-setting-reduceVisualNoise [class*="promo"],html.saralo-setting-reduceVisualNoise [class*="recommend"]{opacity:.45!important;filter:saturate(.65) contrast(.88)!important}
    html.saralo-setting-darkComfortMode body{background:#11100e!important;color:#f2ead8!important}
    html.saralo-mode-low-vision{--saralo-lowvision-cursor:48px}
    html.saralo-mode-low-vision.saralo-setting-darkHighContrastMode body{background:#000!important;color:#fff!important}
    html.saralo-mode-low-vision.saralo-setting-darkHighContrastMode a,html.saralo-mode-low-vision.saralo-setting-darkHighContrastMode button{background:#050505!important;color:#fff!important;border-color:#ffd400!important}
    html.saralo-mode-low-vision:not(.saralo-setting-highContrast) body{filter:none!important}
    html.saralo-mode-low-vision:not(.saralo-setting-simplifiedLayout) aside,html.saralo-mode-low-vision:not(.saralo-setting-simplifiedLayout) footer,html.saralo-mode-low-vision:not(.saralo-setting-simplifiedLayout) [role="complementary"]{max-height:none!important;opacity:1!important;filter:none!important;background:initial!important}
    html.saralo-setting-readSelectedText ::selection{background:#ffd400!important;color:#000!important}
    html.saralo-mode-colorblind{--saralo-colorblind-contrast:1.15}
    html.saralo-mode-colorblind body{filter:contrast(var(--saralo-colorblind-contrast))!important}
    html.saralo-setting-patternOverlay body::after{content:""!important;position:fixed!important;inset:0!important;z-index:2147483639!important;pointer-events:none!important;opacity:.12!important;background-image:repeating-linear-gradient(45deg,#000 0 1px,transparent 1px 9px)!important}
    html.saralo-setting-colorLabels a,html.saralo-setting-colorLabels button{position:relative!important}
    html.saralo-setting-colorLabels a::after,html.saralo-setting-colorLabels button::after{content:"link/action"!important;margin-left:6px!important;padding:2px 5px!important;border-radius:999px!important;background:#111!important;color:#fff!important;font:700 10px/1 system-ui!important}
    html.saralo-mode-cognitive-overload:not(.saralo-setting-removeAds) aside,html.saralo-mode-cognitive-overload:not(.saralo-setting-removeAds) footer,html.saralo-mode-cognitive-overload:not(.saralo-setting-removeAds) [role="complementary"],html.saralo-mode-cognitive-overload:not(.saralo-setting-removeAds) [class*="ad"],html.saralo-mode-cognitive-overload:not(.saralo-setting-removeAds) [id*="ad"]{max-height:none!important;opacity:1!important;filter:none!important}
    html.saralo-mode-cognitive-overload:not(.saralo-setting-hidePopups) .popup,html.saralo-mode-cognitive-overload:not(.saralo-setting-hidePopups) .modal,html.saralo-mode-cognitive-overload:not(.saralo-setting-hidePopups) [role="dialog"]{opacity:1!important;transform:none!important}
    html.saralo-setting-oneTaskAtATime main > *:not(.saralo-cog-card):not(:first-child),html.saralo-setting-oneTaskAtATime article > *:not(.saralo-cog-card):not(:first-child){opacity:.38!important}
    html.saralo-setting-simplifyForms form,html.saralo-setting-simplifyForms input,html.saralo-setting-simplifyForms select,html.saralo-setting-simplifyForms textarea{font-size:1.15rem!important;line-height:1.5!important;border-width:2px!important;border-radius:12px!important;padding:12px!important}
    html.saralo-setting-highlightImportant h1,html.saralo-setting-highlightImportant h2,html.saralo-setting-highlightImportant strong,html.saralo-setting-highlightImportant [aria-current],html.saralo-setting-highlightImportant [aria-label*="important" i]{background:#fff0b8!important;color:#111!important;border-radius:8px!important;padding-inline:4px!important}
    html.saralo-setting-calmDarkTheme body{background:#0f1117!important;color:#e8eaf2!important}
  `;
  const script = `
    (function(){
      var modes=['adhd','dyslexia','low-vision','astigmatism','colorblind','cognitive-overload'];
      window.__SARALO_VISIBLE_TEXT__=${JSON.stringify(visibleText)};
      window.__SARALO_LAST_PAYLOAD__=null;
      function getCleanSentences(){
        var text=(window.__SARALO_VISIBLE_TEXT__||document.body.innerText||'').replace(/\\s+/g,' ').trim();
        return text.split(/(?<=[.!?])\\s+/).map(function(sentence){return sentence.trim();}).filter(function(sentence){return sentence.length>35;}).slice(0,30);
      }
      function shortSentence(text,max){
        var clean=(text||'').replace(/\\s+/g,' ').trim();
        if(clean.length<=max)return clean;
        var cut=clean.slice(0,max);
        return cut.replace(/\\s+\\S*$/,'')+'...';
      }
      window.__SARALO_SETTINGS__={summaryMode:'standard',summaryLength:5};
      function getSummaryConfig(settings){
        settings=settings||window.__SARALO_SETTINGS__||{};
        var mode=['quick','standard','detailed','action'].includes(settings.summaryMode)?settings.summaryMode:'standard';
        var length=Math.max(3,Math.min(8,Number(settings.summaryLength||5)));
        return {mode:mode,length:length};
      }
      function buildSummaryPoints(settings){
        var config=getSummaryConfig(settings);
        var sentences=getCleanSentences();
        var points=sentences.slice(0,config.length);
        if(points.length<3){
          points=(document.body.innerText||'').split('\\n').map(function(line){return line.replace(/\\s+/g,' ').trim();}).filter(function(line){return line.length>28;}).slice(0,config.length);
        }
        if(points.length===0)points=['This page is open and ready. Use the page normally, or switch modes for clearer reading.'];
        return points.slice(0,config.length).map(function(point,index){
          var max=config.mode==='quick'?105:config.mode==='detailed'?230:config.mode==='action'?145:155;
          var text=shortSentence(point,max);
          if(config.mode==='action')return 'Step '+(index+1)+': '+text.replace(/^(learn|read|see|click|open)\\s+/i,'');
          return text;
        });
      }
      function summaryModeLabel(settings){
        var mode=getSummaryConfig(settings).mode;
        return mode==='quick'?'Quick summary':mode==='detailed'?'Detailed summary':mode==='action'?'Action steps':'Standard summary';
      }
      function renderSummaryCard(card,settings){
        var config=getSummaryConfig(settings);
        var points=buildSummaryPoints(settings);
        card.innerHTML='<h2>AI Summary</h2><p>'+summaryModeLabel(settings)+' for the page you are viewing now.</p><label>Mode <select data-summary-mode><option value="quick">Quick</option><option value="standard">Standard</option><option value="detailed">Detailed</option><option value="action">Action Steps</option></select></label><label>Length <select data-summary-length><option value="3">3 points</option><option value="4">4 points</option><option value="5">5 points</option><option value="6">6 points</option><option value="7">7 points</option><option value="8">8 points</option></select></label><ul>'+points.map(function(point){return '<li>'+escapeCogHtml(point)+'</li>';}).join('')+'</ul><button type="button" data-action="close-summary">Close</button>';
        var modeSelect=card.querySelector('[data-summary-mode]');
        var lengthSelect=card.querySelector('[data-summary-length]');
        if(modeSelect)modeSelect.value=config.mode;
        if(lengthSelect)lengthSelect.value=String(config.length);
      }
      function ensureGlobalAiSummary(){
        var card=document.getElementById('saralo-ai-summary-card');
        if(!card){
          card=document.createElement('section');
          card.id='saralo-ai-summary-card';
          card.className='saralo-ai-summary-card';
          card.setAttribute('role','region');
          card.setAttribute('aria-label','AI page summary');
          card.setAttribute('aria-live','polite');
          card.addEventListener('click',function(event){
            var target=event.target;
            if(target&&target.getAttribute&&target.getAttribute('data-action')==='close-summary')toggleGlobalAiSummary(false);
          });
          card.addEventListener('change',function(event){
            var target=event.target;
            if(!target||!target.getAttribute)return;
            if(target.getAttribute('data-summary-mode')!==null)window.__SARALO_SETTINGS__.summaryMode=target.value;
            if(target.getAttribute('data-summary-length')!==null)window.__SARALO_SETTINGS__.summaryLength=Number(target.value);
            renderSummaryCard(card,window.__SARALO_SETTINGS__);
            refineSummaryWithAi(card,window.__SARALO_SETTINGS__);
          });
          var anchor=document.querySelector('main,article,[role="main"],.content,#content')||document.body;
          anchor.insertBefore(card,anchor.firstChild);
        }
        renderSummaryCard(card,window.__SARALO_SETTINGS__);
        refineSummaryWithAi(card,window.__SARALO_SETTINGS__);
      }
      function toggleGlobalAiSummary(force){
        ensureGlobalAiSummary();
        var card=document.getElementById('saralo-ai-summary-card');
        if(!card)return;
        var open=typeof force==='boolean'?force:!card.classList.contains('is-open');
        card.classList.toggle('is-open',open);
        if(open)card.scrollTop=0;
      }
      function removeGlobalAiSummary(){
        var card=document.getElementById('saralo-ai-summary-card');
        if(card)card.remove();
      }
      var summaryAiCache={key:'',html:''};
      function refineSummaryWithAi(card,settings){
        if(!card||!window.fetch)return;
        var config=getSummaryConfig(settings);
        var pageText=(window.__SARALO_VISIBLE_TEXT__||document.body.innerText||'').replace(/\\s+/g,' ').trim().slice(0,12000);
        if(pageText.length<80)return;
        var key=config.mode+'|'+config.length+'|'+pageText.slice(0,900);
        if(summaryAiCache.key===key&&summaryAiCache.html){
          var list=card.querySelector('ul');
          if(list)list.innerHTML=summaryAiCache.html;
          return;
        }
        window.clearTimeout(window.__saraloSummaryAiTimer);
        window.__saraloSummaryAiTimer=window.setTimeout(function(){
          fetch('/api/simplify',{
            method:'POST',
            headers:{'Content-Type':'application/json','X-Saralo-Session':'iframe-summary'},
            body:JSON.stringify({url:location.href,pageText:pageText,summaryMode:config.mode,summaryLength:config.length})
          }).then(function(response){return response.json();}).then(function(data){
            if(!data||data.ok===false||data.error)return;
            var points=Array.isArray(data.primaryActions)&&data.primaryActions.length?data.primaryActions:String(data.summary||'').split(/(?<=[.!?])\\s+/);
            points=points.map(function(point){return String(point||'').replace(/\\s+/g,' ').trim();}).filter(Boolean).slice(0,config.length);
            if(points.length===0)return;
            var html=points.map(function(point){return '<li>'+escapeCogHtml(shortSentence(point,config.mode==='detailed'?230:170))+'</li>';}).join('');
            summaryAiCache={key:key,html:html};
            var list=card.querySelector('ul');
            if(list)list.innerHTML=html;
          }).catch(function(){});
        },320);
      }
      function ensureCognitiveReader(){
        var primary=findPrimaryAction();
        if(primary)primary.classList.add('saralo-cog-primary');
      }
      function removeCognitiveReader(){
        document.querySelectorAll('.saralo-cog-simplified').forEach(function(node){
          var original=node.querySelector('.saralo-cog-original');
          if(original)node.textContent=original.textContent||node.textContent||'';
          node.classList.remove('saralo-cog-simplified','is-expanded');
        });
        document.querySelectorAll('.saralo-cog-primary').forEach(function(node){node.classList.remove('saralo-cog-primary');});
      }
      function toggleCogSimplification(button){
        var pressed=button.getAttribute('aria-pressed')==='true';
        button.setAttribute('aria-pressed',String(!pressed));
        document.querySelectorAll('.saralo-cog-simplified').forEach(function(node){node.classList.toggle('is-expanded',pressed);});
      }
      function readCognitivePage(){
        if(!('speechSynthesis' in window))return;
        window.speechSynthesis.cancel();
        var text=(window.__SARALO_VISIBLE_TEXT__||document.body.innerText||'').replace(/\\s+/g,' ').trim().slice(0,5000);
        if(!text)return;
        var utterance=new SpeechSynthesisUtterance(text);
        utterance.rate=.88;
        window.speechSynthesis.speak(utterance);
      }
      function simplifyLongParagraphs(){
        Array.from(document.querySelectorAll('main p,article p,[role="main"] p,.content p,#content p')).slice(0,80).forEach(function(p){
          if(p.closest('#saralo-cog-card')||p.classList.contains('saralo-cog-simplified'))return;
          var full=(p.textContent||'').replace(/\\s+/g,' ').trim();
          if(full.length<190)return;
          var short=shortSentence(full,155);
          p.classList.add('saralo-cog-simplified');
          p.innerHTML='<span>'+escapeCogHtml(short)+'</span><span class="saralo-cog-original">'+escapeCogHtml(full)+'</span><button class="saralo-cog-expand" type="button">Show full text</button>';
          var button=p.querySelector('.saralo-cog-expand');
          button&&button.addEventListener('click',function(){
            var expanded=p.classList.toggle('is-expanded');
            button.textContent=expanded?'Show concise version':'Show full text';
          });
        });
      }
      function findPrimaryAction(){
        var selectors=['main a[href]','article a[href]','[role="main"] a[href]','main button','article button','[role="main"] button'];
        for(var i=0;i<selectors.length;i+=1){
          var found=Array.from(document.querySelectorAll(selectors[i])).find(function(node){
            var rect=node.getBoundingClientRect();
            var text=(node.innerText||node.textContent||node.getAttribute('aria-label')||'').trim();
            return rect.width>20&&rect.height>12&&text.length>0;
          });
          if(found)return found;
        }
        return null;
      }
      function escapeCogHtml(value){
        return String(value).replace(/[&<>"']/g,function(char){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]||char;});
      }
      function ensureLowVisionRuntime(settings){
        installLowVisionMagnifier();
        if(settings&&settings.readSelectedText)installReadSelectedText();
        if(settings&&settings.magnifier)toggleLowVisionMagnifier(true);
        else toggleLowVisionMagnifier(false);
        if(settings&&settings.ocrImageReader)enableLowVisionImageReader(true);
        else enableLowVisionImageReader(false);
        if(settings&&settings.screenReader)readLowVisionPageOnce();
        else document.documentElement.dataset.saraloLowVisionScreenReaderKey='';
      }
      function removeLowVisionRuntime(){
        ['saralo-lowvision-magnifier'].forEach(function(id){
          var node=document.getElementById(id);
          if(node)node.remove();
        });
        document.querySelectorAll('.saralo-lowvision-image-reader').forEach(function(node){node.remove();});
        document.documentElement.dataset.saraloLowVisionMagnifier='off';
        document.documentElement.dataset.saraloLowVisionImageReader='off';
        document.documentElement.classList.remove('saralo-setting-simplifiedLayout');
        document.querySelectorAll('img[data-saralo-lowvision-image-reader="1"]').forEach(function(img){img.style.cursor='';delete img.dataset.saraloLowvisionImageReader;});
        if('speechSynthesis' in window)window.speechSynthesis.cancel();
      }
      function adjustLowVisionZoom(delta){
        var root=document.documentElement;
        var stored='1.2';
        try{stored=localStorage.getItem('saralo.lowvision.zoom')||'1.2';}catch{}
        var current=parseFloat(root.dataset.saraloLowVisionZoom||stored||'1.2');
        var next=Math.max(1.05,Math.min(1.65,Math.round((current+delta)*100)/100));
        document.documentElement.dataset.saraloLowVisionZoom=String(next);
        root.style.setProperty('--saralo-lowvision-zoom',String(next));
        try{localStorage.setItem('saralo.lowvision.zoom',String(next));}catch{}
      }
      function readLowVisionPage(){
        if(!('speechSynthesis' in window))return;
        window.speechSynthesis.cancel();
        var text=(window.__SARALO_VISIBLE_TEXT__||document.body.innerText||'').replace(/\\s+/g,' ').trim().slice(0,6000);
        if(!text)return;
        var utterance=new SpeechSynthesisUtterance(text);
        utterance.rate=.86;
        utterance.volume=1;
        window.speechSynthesis.speak(utterance);
      }
      function readLowVisionPageOnce(){
        if(!('speechSynthesis' in window))return;
        var text=(window.__SARALO_VISIBLE_TEXT__||document.body.innerText||'').replace(/\\s+/g,' ').trim();
        if(!text)return;
        var key=text.slice(0,180);
        if(document.documentElement.dataset.saraloLowVisionScreenReaderKey===key)return;
        document.documentElement.dataset.saraloLowVisionScreenReaderKey=key;
        window.setTimeout(function(){
          if(!document.documentElement.classList.contains('saralo-mode-low-vision')||!document.documentElement.classList.contains('saralo-setting-screenReader'))return;
          readLowVisionPage();
        },450);
      }
      function readLowVisionSelection(){
        if(!('speechSynthesis' in window))return;
        var text=String(window.getSelection&&window.getSelection()||'').replace(/\\s+/g,' ').trim();
        if(!text)return;
        window.speechSynthesis.cancel();
        var utterance=new SpeechSynthesisUtterance(text.slice(0,1600));
        utterance.rate=.86;
        window.speechSynthesis.speak(utterance);
      }
      function toggleLowVisionMagnifier(force){
        var root=document.documentElement;
        var on=root.dataset.saraloLowVisionMagnifier==='on';
        var next=typeof force==='boolean'?force:!on;
        root.dataset.saraloLowVisionMagnifier=next?'on':'off';
        var lens=document.getElementById('saralo-lowvision-magnifier');
        if(next&&!lens){
          lens=document.createElement('div');
          lens.id='saralo-lowvision-magnifier';
          lens.className='saralo-lowvision-magnifier';
          lens.textContent='Move over text to magnify it.';
          document.body.appendChild(lens);
        }else if(!next&&lens){
          lens.remove();
        }
      }
      function installLowVisionMagnifier(){
        if(document.documentElement.dataset.saraloLowVisionMagnifierInstalled==='1')return;
        document.documentElement.dataset.saraloLowVisionMagnifierInstalled='1';
        document.addEventListener('mousemove',function(event){
          if(!document.documentElement.classList.contains('saralo-mode-low-vision'))return;
          if(document.documentElement.dataset.saraloLowVisionMagnifier!=='on')return;
          var lens=document.getElementById('saralo-lowvision-magnifier');
          if(!lens)return;
          var target=event.target;
          var text=((target.getAttribute&&target.getAttribute('aria-label'))||target.innerText||target.alt||target.title||target.textContent||'').replace(/\\s+/g,' ').trim();
          if(text){lens.textContent=text.slice(0,220);}
          var left=event.clientX+28;
          var top=event.clientY+28;
          if(left>window.innerWidth-480)left=event.clientX-480;
          if(top>window.innerHeight-170)top=event.clientY-170;
          lens.style.left=Math.max(16,left)+'px';
          lens.style.top=Math.max(16,top)+'px';
        },{passive:true});
      }
      function enableLowVisionImageReader(force){
        var next=typeof force==='boolean'?(force?'on':'off'):(document.documentElement.dataset.saraloLowVisionImageReader==='on'?'off':'on');
        document.documentElement.dataset.saraloLowVisionImageReader=next;
        document.querySelectorAll('.saralo-lowvision-image-reader').forEach(function(node){node.remove();});
        if(next!=='on'){
          document.querySelectorAll('img[data-saralo-lowvision-image-reader="1"]').forEach(function(img){img.style.cursor='';delete img.dataset.saraloLowvisionImageReader;});
          return;
        }
        Array.from(document.images||[]).slice(0,120).forEach(function(img,index){
          img.style.cursor='help';
          img.dataset.saraloLowvisionImageReader='1';
          img.addEventListener('click',function(event){
            if(document.documentElement.dataset.saraloLowVisionImageReader!=='on')return;
            event.preventDefault();
            event.stopPropagation();
            readLowVisionImage(img,index,event);
          },{once:false});
        });
      }
      function readLowVisionImage(img,index,event){
        document.querySelectorAll('.saralo-lowvision-image-reader').forEach(function(node){node.remove();});
        var text=(img.alt||img.title||img.getAttribute('aria-label')||('Image '+(index+1)+' selected. No embedded description was available.')).replace(/\\s+/g,' ').trim();
        var label=document.createElement('div');
        label.className='saralo-lowvision-image-reader';
        label.textContent='Read Image: '+text;
        document.body.appendChild(label);
        label.style.left=Math.min(window.innerWidth-360,event.clientX+12)+'px';
        label.style.top=Math.min(window.innerHeight-90,event.clientY+12)+'px';
        if('speechSynthesis' in window){
          window.speechSynthesis.cancel();
          var utterance=new SpeechSynthesisUtterance(text);
          utterance.rate=.86;
          window.speechSynthesis.speak(utterance);
        }
      }
      function resetLowVisionSuite(){
        var root=document.documentElement;
        root.dataset.saraloLowVisionMagnifier='off';
        root.dataset.saraloLowVisionImageReader='off';
        root.dataset.saraloLowVisionZoom='1.2';
        root.style.setProperty('--saralo-lowvision-zoom','1.2');
        root.classList.remove('saralo-setting-simplifiedLayout');
        document.getElementById('saralo-lowvision-magnifier')?.remove();
        document.querySelectorAll('.saralo-lowvision-image-reader').forEach(function(node){node.remove();});
        document.querySelectorAll('img[data-saralo-lowvision-image-reader="1"]').forEach(function(img){img.style.cursor='';delete img.dataset.saraloLowvisionImageReader;});
        if('speechSynthesis' in window)window.speechSynthesis.cancel();
        try{localStorage.setItem('saralo.lowvision.zoom','1.2');}catch{}
      }
      var settingKeys=['hideSidebar','hideImages','reduceAnimations','chunkParagraphs','highlightActiveParagraph','dyslexiaFont','readingRuler','syllableHighlight','readAlong','reduceVisualNoise','magnifier','highContrast','screenReader','readSelectedText','ocrImageReader','simplifiedLayout','colorLabels','patternOverlay','simplifyLanguage','aiSummary','removeAds','hidePopups','oneTaskAtATime','simplifyForms','highlightImportant'];
      function applySettingClasses(settings){
        settingKeys.forEach(function(key){document.documentElement.classList.toggle('saralo-setting-'+key,Boolean(settings&&settings[key]));});
        ['darkMode','darkComfortMode','darkHighContrastMode','calmDarkTheme'].forEach(function(key){document.documentElement.classList.remove('saralo-setting-'+key);});
        ['light','dark','auto'].forEach(function(theme){document.documentElement.classList.remove('saralo-setting-theme-'+theme);});
        if(settings&&settings.theme&&settings.theme!=='auto')document.documentElement.classList.add('saralo-setting-theme-'+settings.theme);
        ['light','dark'].forEach(function(theme){document.documentElement.classList.remove('saralo-setting-warmReadingTheme-'+theme);});
        if(settings&&settings.warmReadingTheme)document.documentElement.classList.add('saralo-setting-warmReadingTheme-'+settings.warmReadingTheme);
      }
      function setVar(name,value){document.documentElement.style.setProperty(name,String(value));}
      function clearModeVars(){
        ['--saralo-letter-spacing','--saralo-word-spacing','--saralo-line-height','--saralo-astig-font','--saralo-astig-width','--saralo-astig-glare','--saralo-astig-sharp','--saralo-lowvision-text','--saralo-lowvision-heading','--saralo-lowvision-button','--saralo-lowvision-icon','--saralo-lowvision-cursor','--saralo-colorblind-contrast'].forEach(function(name){document.documentElement.style.removeProperty(name);});
      }
      function applySettingVars(settings){
        clearModeVars();
        settings=settings||{};
        setVar('--saralo-letter-spacing',((settings.spacing||50)/1000)+'em');
        setVar('--saralo-word-spacing',((settings.wordSpacing||110)/700)+'em');
        setVar('--saralo-line-height',String((settings.lineHeight||170)/100));
        setVar('--saralo-astig-font',String(settings.fontThickness||650));
        setVar('--saralo-astig-width',(settings.readingWidth||850)+'px');
        setVar('--saralo-astig-glare',String(Math.max(0,Math.min(100,settings.antiGlare||0))/700));
        setVar('--saralo-astig-sharp',String(1+Math.max(0,Math.min(100,settings.textSharpness||0))/500));
        var textSize=(settings.textSize||190)/100;
        setVar('--saralo-lowvision-text',String(textSize));
        setVar('--saralo-lowvision-heading',String(Math.max(textSize,2.05)));
        setVar('--saralo-lowvision-button',String((settings.buttonSize||160)/100));
        setVar('--saralo-lowvision-icon',String((settings.iconSize||145)/100));
        setVar('--saralo-lowvision-cursor',Math.round(32*((settings.cursorSize||180)/120))+'px');
        setVar('--saralo-colorblind-contrast',String((settings.contrastBoost||115)/100));
        if(settings.language&&settings.language!=='auto')document.documentElement.lang=settings.language;
      }
      function ensureReadingRuler(on){
        var node=document.getElementById('saralo-reading-ruler');
        if(on&&!node){
          node=document.createElement('div');
          node.id='saralo-reading-ruler';
          node.className='saralo-reading-ruler';
          document.body.appendChild(node);
        }else if(!on&&node){
          node.remove();
        }
      }
      function ensureLowVisionOptions(settings){
        if(Boolean(settings.magnifier)!==(document.documentElement.dataset.saraloLowVisionMagnifier==='on'))toggleLowVisionMagnifier(Boolean(settings.magnifier));
        if(Boolean(settings.ocrImageReader)!==(document.documentElement.dataset.saraloLowVisionImageReader==='on'))enableLowVisionImageReader(Boolean(settings.ocrImageReader));
        if(settings.readSelectedText)installReadSelectedText();
      }
      function installReadSelectedText(){
        if(document.documentElement.dataset.saraloReadSelectedInstalled==='1')return;
        document.documentElement.dataset.saraloReadSelectedInstalled='1';
        document.addEventListener('mouseup',function(){
          if(!document.documentElement.classList.contains('saralo-setting-readSelectedText'))return;
          var text=String(window.getSelection&&window.getSelection()||'').replace(/\\s+/g,' ').trim();
          if(text.length<2||!('speechSynthesis' in window))return;
          window.speechSynthesis.cancel();
          var utterance=new SpeechSynthesisUtterance(text.slice(0,1200));
          utterance.rate=.86;
          window.speechSynthesis.speak(utterance);
        });
      }
      function applyDyslexiaRuntime(settings){
        ensureReadingRuler(Boolean(settings.readingRuler));
        if(settings.syllableHighlight)highlightSyllables();
        else document.querySelectorAll('.saralo-syllable').forEach(function(node){node.replaceWith(document.createTextNode(node.textContent||''));});
        if(settings.readAlong)startReadAlong();
        else stopReadAlong();
      }
      function highlightSyllables(){
        Array.from(document.querySelectorAll('main p,article p,[role="main"] p,.content p,#content p')).slice(0,45).forEach(function(p){
          if(p.dataset.saraloSyllables==='1'||p.closest('.saralo-ai-summary-card,.saralo-cog-card'))return;
          var text=p.textContent||'';
          if(text.length<20||text.length>700)return;
          p.dataset.saraloOriginal=text;
          p.dataset.saraloSyllables='1';
          p.innerHTML=escapeCogHtml(text).replace(/([aeiouy]{1,2})/gi,'<span class="saralo-syllable">$1</span>');
        });
      }
      function startReadAlong(){
        if(document.documentElement.dataset.saraloReadAlong==='1')return;
        document.documentElement.dataset.saraloReadAlong='1';
        var nodes=Array.from(document.querySelectorAll('main p,article p,[role="main"] p,.content p,#content p')).filter(function(node){return (node.textContent||'').trim().length>20;}).slice(0,30);
        var index=0;
        window.clearInterval(window.__saraloReadAlongTimer);
        window.__saraloReadAlongTimer=window.setInterval(function(){
          document.querySelectorAll('.saralo-readalong-current').forEach(function(node){node.classList.remove('saralo-readalong-current');});
          if(!document.documentElement.classList.contains('saralo-setting-readAlong')||nodes.length===0){stopReadAlong();return;}
          nodes[index%nodes.length].classList.add('saralo-readalong-current');
          index+=1;
        },1400);
      }
      function stopReadAlong(){
        document.documentElement.dataset.saraloReadAlong='0';
        window.clearInterval(window.__saraloReadAlongTimer);
        document.querySelectorAll('.saralo-readalong-current').forEach(function(node){node.classList.remove('saralo-readalong-current');});
      }
      function applyCognitiveRuntime(settings){
        if(settings.simplifyLanguage)simplifyLongParagraphs();
        if(settings.simplifyLanguage)ensureCognitiveReader();
        removeGlobalAiSummary();
      }
      function refreshActiveRuntime(){
        var payload=window.__SARALO_LAST_PAYLOAD__;
        if(!payload||!payload.mode)return;
        var settings=payload.settings||{};
        applySettingClasses(settings);
        applySettingVars(settings);
        if(payload.mode==='low-vision')ensureLowVisionOptions(settings);
        if(payload.mode==='dyslexia')applyDyslexiaRuntime(settings);
        if(payload.mode==='cognitive-overload')applyCognitiveRuntime(settings);
      }
      function scheduleRuntimeRefresh(){
        window.clearTimeout(window.__saraloRuntimeRefreshTimer);
        window.__saraloRuntimeRefreshTimer=window.setTimeout(refreshActiveRuntime,180);
      }
      function apply(payload){
        var root=document.documentElement;
        var settings=payload&&payload.settings||{};
        window.__SARALO_LAST_PAYLOAD__=payload||null;
        window.__SARALO_SETTINGS__={...window.__SARALO_SETTINGS__,...settings};
        modes.forEach(function(mode){root.classList.remove('saralo-mode-'+mode);});
        ['protanopia','deuteranopia','tritanopia','achromatopsia'].forEach(function(type){root.classList.remove('saralo-mode-colorblind-'+type);});
        removeLowVisionRuntime();
        removeCognitiveReader();
        ensureReadingRuler(false);
        stopReadAlong();
        applySettingClasses(settings);
        applySettingVars(settings);
        root.style.removeProperty('--saralo-lowvision-zoom');
        if(!payload||!payload.mode)return;
        root.classList.add('saralo-mode-'+payload.mode);
        if(payload.mode==='dyslexia'){applyDyslexiaRuntime(settings);}
        if(payload.mode==='low-vision'){adjustLowVisionZoom(0);ensureLowVisionRuntime(settings);ensureLowVisionOptions(settings);}
        if(payload.mode==='cognitive-overload'){ensureCognitiveReader();applyCognitiveRuntime(settings);}
        if(payload.mode==='colorblind'){root.classList.add('saralo-mode-colorblind-'+(settings.colorblindType||payload.colorblindType||'protanopia'));}
      }
      function installProxyNavigation(){
        if(document.documentElement.dataset.saraloProxyNavigationInstalled==='1')return;
        document.documentElement.dataset.saraloProxyNavigationInstalled='1';
        document.addEventListener('click',function(event){
          var link=event.target&&event.target.closest&&event.target.closest('a[href]');
          if(!link||link.target==='_blank'||event.defaultPrevented)return;
          var raw=link.getAttribute('href')||'';
          if(!raw||raw.startsWith('#')||/^(mailto:|tel:|javascript:)/i.test(raw))return;
          try{
            var next=new URL(link.href,document.baseURI);
            if(!/^https?:$/.test(next.protocol))return;
            if(next.origin===window.location.origin&&next.pathname==='/api/proxy'&&next.searchParams.get('url'))return;
            event.preventDefault();
            window.location.href=window.location.origin+'/api/proxy?url='+encodeURIComponent(next.toString());
          }catch{}
        },true);
      }
      function installSummaryRefresh(){
        if(document.documentElement.dataset.saraloSummaryRefreshInstalled==='1')return;
        document.documentElement.dataset.saraloSummaryRefreshInstalled='1';
        var timer=null;
        var lastText=window.__SARALO_VISIBLE_TEXT__||'';
        var refresh=function(){
          window.clearTimeout(timer);
          timer=window.setTimeout(function(){
            var nextText=(document.body.innerText||'').replace(/\\s+/g,' ').trim().slice(0,12000);
            if(nextText===lastText)return;
            lastText=nextText;
            window.__SARALO_VISIBLE_TEXT__=nextText;
            var card=document.getElementById('saralo-ai-summary-card');
            if(card)renderSummaryCard(card,window.__SARALO_SETTINGS__);
            scheduleRuntimeRefresh();
          },250);
        };
        new MutationObserver(refresh).observe(document.documentElement,{childList:true,subtree:true,characterData:true});
        window.addEventListener('popstate',refresh);
        window.addEventListener('hashchange',refresh);
      }
      window.addEventListener('message',function(event){
        if(!event.data||event.data.type!=='SARALO_APPLY_MODE')return;
        apply(event.data);
      });
      window.addEventListener('load',scheduleRuntimeRefresh);
      document.addEventListener('DOMContentLoaded',scheduleRuntimeRefresh);
      installProxyNavigation();
      installSummaryRefresh();
      (function(){
        var raf=null,lastEv=null;
        document.addEventListener('mousemove',function(event){
          lastEv=event;
          if(raf)return;
          raf=requestAnimationFrame(function(){
            raf=null;
            var e=lastEv;
            if(!e)return;
            document.documentElement.style.setProperty('--saralo-x',e.clientX+'px');
            document.documentElement.style.setProperty('--saralo-y',e.clientY+'px');
            // Relay coordinates to the parent page so the ADHD focus
            // spotlight (rendered outside this iframe, in the parent
            // document) can keep tracking the cursor while it's over
            // the actual proxied page content. Without this, the
            // parent's mousemove listener never fires here (separate
            // document/window), which is what caused the spotlight to
            // freeze/appear stuck as soon as the mouse entered the page.
            if(window.parent&&window.parent!==window){
              window.parent.postMessage({type:'SARALO_MOUSE_MOVE',x:e.clientX,y:e.clientY},'*');
            }
          });
        },{passive:true});
      })();
      window.parent&&window.parent.postMessage({type:'SARALO_PROXY_READY',text:window.__SARALO_VISIBLE_TEXT__},'*');
    })();
  `;
  const svg = `<svg aria-hidden="true" style="position:absolute;width:0;height:0"><defs>
    <filter id="saralo-protanopia"><feColorMatrix type="matrix" values="0.567 0.433 0 0 0 0.558 0.442 0 0 0 0 0.242 0.758 0 0 0 0 0 1 0"/></filter>
    <filter id="saralo-deuteranopia"><feColorMatrix type="matrix" values="0.625 0.375 0 0 0 0.7 0.3 0 0 0 0 0.3 0.7 0 0 0 0 0 1 0"/></filter>
    <filter id="saralo-tritanopia"><feColorMatrix type="matrix" values="0.95 0.05 0 0 0 0 0.433 0.567 0 0 0 0.475 0.525 0 0 0 0 0 1 0"/></filter>
    <filter id="saralo-achromatopsia"><feColorMatrix type="matrix" values="0.299 0.587 0.114 0 0 0.299 0.587 0.114 0 0 0.299 0.587 0.114 0 0 0 0 0 1 0"/></filter>
  </defs></svg>`;
  return `${svg}<style id="saralo-mode-engine-css">${css}</style><script id="saralo-mode-engine">${script}<\/script>`;
}

function injectModeEngine(html: string, finalUrl: string, visibleText: string) {
  const baseTag = `<base href="${escapeHtml(finalUrl)}">`;
  let nextHtml = html;
  if (/<head[^>]*>/i.test(nextHtml)) {
    nextHtml = nextHtml.replace(/<head[^>]*>/i, (match) => `${match}${baseTag}`);
  } else {
    nextHtml = `${baseTag}${nextHtml}`;
  }
  const snippet = modeEngineSnippet(visibleText);
  if (/<\/body>/i.test(nextHtml)) {
    return nextHtml.replace(/<\/body>/i, `${snippet}</body>`);
  }
  return `${nextHtml}${snippet}`;
}

function parseSimplifyText(text: string): SimplifyResponse {
  try {
    const parsed = JSON.parse(text) as Partial<SimplifyResponse>;
    return {
      summary: String(parsed.summary || '').slice(0, 1200),
      primaryActions: Array.isArray(parsed.primaryActions)
        ? parsed.primaryActions.map(String).slice(0, 5)
        : [],
      ok: true,
    };
  } catch {
    return {
      summary: text.replace(/\s+/g, ' ').trim().slice(0, 1200),
      primaryActions: [],
      ok: true,
    };
  }
}

function normalizeSummaryMode(value: unknown): SummaryMode {
  return value === 'quick' || value === 'detailed' || value === 'action' ? value : 'standard';
}

function normalizeSummaryLength(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(3, Math.min(8, Math.round(value))) : 5;
}

async function callSimplifyLlm(url: string, pageText: string, summaryMode: SummaryMode, summaryLength: number): Promise<SimplifyResponse> {
  if (process.env.SARALO_SIMULATE_LLM_TIMEOUT === '1') {
    await sleep(9000);
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return {
      summary: pageText.split(/[.!?]\s+/).slice(0, 3).join('. ').slice(0, 800),
      primaryActions: ['Read the main content', 'Look for the next important button', 'Avoid popups or ads'],
      ok: true,
    };
  }

  const prompt = [
    'You simplify web pages for accessibility users. Return strict JSON only.',
    'Schema: {"summary":"plain language summary","primaryActions":["short action", "..."]}',
    `Summary mode: ${summaryMode}`,
    `Summary length: ${summaryLength} bullet-worthy points`,
    summaryMode === 'quick' ? 'Use very short, plain sentences.' : '',
    summaryMode === 'detailed' ? 'Include more context and important specifics while staying readable.' : '',
    summaryMode === 'action' ? 'Focus on what the user can do next. Write primaryActions as ordered next steps.' : '',
    `URL: ${url}`,
    `Page text: ${pageText}`,
  ].filter(Boolean).join('\n\n');

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.2, maxOutputTokens: 700 },
    }),
  });

  if (!response.ok) throw new Error(`llm_${response.status}`);
  const data = await response.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
  const text = data.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('').trim();
  if (!text) throw new Error('empty_llm_response');
  return parseSimplifyText(text.replace(/^```json\s*|\s*```$/g, ''));
}

async function simplifyWithRetries(url: string, pageText: string, summaryMode: SummaryMode, summaryLength: number) {
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await withTimeout(callSimplifyLlm(url, pageText, summaryMode, summaryLength), 8000);
    } catch (error) {
      lastError = error;
      if (attempt < 2) await sleep(300 * 2 ** attempt);
    }
  }
  throw lastError;
}

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'iframe-proxy',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          const urlObj = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
          if (urlObj.pathname === '/api/health') {
            sendJson(res, 200, { ok: true, status: 'up', timestamp: new Date().toISOString() });
            return;
          }

          if (urlObj.pathname.startsWith('/api/adhd/')) {
            const requestId = adhdRequestId();
            const started = Date.now();
            const sessionKey = getSessionKey(req);
            const sessionHash = hashForLog(sessionKey);
            const finishLog = (status: number, outcome: Record<string, unknown> = {}) => {
              logAdhd('adhd_response', { requestId, path: urlObj.pathname, method: req.method, status, sessionHash, elapsedMs: Date.now() - started, ...outcome });
            };

            try {
              logAdhd('adhd_request', { requestId, path: urlObj.pathname, method: req.method, sessionHash });

              if (urlObj.pathname === '/api/adhd/read-time') {
                if (req.method !== 'POST') {
                  finishLog(405);
                  sendApiError(res, 405, 'method_not_allowed', 'Use POST for ADHD read-time.', requestId);
                  return;
                }
                const body = await readJsonBody(req) as { pageText?: unknown };
                const pageText = validateAdhdPageText(body.pageText);
                const wordCount = countWords(pageText);
                const estimatedMinutes = Math.max(1, Math.ceil(wordCount / 200));
                finishLog(200, { wordCount, estimatedMinutes });
                sendJson(res, 200, { ok: true, estimatedMinutes, wordCount, wordsPerMinute: 200 });
                return;
              }

              if (urlObj.pathname === '/api/adhd/declutter-config') {
                if (req.method !== 'GET') {
                  finishLog(405);
                  sendApiError(res, 405, 'method_not_allowed', 'Use GET for ADHD declutter config.', requestId);
                  return;
                }
                finishLog(200, { version: adhdDeclutterConfig.version });
                sendJson(res, 200, { ok: true, config: adhdDeclutterConfig });
                return;
              }

              if (urlObj.pathname === '/api/adhd/palette') {
                if (req.method !== 'GET') {
                  finishLog(405);
                  sendApiError(res, 405, 'method_not_allowed', 'Use GET for ADHD palette.', requestId);
                  return;
                }
                finishLog(200, { version: adhdPalette.version });
                sendJson(res, 200, { ok: true, palette: adhdPalette });
                return;
              }

              if (urlObj.pathname === '/api/adhd/bookmarks') {
                if (!['GET', 'POST'].includes(req.method || '')) {
                  finishLog(405);
                  sendApiError(res, 405, 'method_not_allowed', 'Use GET or POST for ADHD bookmarks.', requestId);
                  return;
                }
                if (!checkMapRateLimit(adhdBookmarkRateLimits, sessionKey, 30, RATE_LIMIT_WINDOW_MS)) {
                  finishLog(429);
                  sendApiError(res, 429, 'rate_limited', 'Too many bookmark requests. Please wait and try again.', requestId);
                  return;
                }
                const store = adhdBookmarks.get(sessionKey) ?? new Map<string, AdhdBookmark>();
                adhdBookmarks.set(sessionKey, store);

                if (req.method === 'GET') {
                  const bookmarks = Array.from(store.values()).sort((a, b) => b.timestamp.localeCompare(a.timestamp));
                  finishLog(200, { count: bookmarks.length });
                  sendJson(res, 200, { ok: true, bookmarks });
                  return;
                }

                const body = await readJsonBody(req) as { url?: unknown; scrollPosition?: unknown; timestamp?: unknown };
                const url = validateUrl(body.url);
                const scrollPosition = validateScrollPosition(body.scrollPosition);
                const timestamp = validateTimestamp(body.timestamp);
                const bookmark: AdhdBookmark = {
                  id: createAdhdBookmarkId(url, timestamp),
                  url,
                  scrollPosition,
                  timestamp,
                };
                store.set(bookmark.id, bookmark);
                finishLog(201, { bookmarkId: bookmark.id, urlHash: hashForLog(url) });
                sendJson(res, 201, { ok: true, bookmark });
                return;
              }

              const bookmarkDeleteMatch = urlObj.pathname.match(/^\/api\/adhd\/bookmarks\/([^/]+)$/);
              if (bookmarkDeleteMatch) {
                if (req.method !== 'DELETE') {
                  finishLog(405);
                  sendApiError(res, 405, 'method_not_allowed', 'Use DELETE for an ADHD bookmark item.', requestId);
                  return;
                }
                if (!checkMapRateLimit(adhdBookmarkRateLimits, sessionKey, 30, RATE_LIMIT_WINDOW_MS)) {
                  finishLog(429);
                  sendApiError(res, 429, 'rate_limited', 'Too many bookmark requests. Please wait and try again.', requestId);
                  return;
                }
                const bookmarkId = validateBookmarkId(decodeURIComponent(bookmarkDeleteMatch[1]));
                const store = adhdBookmarks.get(sessionKey);
                const deleted = Boolean(store?.delete(bookmarkId));
                finishLog(deleted ? 200 : 404, { bookmarkId });
                if (!deleted) {
                  sendApiError(res, 404, 'not_found', 'Bookmark was not found for this session.', requestId);
                  return;
                }
                sendJson(res, 200, { ok: true, deleted: true, id: bookmarkId });
                return;
              }

              if (urlObj.pathname === '/api/adhd/timer-state') {
                if (!['GET', 'POST'].includes(req.method || '')) {
                  finishLog(405);
                  sendApiError(res, 405, 'method_not_allowed', 'Use GET or POST for ADHD timer state.', requestId);
                  return;
                }
                if (req.method === 'GET') {
                  const timerState = adhdTimerStates.get(sessionKey) ?? {
                    status: 'idle',
                    durationMinutes: 25,
                    remainingSeconds: 25 * 60,
                    updatedAt: new Date().toISOString(),
                  } satisfies AdhdTimerState;
                  finishLog(200, { status: timerState.status });
                  sendJson(res, 200, { ok: true, timerState });
                  return;
                }
                const body = await readJsonBody(req) as Record<string, unknown>;
                const timerState = validateTimerState(body);
                adhdTimerStates.set(sessionKey, timerState);
                finishLog(200, { status: timerState.status });
                sendJson(res, 200, { ok: true, timerState });
                return;
              }

              finishLog(404);
              sendApiError(res, 404, 'not_found', 'ADHD endpoint not found.', requestId);
              return;
            } catch (error) {
              const message = error instanceof Error ? error.message : 'Unexpected ADHD endpoint error';
              const code = message === 'malformed_json' ? 'malformed_json' : message === 'request_body_too_large' ? 'request_too_large' : 'validation_error';
              const status = code === 'request_too_large' ? 413 : 400;
              finishLog(status, { error: code });
              sendApiError(res, status, code, message.replace(/_/g, ' '), requestId);
              return;
            }
          }

          if (urlObj.pathname === '/api/simplify') {
            const requestId = stableRequestId();
            const clientKey = String(req.headers['x-saralo-session'] || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'anonymous');
            if (req.method !== 'POST') {
              sendJson(res, 405, { ok: false, error: 'Method not allowed' });
              return;
            }
            if (!checkRateLimit(clientKey)) {
              sendJson(res, 429, { ok: false, summary: '', primaryActions: [], error: SIMPLIFY_ERROR });
              return;
            }

            let rawBody = '';
            req.on('data', (chunk) => {
              rawBody += chunk;
              if (rawBody.length > 200000) req.destroy();
            });
            req.on('end', async () => {
              const started = Date.now();
              try {
                const body = JSON.parse(rawBody || '{}') as { url?: unknown; pageText?: unknown; summaryMode?: unknown; summaryLength?: unknown };
                const url = validateUrl(body.url);
                const pageText = sanitizeOptionalPageText(body.pageText, proxyCache.get(url)?.visibleText || '');
                const summaryMode = normalizeSummaryMode(body.summaryMode);
                const summaryLength = normalizeSummaryLength(body.summaryLength);
                const cacheKey = `${url}#${summaryMode}:${summaryLength}`;
                const modeCached = simplifyCache.get(cacheKey);
                logSimplify('simplify_request', { requestId, urlHash: hashForLog(url), textChars: pageText.length, summaryMode, summaryLength, cacheHit: Boolean(modeCached && modeCached.expiresAt > Date.now()) });

                if (modeCached && modeCached.expiresAt > Date.now()) {
                  sendJson(res, 200, { ...modeCached.body, cached: true });
                  return;
                }

                const simplified = await simplifyWithRetries(url, pageText, summaryMode, summaryLength);
                simplifyCache.set(cacheKey, { expiresAt: Date.now() + CACHE_TTL_MS, body: simplified });
                logSimplify('simplify_response', { requestId, ok: true, elapsedMs: Date.now() - started, summaryChars: simplified.summary.length, actions: simplified.primaryActions.length });
                sendJson(res, 200, simplified);
              } catch (error) {
                logSimplify('simplify_response', { requestId, ok: false, elapsedMs: Date.now() - started, error: error instanceof Error ? error.message : 'unknown' });
                sendJson(res, 200, { ok: false, summary: '', primaryActions: [], error: SIMPLIFY_ERROR });
              }
            });
            return;
          }

          if (urlObj.pathname === '/api/proxy' || urlObj.pathname === '/proxy') {
            const requestId = `proxy_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
            const started = Date.now();
            const targetUrl = urlObj.searchParams.get('url');
            if (!targetUrl) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'text/html; charset=utf-8');
              res.end(proxyFallbackPage('', 'Missing url parameter.'));
              return;
            }

            try {
              const normalizedUrl = validateUrl(targetUrl);
              const cached = proxyCache.get(normalizedUrl);
              if (cached && cached.expiresAt > Date.now()) {
                logProxy('proxy_response', { requestId, urlHash: hashForLog(normalizedUrl), ok: true, cached: true, elapsedMs: Date.now() - started });
                res.setHeader('Content-Type', 'text/html; charset=utf-8');
                res.setHeader('Cache-Control', 'private, max-age=60');
                res.setHeader('Access-Control-Allow-Origin', '*');
                res.removeHeader?.('Content-Security-Policy');
                res.removeHeader?.('X-Frame-Options');
                res.end(cached.html);
                return;
              }

              logProxy('proxy_request', { requestId, urlHash: hashForLog(normalizedUrl) });
              const response = await fetchWithTimeout(normalizedUrl, {
                headers: {
                  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                  'Accept-Language': 'en-US,en;q=0.9',
                }
              }, TARGET_TIMEOUT_MS);

              if (!response.ok) {
                const fallback = proxyFallbackPage(normalizedUrl, `Target site returned ${response.status} ${response.statusText}.`);
                logProxy('proxy_response', { requestId, urlHash: hashForLog(normalizedUrl), ok: false, status: response.status, elapsedMs: Date.now() - started });
                res.statusCode = 200;
                res.setHeader('Content-Type', 'text/html; charset=utf-8');
                res.end(fallback);
                return;
              }

              const contentType = response.headers.get('content-type') || '';
              if (!contentType.includes('text/html')) {
                const fallback = proxyFallbackPage(normalizedUrl, `Target returned ${contentType || 'non-HTML content'}, which Saralo cannot transform safely.`);
                logProxy('proxy_response', { requestId, urlHash: hashForLog(normalizedUrl), ok: false, reason: 'non_html', elapsedMs: Date.now() - started });
                res.statusCode = 200;
                res.setHeader('Content-Type', 'text/html; charset=utf-8');
                res.end(fallback);
                return;
              }

              const finalUrl = response.url || normalizedUrl;
              let html = await response.text();
              const visibleText = extractVisibleTextFromHtml(html);
              html = injectModeEngine(rewriteAttributeUrls(sanitizeProxiedHtml(html), finalUrl), finalUrl, visibleText);
              proxyCache.set(normalizedUrl, { expiresAt: Date.now() + PROXY_CACHE_TTL_MS, html, visibleText, finalUrl });

              res.setHeader('Content-Type', 'text/html; charset=utf-8');
              res.setHeader('Cache-Control', 'private, max-age=60');
              res.setHeader('Access-Control-Allow-Origin', '*');
              res.removeHeader?.('Content-Security-Policy');
              res.removeHeader?.('X-Frame-Options');
              logProxy('proxy_response', { requestId, urlHash: hashForLog(normalizedUrl), ok: true, cached: false, textChars: visibleText.length, elapsedMs: Date.now() - started });
              res.end(html);
            } catch (err: any) {
              const reason = err?.name === 'AbortError' ? 'The target site took too long to respond.' : (err?.message || 'Unknown proxy error.');
              logProxy('proxy_response', { requestId, urlHash: hashForLog(targetUrl), ok: false, reason, elapsedMs: Date.now() - started });
              res.statusCode = 200;
              res.setHeader('Content-Type', 'text/html; charset=utf-8');
              res.end(proxyFallbackPage(targetUrl, reason));
            }
          } else {
            next();
          }
        });
      }
    }
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 5173,
    open: true,
  },
  build: {
    target: 'es2022',
    outDir: 'dist',
  },
});
