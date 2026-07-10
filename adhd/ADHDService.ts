import { AIEngineError } from "../ai/AIErrorHandler";
import type {
  ADHDReadTimeRequest,
  ADHDReadTimeResponse,
  ADHDSummaryRequest,
  ADHDSummaryResponse,
  ADHDChunkRequest,
  ADHDChunkResponse,
  ADHDDeclutterConfig,
  ADHDPalette,
  ADHDBookmark,
  ADHDBookmarkCreateRequest,
  ADHDReadingProgress,
  ADHDReadingProgressRequest,
  ADHDHealthResponse,
} from "./ADHDTypes";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const WORDS_PER_MINUTE = 200;
const LLM_TIMEOUT_MS = 8_000;
const LLM_MAX_RETRIES = 2;
const CACHE_TTL_MS = 15 * 60 * 1_000; // 15 minutes
const MAX_INPUT_LENGTH = 50_000;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 30;
const VERSION = "1.0.0";

// ---------------------------------------------------------------------------
// Declutter Config & Palette (static, tunable without redeploy)
// ---------------------------------------------------------------------------

const DECLUTTER_CONFIG: ADHDDeclutterConfig = {
  adSelectors: [
    '[class*="ad"]',
    '[id*="ad"]',
    '[class*="advertisement"]',
    '[id*="advertisement"]',
    "ins.adsbygoogle",
    ".ad-container",
    ".sponsored",
    '[data-ad]',
  ],
  popupSelectors: [
    '[class*="popup"]',
    '[id*="popup"]',
    '[class*="modal"]',
    '[id*="modal"]',
    '[class*="overlay"]',
    '[class*="newsletter"]',
    ".cookie-consent",
    ".gdpr-banner",
  ],
  autoplaySelectors: [
    "video[autoplay]",
    "audio[autoplay]",
    '[class*="autoplay"]',
    '[id*="autoplay"]',
  ],
  hideSelectors: [
    "nav",
    "header",
    "footer",
    ".sidebar",
    ".comments",
    ".related-posts",
    ".social-share",
    ".share-buttons",
    '[class*="sticky"]',
    '[id*="sticky"]',
    ".sticky-header",
    ".sticky-footer",
    ".floating-banner",
  ],
};

const PALETTE: ADHDPalette = {
  background: "#faf8f5",
  text: "#2d2d2d",
  heading: "#1a1a2e",
  link: "#2563eb",
  border: "#e2dcd3",
  muted: "#8b8580",
  focus: "#f59e0b",
};

// ---------------------------------------------------------------------------
// Simple in-memory stores (swappable for DB/Redis)
// ---------------------------------------------------------------------------

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

const bookmarkStore = new Map<string, ADHDBookmark[]>();
const readingProgressStore = new Map<string, ADHDReadingProgress>();
const summaryCache = new Map<string, CacheEntry<ADHDSummaryResponse>>();
const chunkCache = new Map<string, CacheEntry<ADHDChunkResponse>>();
const rateLimitStore = new Map<string, RateLimitEntry>();
let bookmarkIdCounter = 0;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function now(): number {
  return Date.now();
}

function isoNow(): string {
  return new Date().toISOString();
}

function generateId(): string {
  return `adhd_${Date.now()}_${++bookmarkIdCounter}`;
}

function sanitizeText(text: string): string {
  // Strip HTML tags
  let clean = text.replace(/<[^>]*>/g, "");
  // Strip script/style blocks
  clean = clean.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
  clean = clean.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "");
  // Collapse whitespace
  clean = clean.replace(/\s+/g, " ").trim();
  // Limit length
  return clean.slice(0, MAX_INPUT_LENGTH);
}

function validateAndSanitizeInput(text: string, label: string): string {
  if (!text || typeof text !== "string") {
    throw new ADHDInputError(`${label} is required and must be a string.`);
  }
  const sanitized = sanitizeText(text);
  if (sanitized.length === 0) {
    throw new ADHDInputError(`${label} is empty after sanitization.`);
  }
  return sanitized;
}

function wordCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

