import type {
  AstigmatismConfigResponse,
  AstigmatismCorrectionValues,
  AstigmatismHealthResponse,
  AstigmatismPreviewResponse,
  AstigmatismSeverity,
  AstigmatismToggleRequest,
  AstigmatismToggleState,
  AstigmatismTransformRequest,
  AstigmatismTransformResponse,
} from "./AstigmatismTypes";

const VERSION = "2026-07-09.astigmatism.v1";
const DEFAULT_SEVERITY: AstigmatismSeverity = "moderate";
const MAX_URL_LENGTH = 4_000;
const MAX_HTML_LENGTH = 2_000_000;
const FETCH_TIMEOUT_MS = 10_000;
const SEVERITY_VALUES: Record<AstigmatismSeverity, AstigmatismCorrectionValues> = {
  mild: {
    fontWeight: 600,
    headingWeight: 700,
    bodyFontScale: 1.16,
    headingFontScale: 1.25,
    letterSpacingEm: 0.03,
    lineHeightMultiplier: 1.72,
    sectionSpacingRem: 1.6,
    readingColumnMaxWidthPx: 900,
    textShadowOpacity: 0.1,
    edgeBoost: 0.1,
    brightElementDim: 0.9,
    imageScale: 0.86,
    secondaryOpacity: 0.72,
    borderWidthPx: 2,
  },
  moderate: {
    fontWeight: 650,
    headingWeight: 750,
    bodyFontScale: 1.2,
    headingFontScale: 1.28,
    letterSpacingEm: 0.04,
    lineHeightMultiplier: 1.8,
    sectionSpacingRem: 2,
    readingColumnMaxWidthPx: 850,
    textShadowOpacity: 0.14,
    edgeBoost: 0.15,
    brightElementDim: 0.875,
    imageScale: 0.8,
    secondaryOpacity: 0.66,
    borderWidthPx: 2.25,
  },
  severe: {
    fontWeight: 700,
    headingWeight: 800,
    bodyFontScale: 1.24,
    headingFontScale: 1.3,
    letterSpacingEm: 0.05,
    lineHeightMultiplier: 1.86,
    sectionSpacingRem: 2.4,
    readingColumnMaxWidthPx: 820,
    textShadowOpacity: 0.18,
    edgeBoost: 0.2,
    brightElementDim: 0.85,
    imageScale: 0.76,
    secondaryOpacity: 0.6,
    borderWidthPx: 2.5,
  },
};

const toggleStore = new Map<string, AstigmatismToggleState>();

export class AstigmatismInputError extends Error {
  readonly code = "astigmatism_input_error";
  readonly statusCode = 400;

  constructor(message: string) {
    super(message);
    this.name = "AstigmatismInputError";
  }
}

export class AstigmatismFetchError extends Error {
  readonly code = "astigmatism_fetch_error";
  readonly statusCode = 502;

  constructor(message: string) {
    super(message);
    this.name = "AstigmatismFetchError";
  }
}

export class AstigmatismService {
  health(): AstigmatismHealthResponse {
    return { status: "ok", mode: "astigmatism", version: VERSION };
  }

  getConfig(): AstigmatismConfigResponse {
    return {
      version: VERSION,
      defaultSeverity: DEFAULT_SEVERITY,
      severities: SEVERITY_VALUES,
      reversibleRuntime: {
        global: "window.SaraloAstigmatism",
        messageType: "SARALO_ASTIGMATISM_TOGGLE",
      },
    };
  }

  getToggleState(userId: string): AstigmatismToggleState {
    return toggleStore.get(userId) ?? {
      enabled: true,
      severity: DEFAULT_SEVERITY,
      updatedAt: new Date(0).toISOString(),
    };
  }

  updateToggleState(userId: string, request: AstigmatismToggleRequest): AstigmatismToggleState {
    if (typeof request?.enabled !== "boolean") {
      throw new AstigmatismInputError("enabled must be a boolean.");
    }
    const state: AstigmatismToggleState = {
      enabled: request.enabled,
      severity: this.normalizeSeverity(request.severity),
      updatedAt: new Date().toISOString(),
    };
    toggleStore.set(userId, state);
    return state;
  }

  async transformUrl(request: AstigmatismTransformRequest): Promise<AstigmatismTransformResponse> {
    const url = this.validateUrl(request?.url);
    const severity = this.normalizeSeverity(request.severity);
    const enabled = request.enabled ?? true;
    const fetched = await this.fetchHtml(url);
    const html = this.injectCorrection(fetched.html, fetched.finalUrl, { enabled, severity });
    return {
      ok: true,
      url,
      finalUrl: fetched.finalUrl,
      enabled,
      severity,
      html,
      values: SEVERITY_VALUES[severity],
    };
  }

  async previewUrl(request: AstigmatismTransformRequest): Promise<AstigmatismPreviewResponse> {
    const url = this.validateUrl(request?.url);
    const severity = this.normalizeSeverity(request.severity);
    const fetched = await this.fetchHtml(url);
    const corrected = this.injectCorrection(fetched.html, fetched.finalUrl, { enabled: true, severity });
    return {
      ok: true,
      url,
      finalUrl: fetched.finalUrl,
      severity,
      html: this.createPreviewPage(fetched.html, corrected, fetched.finalUrl, severity),
    };
  }

  injectCorrection(
    html: string,
    finalUrl: string,
    options: { enabled?: boolean; severity?: AstigmatismSeverity } = {},
  ): string {
    if (typeof html !== "string" || !html.trim()) {
      throw new AstigmatismInputError("html is required.");
    }
    const severity = this.normalizeSeverity(options.severity);
    const enabled = options.enabled ?? true;
    const cleanHtml = this.sanitizeHtml(html).slice(0, MAX_HTML_LENGTH);
    const snippet = this.buildInjectionSnippet(severity, enabled);
    const baseTag = `<base href="${escapeHtml(finalUrl)}">`;
    let nextHtml = cleanHtml;

    if (/<head[^>]*>/i.test(nextHtml) && !/<base\b/i.test(nextHtml)) {
      nextHtml = nextHtml.replace(/<head[^>]*>/i, (match) => `${match}${baseTag}`);
    }

    if (/<\/body>/i.test(nextHtml)) {
      return nextHtml.replace(/<\/body>/i, `${snippet}</body>`);
    }
    return `${nextHtml}${snippet}`;
  }