function getCacheKey(url?: string, text?: string): string {
  if (url) return url;
  // Fallback to a hash of the first 200 chars of text
  const sample = (text ?? "").slice(0, 200);
  let hash = 0;
  for (let i = 0; i < sample.length; i++) {
    const char = sample.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `text_${hash}`;
}

// ---------------------------------------------------------------------------
// Custom Errors
// ---------------------------------------------------------------------------

export class ADHDInputError extends Error {
  readonly code = "adhd_input_error";
  readonly statusCode: number;
  constructor(message: string) {
    super(message);
    this.name = "ADHDInputError";
    this.statusCode = 400;
  }
}

export class ADHDRateLimitError extends Error {
  readonly code = "adhd_rate_limit";
  readonly statusCode: number;
  constructor() {
    super("Rate limit exceeded. Please slow down.");
    this.name = "ADHDRateLimitError";
    this.statusCode = 429;
  }
}

// ---------------------------------------------------------------------------
// Rate limiter
// ---------------------------------------------------------------------------

function checkRateLimit(userId: string | undefined): void {
  if (!userId) return;
  const key = userId;
  const entry = rateLimitStore.get(key);
  const nowTime = now();
  if (!entry || nowTime - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitStore.set(key, { count: 1, windowStart: nowTime });
    return;
  }
  if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
    throw new ADHDRateLimitError();
  }
  entry.count++;
}

// ---------------------------------------------------------------------------
// LLM call helper with timeout & retry
// ---------------------------------------------------------------------------

interface LLMResult {
  text: string;
}

async function callLLMWithFallback(
  systemPrompt: string,
  userText: string,
): Promise<string | null> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= LLM_MAX_RETRIES; attempt++) {
    try {
      const result = await callLLMOnce(systemPrompt, userText);
      return result;
    } catch (err) {
      lastError = err;
      // If timeout or network error, retry; otherwise bail
      if (err instanceof AIEngineError && err.code === "provider_failure") {
        return null;
      }
      // Wait a bit before retry
      if (attempt < LLM_MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
      }
    }
  }

  // Last resort: try the MockAIProvider as fallback
  const mockResult = await mockLLM(systemPrompt, userText);
  if (mockResult !== null) return mockResult;

  return null;
}

async function callLLMOnce(
  systemPrompt: string,
  userText: string,
): Promise<string | null> {
  try {
    // Attempt to import and use the AI service
    const { AIService } = await import("../ai/AIService.js");
    const ai = new AIService();

    const response = await Promise.race([
      ai.run({
        task: "summarize",
        input: `${systemPrompt}\n\n${userText}`,
        outputFormat: "json",
        provider: "mock",
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new AIEngineError("timeout", "LLM timed out.", 503)), LLM_TIMEOUT_MS),
      ),
    ]);

    // Extract text from AI response
    const text = (response as any)?.formatted?.content ?? null;
    return text;
  } catch (err) {
    // If AI service isn't available or any error, try mock
    if (err instanceof AIEngineError && err.code === "timeout") throw err;
    return await mockLLM(systemPrompt, userText);
  }
}

async function mockLLM(
  systemPrompt: string,
  userText: string,
): Promise<string | null> {
  // Simulate LLM processing delay
  await new Promise((r) => setTimeout(r, 100));

  if (systemPrompt.includes("summary") || systemPrompt.includes("TL;DR")) {
    const wc = wordCount(userText);
    const sentences = userText.split(/[.!?]+/).filter(Boolean);
    const firstTwo = sentences.slice(0, 2).join(". ").trim();
    return JSON.stringify({
      tldr: firstTwo ? `${firstTwo}.` : "No summary available.",
      keyPoints: sentences.slice(0, 3).map((s) => s.trim()).filter((s) => s.length > 10),
    });
  }

  if (systemPrompt.includes("chunk")) {
    const sentences = userText.split(/[.!?]+\s*/).filter(Boolean);
    const chunks: string[] = [];
    let current = "";
    for (const sentence of sentences) {
      if ((current + " " + sentence).length > 300 && current.length > 0) {
        chunks.push(current.trim());
        current = sentence;
      } else {
        current = current ? `${current} ${sentence}` : sentence;
      }
    }
    if (current.trim()) chunks.push(current.trim());
    // If only one chunk, split anyway
    if (chunks.length <= 1 && sentences.length > 1) {
      const mid = Math.ceil(sentences.length / 2);
      return JSON.stringify({
        chunks: [sentences.slice(0, mid).join(". ").trim(), sentences.slice(mid).join(". ").trim()],
      });
    }
    return JSON.stringify({ chunks });
  }

  return null;
}