  private buildInjectionSnippet(severity: AstigmatismSeverity, enabled: boolean): string {
    const allCss = Object.entries(SEVERITY_VALUES)
      .map(([key, values]) => this.buildSeverityCss(key as AstigmatismSeverity, values))
      .join("\n");

    const svg = `<svg id="saralo-astigmatism-svg" aria-hidden="true" focusable="false" style="position:absolute;width:0;height:0;overflow:hidden"><defs>
  <filter id="saralo-astigmatism-edge-mild"><feConvolveMatrix order="3" preserveAlpha="true" kernelMatrix="0 -0.10 0 -0.10 1.40 -0.10 0 -0.10 0"/></filter>
  <filter id="saralo-astigmatism-edge-moderate"><feConvolveMatrix order="3" preserveAlpha="true" kernelMatrix="0 -0.15 0 -0.15 1.60 -0.15 0 -0.15 0"/></filter>
  <filter id="saralo-astigmatism-edge-severe"><feConvolveMatrix order="3" preserveAlpha="true" kernelMatrix="0 -0.20 0 -0.20 1.80 -0.20 0 -0.20 0"/></filter>
</defs></svg>`;

    const css = `<style id="saralo-astigmatism-css">
html.saralo-astigmatism-enabled{background:#FAFAFA!important;color:#111!important;color-scheme:light!important;scroll-behavior:smooth}
html.saralo-astigmatism-enabled body{background:#FAFAFA!important;color:#111!important;text-rendering:optimizeLegibility!important;-webkit-font-smoothing:antialiased!important}
html.saralo-astigmatism-enabled *,html.saralo-astigmatism-enabled *::before,html.saralo-astigmatism-enabled *::after{box-sizing:border-box;transition:background-color 250ms ease,color 250ms ease,border-color 250ms ease,box-shadow 250ms ease,opacity 250ms ease,filter 250ms ease,transform 250ms ease,font-size 250ms ease,line-height 250ms ease,letter-spacing 250ms ease!important}
html.saralo-astigmatism-enabled body > main,html.saralo-astigmatism-enabled main:not(:has(main)),html.saralo-astigmatism-enabled article,html.saralo-astigmatism-enabled [role="main"],html.saralo-astigmatism-enabled .content,html.saralo-astigmatism-enabled .main,html.saralo-astigmatism-enabled #content,html.saralo-astigmatism-enabled #main{max-width:var(--saralo-astigmatism-column,850px)!important;margin-left:auto!important;margin-right:auto!important;padding-left:clamp(22px,4vw,56px)!important;padding-right:clamp(22px,4vw,56px)!important}
html.saralo-astigmatism-enabled main,html.saralo-astigmatism-enabled article,html.saralo-astigmatism-enabled section{gap:var(--saralo-astigmatism-section-gap,2rem)!important}
html.saralo-astigmatism-enabled section,html.saralo-astigmatism-enabled article,html.saralo-astigmatism-enabled p,html.saralo-astigmatism-enabled ul,html.saralo-astigmatism-enabled ol,html.saralo-astigmatism-enabled blockquote,html.saralo-astigmatism-enabled figure{margin-top:calc(var(--saralo-astigmatism-section-gap,2rem)*.42)!important;margin-bottom:calc(var(--saralo-astigmatism-section-gap,2rem)*.42)!important}
html.saralo-astigmatism-enabled p,html.saralo-astigmatism-enabled li,html.saralo-astigmatism-enabled dd,html.saralo-astigmatism-enabled dt,html.saralo-astigmatism-enabled blockquote{max-width:72ch!important}
html.saralo-astigmatism-enabled img,html.saralo-astigmatism-enabled video,html.saralo-astigmatism-enabled canvas,html.saralo-astigmatism-enabled picture{max-width:min(100%,calc(100%*var(--saralo-astigmatism-image-scale,.8)))!important;height:auto!important;filter:brightness(var(--saralo-astigmatism-brightness,.88)) contrast(.96) saturate(.92)!important}
html.saralo-astigmatism-enabled aside,html.saralo-astigmatism-enabled nav:not(:has([aria-current])),html.saralo-astigmatism-enabled footer,html.saralo-astigmatism-enabled [role="complementary"],html.saralo-astigmatism-enabled [class*="sidebar"],html.saralo-astigmatism-enabled [class*="Sidebar"],html.saralo-astigmatism-enabled [class*="secondary"],html.saralo-astigmatism-enabled [class*="Related"],html.saralo-astigmatism-enabled [class*="promo"],html.saralo-astigmatism-enabled [class*="ad-"],html.saralo-astigmatism-enabled [id*="sidebar"],html.saralo-astigmatism-enabled [id*="secondary"]{opacity:var(--saralo-astigmatism-secondary-opacity,.66)!important;filter:saturate(.75) contrast(.9)!important}
html.saralo-astigmatism-enabled input,html.saralo-astigmatism-enabled textarea,html.saralo-astigmatism-enabled select{min-height:calc(2.75rem*var(--saralo-astigmatism-control-scale,1.2))!important;padding:calc(.75rem*var(--saralo-astigmatism-control-scale,1.2)) calc(1rem*var(--saralo-astigmatism-control-scale,1.2))!important;background:#fff!important;color:#111!important;border:2px solid #c8c8c8!important;border-radius:10px!important;box-shadow:none!important}
html.saralo-astigmatism-enabled button,html.saralo-astigmatism-enabled [role="button"],html.saralo-astigmatism-enabled input[type="button"],html.saralo-astigmatism-enabled input[type="submit"],html.saralo-astigmatism-enabled input[type="reset"]{min-height:calc(2.75rem*var(--saralo-astigmatism-control-scale,1.2))!important;min-width:calc(2.75rem*var(--saralo-astigmatism-control-scale,1.2))!important;padding:calc(.72rem*var(--saralo-astigmatism-control-scale,1.2)) calc(1.15rem*var(--saralo-astigmatism-control-scale,1.2))!important;border-radius:12px!important;border:2px solid #c8c8c8!important;box-shadow:none!important}
html.saralo-astigmatism-enabled a{color:#0647a8!important;text-decoration:underline!important;text-decoration-thickness:.1em!important;text-underline-offset:.18em!important;padding:.08em .16em!important;border-radius:6px!important}
html.saralo-astigmatism-enabled a:hover,html.saralo-astigmatism-enabled button:hover{background:#eef4ff!important}
html.saralo-astigmatism-enabled table,html.saralo-astigmatism-enabled th,html.saralo-astigmatism-enabled td,html.saralo-astigmatism-enabled hr,html.saralo-astigmatism-enabled fieldset{border-color:#d4d4d4!important;border-width:var(--saralo-astigmatism-border,2px)!important;box-shadow:none!important}
html.saralo-astigmatism-enabled [style*="background:#fff"],html.saralo-astigmatism-enabled [style*="background: #fff"],html.saralo-astigmatism-enabled [style*="background-color:#fff"],html.saralo-astigmatism-enabled [style*="background-color: #fff"]{background-color:#FAFAFA!important}
html.saralo-astigmatism-enabled [style*="color:#000"],html.saralo-astigmatism-enabled [style*="color: #000"]{color:#111!important}
html.saralo-astigmatism-enabled [style*="box-shadow"],html.saralo-astigmatism-enabled .shadow,html.saralo-astigmatism-enabled [class*="shadow"],html.saralo-astigmatism-enabled [class*="card"],html.saralo-astigmatism-enabled [class*="Card"]{box-shadow:none!important}
html.saralo-astigmatism-enabled [class*="border"],html.saralo-astigmatism-enabled [style*="border"]{border-color:#d4d4d4!important}
${allCss}
</style>`;

    const script = `<script id="saralo-astigmatism-runtime">
(function(){
  var severities=${JSON.stringify(Object.keys(SEVERITY_VALUES))};
  function apply(options){
    options=options||{};
    var root=document.documentElement;
    var enabled=options.enabled!==false;
    var severity=severities.indexOf(options.severity)>=0?options.severity:${JSON.stringify(severity)};
    root.classList.toggle('saralo-astigmatism-enabled',enabled);
    severities.forEach(function(item){root.classList.remove('saralo-astigmatism-'+item);});
    if(enabled){root.classList.add('saralo-astigmatism-'+severity);}
    root.dataset.saraloAstigmatismSeverity=severity;
    root.dataset.saraloAstigmatismEnabled=String(enabled);
  }
  window.SaraloAstigmatism={setMode:apply,disable:function(){apply({enabled:false});},enable:function(severity){apply({enabled:true,severity:severity});}};
  window.addEventListener('message',function(event){
    if(!event.data||event.data.type!=='SARALO_ASTIGMATISM_TOGGLE')return;
    apply(event.data);
  });
  apply({enabled:${enabled ? "true" : "false"},severity:${JSON.stringify(severity)}});
})();
</script>`;

    return `${svg}${css}${script}`;
  }

  private buildSeverityCss(severity: AstigmatismSeverity, values: AstigmatismCorrectionValues): string {
    return `html.saralo-astigmatism-${severity}{--saralo-astigmatism-brightness:${values.brightElementDim};--saralo-astigmatism-border:${values.borderWidthPx}px;--saralo-astigmatism-body-scale:${values.bodyFontScale};--saralo-astigmatism-heading-scale:${values.headingFontScale};--saralo-astigmatism-section-gap:${values.sectionSpacingRem}rem;--saralo-astigmatism-column:${values.readingColumnMaxWidthPx}px;--saralo-astigmatism-image-scale:${values.imageScale};--saralo-astigmatism-secondary-opacity:${values.secondaryOpacity};--saralo-astigmatism-control-scale:${values.bodyFontScale}}
html.saralo-astigmatism-${severity} body,html.saralo-astigmatism-${severity} p,html.saralo-astigmatism-${severity} li,html.saralo-astigmatism-${severity} span,html.saralo-astigmatism-${severity} a,html.saralo-astigmatism-${severity} button,html.saralo-astigmatism-${severity} input,html.saralo-astigmatism-${severity} textarea,html.saralo-astigmatism-${severity} select{font-size:calc(1em*${values.bodyFontScale})!important;font-weight:${values.fontWeight}!important;letter-spacing:${values.letterSpacingEm}em!important;line-height:${values.lineHeightMultiplier}!important;color:#111!important;text-shadow:0 0 .01px rgba(17,17,17,${values.textShadowOpacity})}
html.saralo-astigmatism-${severity} h1,html.saralo-astigmatism-${severity} h2,html.saralo-astigmatism-${severity} h3,html.saralo-astigmatism-${severity} h4,html.saralo-astigmatism-${severity} h5,html.saralo-astigmatism-${severity} h6{font-size:calc(1em*${values.headingFontScale})!important;font-weight:${values.headingWeight}!important;letter-spacing:${Math.max(0.01, values.letterSpacingEm - 0.015)}em!important;line-height:1.28!important;color:#111!important;margin-top:calc(var(--saralo-astigmatism-section-gap,2rem)*.9)!important;margin-bottom:calc(var(--saralo-astigmatism-section-gap,2rem)*.42)!important}
html.saralo-astigmatism-${severity} svg,html.saralo-astigmatism-${severity} icon,html.saralo-astigmatism-${severity} [class*="icon"],html.saralo-astigmatism-${severity} [class*="Icon"]{filter:url(#saralo-astigmatism-edge-${severity}) brightness(${values.brightElementDim})!important}
html.saralo-astigmatism-${severity} a,html.saralo-astigmatism-${severity} button,html.saralo-astigmatism-${severity} [role="button"],html.saralo-astigmatism-${severity} [role="link"]{font-size:calc(1em*${Math.max(1.12, values.bodyFontScale)})!important;text-decoration-thickness:max(2px,.08em)!important}`;
  }