// ---------------------------------------------------------------------------
// ADHD Service
// ---------------------------------------------------------------------------

export class ADHDService {
  // ---- 1. Read Time ----
  async estimateReadTime(req: ADHDReadTimeRequest): Promise<ADHDReadTimeResponse> {
    const cleanText = validateAndSanitizeInput(req.pageText, "pageText");
    const wc = wordCount(cleanText);
    const estimatedMinutes = Math.max(1, Math.round(wc / WORDS_PER_MINUTE));

    console.log(`[ADHD] read-time: ${wc} words → ${estimatedMinutes} min`);
    return { estimatedMinutes, wordCount: wc };
  }

  // ---- 2. Summary (TL;DR) ----
  async generateSummary(req: ADHDSummaryRequest): Promise<ADHDSummaryResponse> {
    const cleanText = validateAndSanitizeInput(req.pageText, "pageText");
    const cacheKey = getCacheKey(req.url, cleanText);
    const cached = summaryCache.get(cacheKey);
    if (cached && cached.expiresAt > now()) {
      console.log(`[ADHD] summary cache HIT for ${cacheKey.slice(0, 40)}`);
      return cached.data;
    }

    console.log(`[ADHD] summary: calling LLM (${cleanText.length} chars)`);
    const result = await callLLMWithFallback(
      "You are a reading assistant for users with ADHD. Provide a short TL;DR summary (1-2 sentences) and 3-5 key points in JSON format: { \"tldr\": string, \"keyPoints\": string[] }. Be concise and direct.",
      cleanText,
    );

    let response: ADHDSummaryResponse;
    if (result) {
      try {
        const parsed = JSON.parse(result);
        response = {
          tldr: String(parsed.tldr ?? ""),
          keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints.map(String) : [],
        };
      } catch {
        // If parsing fails, use text directly
        response = {
          tldr: result.slice(0, 500),
          keyPoints: [],
        };
      }
    } else {
      response = { tldr: null, keyPoints: [], error: "unavailable" };
    }

    // Cache
    summaryCache.set(cacheKey, { data: response, expiresAt: now() + CACHE_TTL_MS });
    console.log(`[ADHD] summary: ${response.error ?? "success"}`);
    return response;
  }

  // ---- 3. Chunk ----
  async chunkText(req: ADHDChunkRequest): Promise<ADHDChunkResponse> {
    const cleanText = validateAndSanitizeInput(req.pageText, "pageText");
    const cacheKey = getCacheKey(req.url, cleanText);
    const cached = chunkCache.get(cacheKey);
    if (cached && cached.expiresAt > now()) {
      console.log(`[ADHD] chunk cache HIT for ${cacheKey.slice(0, 40)}`);
      return cached.data;
    }

    console.log(`[ADHD] chunk: calling LLM (${cleanText.length} chars)`);
    const result = await callLLMWithFallback(
      "You are a reading assistant for users with ADHD. Break the following text into short, digestible paragraphs (chunks) without changing the meaning. Return JSON: { \"chunks\": string[] }. Each chunk should be 1-3 sentences max. Make it easy to read.",
      cleanText,
    );

    let response: ADHDChunkResponse;
    if (result) {
      try {
        const parsed = JSON.parse(result);
        response = {
          chunks: Array.isArray(parsed.chunks) ? parsed.chunks.map(String) : [cleanText],
        };
      } catch {
        response = { chunks: [cleanText] };
      }
    } else {
      response = { chunks: [cleanText], error: "unavailable" };
    }

    // Ensure we always have at least one chunk
    if (!response.chunks || response.chunks.length === 0) {
      response.chunks = [cleanText];
    }

    // Cache
    chunkCache.set(cacheKey, { data: response, expiresAt: now() + CACHE_TTL_MS });
    console.log(`[ADHD] chunk: ${response.chunks.length} chunks (${response.error ?? "ok"})`);
    return response;
  }