  private async fetchHtml(url: string): Promise<{ html: string; finalUrl: string }> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent": "Saralo-AstigmatismMode/1.0 (+https://saralo.local)",
          Accept: "text/html,application/xhtml+xml",
        },
      });
      if (!response.ok) {
        throw new AstigmatismFetchError(`Target returned ${response.status} ${response.statusText}.`);
      }
      const contentType = response.headers.get("content-type") ?? "";
      if (!contentType.includes("text/html") && !contentType.includes("application/xhtml+xml")) {
        throw new AstigmatismFetchError(`Target returned ${contentType || "non-HTML content"}.`);
      }
      const html = await response.text();
      return { html: html.slice(0, MAX_HTML_LENGTH), finalUrl: response.url || url };
    } catch (error) {
      if (error instanceof AstigmatismFetchError) throw error;
      const message = error instanceof Error && error.name === "AbortError"
        ? "Target request timed out."
        : error instanceof Error ? error.message : "Target request failed.";
      throw new AstigmatismFetchError(message);
    } finally {
      clearTimeout(timeout);
    }
  }

  private createPreviewPage(original: string, corrected: string, finalUrl: string, severity: AstigmatismSeverity): string {
    return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Saralo Astigmatism Preview</title>
  <style>
    body{margin:0;background:#17121f;color:#fff;font-family:Inter,system-ui,sans-serif}
    header{display:flex;align-items:center;justify-content:space-between;gap:1rem;padding:14px 18px;background:#241a35}
    strong{font-weight:800}.preview{display:grid;grid-template-columns:1fr 1fr;height:calc(100vh - 58px)}
    section{min-width:0;border-left:1px solid rgba(255,255,255,.14)}h2{margin:0;padding:10px 14px;font-size:14px;background:#302343}
    iframe{display:block;width:100%;height:calc(100% - 38px);border:0;background:#fff}
  </style>
</head>
<body>
  <header><strong>Astigmatism Mode Preview</strong><span>${escapeHtml(finalUrl)} - ${severity}</span></header>
  <main class="preview">
    <section><h2>Original</h2><iframe sandbox="" srcdoc="${escapeAttribute(original)}"></iframe></section>
    <section><h2>Corrected</h2><iframe sandbox="allow-scripts" srcdoc="${escapeAttribute(corrected)}"></iframe></section>
  </main>
</body>
</html>`;
  }

  private sanitizeHtml(html: string): string {
    return html
      .replace(/<meta[^>]*http-equiv=["']Content-Security-Policy["'][^>]*>/gi, "")
      .replace(/<meta[^>]*http-equiv=["']X-Frame-Options["'][^>]*>/gi, "")
      .replace(/\s(on\w+)=["'][^"']*["']/gi, "")
      .replace(/\s(href|src)=["']javascript:[^"']*["']/gi, ' $1="#"');
  }

  private validateUrl(value: unknown): string {
    if (typeof value !== "string" || !value.trim()) {
      throw new AstigmatismInputError("url is required.");
    }
    const trimmed = value.trim().slice(0, MAX_URL_LENGTH);
    try {
      const parsed = new URL(trimmed);
      if (!["http:", "https:"].includes(parsed.protocol)) {
        throw new AstigmatismInputError("url must use http or https.");
      }
      return parsed.toString();
    } catch (error) {
      if (error instanceof AstigmatismInputError) throw error;
      throw new AstigmatismInputError("url is invalid.");
    }
  }

  private normalizeSeverity(value: unknown): AstigmatismSeverity {
    if (value === undefined || value === null || value === "") return DEFAULT_SEVERITY;
    if (value === "mild" || value === "moderate" || value === "severe") return value;
    throw new AstigmatismInputError("severity must be mild, moderate, or severe.");
  }
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[char] ?? char));
}

function escapeAttribute(value: string): string {
  return escapeHtml(value).replace(/\n/g, "&#10;");
}