  // ---- 4. Declutter Config ----
  getDeclutterConfig(): ADHDDeclutterConfig {
    return { ...DECLUTTER_CONFIG };
  }

  // ---- 5. Palette ----
  getPalette(): ADHDPalette {
    return { ...PALETTE };
  }

  // ---- 6. Bookmarks ----
  async listBookmarks(userId: string): Promise<ADHDBookmark[]> {
    checkRateLimit(userId);
    const userBookmarks = bookmarkStore.get(userId) ?? [];
    console.log(`[ADHD] bookmarks LIST: ${userBookmarks.length} for user ${userId}`);
    return userBookmarks.slice().reverse(); // newest first
  }

  async createBookmark(
    userId: string,
    req: ADHDBookmarkCreateRequest,
  ): Promise<ADHDBookmark> {
    checkRateLimit(userId);
    if (!req.url || typeof req.url !== "string") {
      throw new ADHDInputError("url is required.");
    }
    if (typeof req.scrollPosition !== "number" || req.scrollPosition < 0) {
      throw new ADHDInputError("scrollPosition must be a non-negative number.");
    }
    const cleanUrl = req.url.trim().slice(0, 2000);

    const bookmark: ADHDBookmark = {
      id: generateId(),
      userId,
      url: cleanUrl,
      title: req.title?.trim().slice(0, 500),
      scrollPosition: req.scrollPosition,
      timestamp: isoNow(),
    };

    const userBookmarks = bookmarkStore.get(userId) ?? [];
    userBookmarks.push(bookmark);
    bookmarkStore.set(userId, userBookmarks);

    console.log(`[ADHD] bookmark CREATE: ${bookmark.id} → ${cleanUrl}`);
    return bookmark;
  }

  async deleteBookmark(userId: string, bookmarkId: string): Promise<void> {
    checkRateLimit(userId);
    const userBookmarks = bookmarkStore.get(userId) ?? [];
    const index = userBookmarks.findIndex((b) => b.id === bookmarkId);
    if (index === -1) {
      throw new Error("Bookmark not found.");
    }
    userBookmarks.splice(index, 1);
    bookmarkStore.set(userId, userBookmarks);
    console.log(`[ADHD] bookmark DELETE: ${bookmarkId}`);
  }

  // ---- 7. Reading Progress ----
  async getReadingProgress(userId: string, url: string): Promise<ADHDReadingProgress | null> {
    checkRateLimit(userId);
    if (!url) throw new ADHDInputError("url is required.");
    const key = `${userId}::${url}`;
    const progress = readingProgressStore.get(key) ?? null;
    console.log(`[ADHD] reading-progress GET: ${key.slice(0, 60)} → ${progress ? "found" : "none"}`);
    return progress;
  }

  async saveReadingProgress(
    userId: string,
    req: ADHDReadingProgressRequest,
  ): Promise<ADHDReadingProgress> {
    checkRateLimit(userId);
    if (!req.url || typeof req.url !== "string") {
      throw new ADHDInputError("url is required.");
    }
    if (typeof req.scrollPosition !== "number" || req.scrollPosition < 0) {
      throw new ADHDInputError("scrollPosition must be a non-negative number.");
    }

    const cleanUrl = req.url.trim().slice(0, 2000);
    const key = `${userId}::${cleanUrl}`;
    const progress: ADHDReadingProgress = {
      userId,
      url: cleanUrl,
      scrollPosition: req.scrollPosition,
      totalLength: req.totalLength,
      percentage: req.percentage,
      timestamp: isoNow(),
    };
    readingProgressStore.set(key, progress);

    console.log(`[ADHD] reading-progress SAVE: ${key.slice(0, 60)} → ${req.scrollPosition}`);
    return progress;
  }

  // ---- 8. Health ----
  health(): ADHDHealthResponse {
    return {
      status: "ok",
      mode: "adhd",
      timestamp: isoNow(),
      version: VERSION,
    };
  }
}
