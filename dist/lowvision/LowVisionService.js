"use strict";
// ---------------------------------------------------------------------------
// Low Vision Mode — Service Layer
// ---------------------------------------------------------------------------
Object.defineProperty(exports, "__esModule", { value: true });
exports.LowVisionService = exports.LowVisionRateLimitError = exports.LowVisionInputError = void 0;
// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const VERSION = "1.0.0";
const LLM_TIMEOUT_MS = 8_000;
const LLM_MAX_RETRIES = 2;
const ALT_TEXT_CACHE_TTL_MS = 24 * 60 * 60 * 1_000; // 24 hours
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 30;
const MAX_INPUT_LENGTH = 50_000;
const MAX_IMAGE_URL_LENGTH = 4_000;
// ---------------------------------------------------------------------------
// Display Configuration (tunable without redeploy)
// ---------------------------------------------------------------------------
const CONTRAST_PRESETS = [
    {
        id: "normal",
        label: "Normal",
        foreground: "#1a1a1a",
        background: "#ffffff",
        link: "#1a0dab",
        border: "#dadce0",
        type: "normal",
    },
    {
        id: "high-contrast-dark",
        label: "High Contrast (Dark)",
        foreground: "#ffffff",
        background: "#000000",
        link: "#8ab4f8",
        border: "#5f6368",
        type: "high",
    },
    {
        id: "high-contrast-light",
        label: "High Contrast (Light)",
        foreground: "#000000",
        background: "#ffffff",
        link: "#1a0dab",
        border: "#000000",
        type: "high",
    },
    {
        id: "inverted",
        label: "Inverted",
        foreground: "#e0e0e0",
        background: "#121212",
        link: "#bb86fc",
        border: "#333333",
        type: "inverted",
    },
    {
        id: "yellow-on-black",
        label: "Yellow on Black",
        foreground: "#ffff00",
        background: "#000000",
        link: "#00ffff",
        border: "#555555",
        type: "high",
    },
    {
        id: "cream-on-brown",
        label: "Cream on Brown",
        foreground: "#3e2723",
        background: "#fefae0",
        link: "#1565c0",
        border: "#d7ccc8",
        type: "high",
    },
];
const DISPLAY_CONFIG = {
    zoomLevels: [1.2, 1.35, 1.5, 1.65, 1.8],
    defaultZoom: 1.2,
    contrastPresets: CONTRAST_PRESETS,
    brightnessLevels: [0.85, 1.0, 1.15, 1.3, 1.45],
    glareReductionLevels: [0, 0.15, 0.3],
    boldText: true,
    singleColumnReflow: true,
    largerClickTargets: {
        enabled: true,
        minSizePx: 64,
        paddingMultiplier: 1.8,
    },
    assistiveFeatures: {
        extraLargeTextScale: 1.8,
        headingScale: 2.05,
        iconScale: 1.55,
        cursorScale: 1.8,
        persistentZoom: 1.2,
        smartMagnifier: true,
        readPageButton: true,
        imageOcrOnDemand: true,
        clutterReduction: true,
        focusMasks: false,
        spotlightEffects: false,
    },
};
const altTextCache = new Map();
const preferencesStore = new Map();
const rateLimitStore = new Map();
// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function now() {
    return Date.now();
}
function isoNow() {
    return new Date().toISOString();
}
function sanitizeText(text) {
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
function validateAndSanitizeText(text, label) {
    if (!text || typeof text !== "string") {
        throw new LowVisionInputError(`${label} is required and must be a string.`);
    }
    const sanitized = sanitizeText(text);
    if (sanitized.length === 0) {
        throw new LowVisionInputError(`${label} is empty after sanitization.`);
    }
    return sanitized;
}
function validateUrl(url, label) {
    if (!url || typeof url !== "string") {
        throw new LowVisionInputError(`${label} is required and must be a string.`);
    }
    const trimmed = url.trim().slice(0, MAX_IMAGE_URL_LENGTH);
    // Basic URL validation
    try {
        const parsed = new URL(trimmed);
        if (!["http:", "https:"].includes(parsed.protocol)) {
            throw new LowVisionInputError(`${label} must use http or https protocol.`);
        }
    }
    catch {
        throw new LowVisionInputError(`${label} is not a valid URL.`);
    }
    return trimmed;
}
function validateNumber(value, label, min, max) {
    if (value === undefined || value === null) {
        throw new LowVisionInputError(`${label} is required.`);
    }
    const num = Number(value);
    if (!Number.isFinite(num) || num < min || num > max) {
        throw new LowVisionInputError(`${label} must be a number between ${min} and ${max}.`);
    }
    return num;
}
function validateBoolean(value, label) {
    if (value === undefined || value === null) {
        throw new LowVisionInputError(`${label} is required.`);
    }
    if (typeof value !== "boolean") {
        throw new LowVisionInputError(`${label} must be a boolean.`);
    }
    return value;
}
function getCacheKeyForAltText(imageUrl, imageContext) {
    if (imageUrl)
        return `url:${imageUrl}`;
    // Hash the context for a deterministic key
    const sample = (imageContext ?? "").slice(0, 200);
    let hash = 0;
    for (let i = 0; i < sample.length; i++) {
        const char = sample.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash |= 0;
    }
    return `ctx:${hash}`;
}
// ---------------------------------------------------------------------------
// Custom Errors
// ---------------------------------------------------------------------------
class LowVisionInputError extends Error {
    code = "lowvision_input_error";
    statusCode;
    constructor(message) {
        super(message);
        this.name = "LowVisionInputError";
        this.statusCode = 400;
    }
}
exports.LowVisionInputError = LowVisionInputError;
class LowVisionRateLimitError extends Error {
    code = "lowvision_rate_limit";
    statusCode;
    constructor() {
        super("Rate limit exceeded. Please slow down.");
        this.name = "LowVisionRateLimitError";
        this.statusCode = 429;
    }
}
exports.LowVisionRateLimitError = LowVisionRateLimitError;
// ---------------------------------------------------------------------------
// Rate limiter
// ---------------------------------------------------------------------------
function checkRateLimit(userId) {
    if (!userId)
        return;
    const key = userId;
    const entry = rateLimitStore.get(key);
    const nowTime = now();
    if (!entry || nowTime - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
        rateLimitStore.set(key, { count: 1, windowStart: nowTime });
        return;
    }
    if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
        throw new LowVisionRateLimitError();
    }
    entry.count++;
}
// ---------------------------------------------------------------------------
// AI/LLM call helper with timeout & retry
// ---------------------------------------------------------------------------
async function generateAltTextWithLLM(imageUrl, imageContext) {
    let lastError;
    for (let attempt = 0; attempt <= LLM_MAX_RETRIES; attempt++) {
        try {
            const result = await callAltTextLLMOnce(imageUrl, imageContext);
            return result;
        }
        catch (err) {
            lastError = err;
            // Wait a bit before retry (exponential backoff)
            if (attempt < LLM_MAX_RETRIES) {
                await new Promise((r) => setTimeout(r, 500 * Math.pow(2, attempt)));
            }
        }
    }
    console.error(`[LowVision] alt-text LLM failed after ${LLM_MAX_RETRIES + 1} attempts: ${lastError instanceof Error ? lastError.message : String(lastError)}`);
    return null;
}
async function callAltTextLLMOnce(imageUrl, imageContext) {
    try {
        const { AIService } = await import("../ai/AIService.js");
        const ai = new AIService();
        const systemPrompt = `You are an accessibility assistant. Generate concise, descriptive alt text (max 2 sentences) for the image described. Focus on what is visually important. Return ONLY the alt text — no JSON, no markdown, no extra commentary.`;
        let userPrompt;
        if (imageUrl && imageContext) {
            userPrompt = `Image URL: ${imageUrl}\nContext: ${imageContext}\n\nGenerate alt text for this image.`;
        }
        else if (imageUrl) {
            userPrompt = `Image URL: ${imageUrl}\n\nGenerate alt text for this image. Describe what the image likely contains based on the URL.`;
        }
        else if (imageContext) {
            userPrompt = `Image description context: ${imageContext}\n\nGenerate alt text for this image based on the context.`;
        }
        else {
            return null;
        }
        const response = await Promise.race([
            ai.run({
                task: "summarize",
                input: `${systemPrompt}\n\n${userPrompt}`,
                outputFormat: "plain_text",
                provider: "mock",
            }),
            new Promise((_, reject) => setTimeout(() => reject(new Error("LLM timed out")), LLM_TIMEOUT_MS)),
        ]);
        const text = response?.formatted?.content ?? null;
        if (text && typeof text === "string" && text.trim().length > 0) {
            return text.trim().slice(0, 500);
        }
        return null;
    }
    catch (err) {
        // If AI service isn't available, try mock fallback
        if (err instanceof Error && err.message === "LLM timed out")
            throw err;
        return await mockAltTextLLM(imageUrl, imageContext);
    }
}
async function mockAltTextLLM(imageUrl, imageContext) {
    // Simulate LLM processing delay
    await new Promise((r) => setTimeout(r, 100));
    if (imageContext && imageContext.length > 10) {
        // Extract a meaningful description from context
        const sentences = imageContext.split(/[.!?]+/).filter((s) => s.trim().length > 10);
        if (sentences.length > 0) {
            return `Image related to: ${sentences[0].trim().slice(0, 200)}`;
        }
    }
    if (imageUrl) {
        const filename = imageUrl.split("/").pop()?.split("?")[0] ?? "image";
        const name = filename.replace(/[-_]/g, " ").replace(/\.[a-z0-9]+$/i, "");
        return `Image: ${name}`;
    }
    return null;
}
// ---------------------------------------------------------------------------
// Boilerplate/Navigation text patterns for read-aloud cleaning
// ---------------------------------------------------------------------------
const BOILERPLATE_PATTERNS = [
    // Navigation & menus
    /(?:(?:skip\s+(?:to\s+)?(?:content|main|navigation)|navigation|menu|breadcrumbs?)\s*[:;.-]*)/gi,
    // Cookie/consent banners
    /(?:accept\s+(?:all\s+)?(?:cookies|consent)|cookie\s+(?:preferences?|settings?|notice|banner)|this\s+site\s+uses\s+cookies)/gi,
    // Signup/newsletter
    /(?:sign\s*(?:up|in)|subscribe|newsletter|join\s+(?:our\s+)?(?:mailing\s+)?list|get\s+started\s+(?:for\s+)?free|create\s+(?:an\s+)?account)/gi,
    // Social media
    /(?:share\s+(?:on\s+)?|follow\s+(?:us\s+)?on\s+)?(?:facebook|twitter|linkedin|instagram|youtube|tiktok|pinterest)/gi,
    // Ad/promotional
    /(?:advertisement|sponsored|promoted|ad\s*choice|brought\s+to\s+you\s+by)/gi,
    // Footer boilerplate
    /(?:all\s+rights\s+reserved|privacy\s+(?:policy|notice)|terms\s+(?:of\s+)?(?:service|use|conditions)|sitemap|copyright\s+(?:©\s*)?\d{4})/gi,
    // Comment patterns
    /(?:leave\s+(?:a\s+)?(?:comment|reply)|comments?\s*\(\d+\)|no\s+comments?\s+yet)/gi,
    // Loading/status
    /(?:loading|please\s+wait|processing|redirecting)/gi,
];
const NAV_SECTION_MARKERS = [
    "navigation",
    "nav",
    "menu",
    "sidebar",
    "footer",
    "header",
    "cookie",
    "consent",
    "banner",
    "popup",
    "modal",
    "overlay",
    "advertisement",
    "sponsored",
    "comments",
    "related posts",
    "social share",
    "share buttons",
];
function isBoilerplateLine(line) {
    const lower = line.toLowerCase().trim();
    if (lower.length < 15)
        return false; // Keep short lines, they might be headings
    if (NAV_SECTION_MARKERS.some((marker) => lower.includes(marker)))
        return true;
    return BOILERPLATE_PATTERNS.some((pattern) => pattern.test(line));
}
function cleanPageTextForReadAloud(rawText) {
    const originalLength = rawText.length;
    // Strip HTML
    let clean = rawText.replace(/<[^>]*>/g, "");
    // Strip script/style blocks
    clean = clean.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
    clean = clean.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "");
    // Decode common HTML entities
    clean = clean.replace(/&/g, "&");
    clean = clean.replace(/</g, "<");
    clean = clean.replace(/>/g, ">");
    clean = clean.replace(/"/g, '"');
    clean = clean.replace(/&#39;/g, "'");
    clean = clean.replace(/&nbsp;/g, " ");
    // Split into lines, filter boilerplate
    const lines = clean.split(/\n/);
    const meaningfulLines = lines.filter((line) => !isBoilerplateLine(line));
    // Rejoin and normalize
    clean = meaningfulLines.join(" ").replace(/\s+/g, " ").trim();
    // Remove repeated punctuation
    clean = clean.replace(/([.!?])\1+/g, "$1");
    // Remove empty brackets
    clean = clean.replace(/\[\s*\]/g, "");
    return {
        cleaned: clean,
        originalLength,
        cleanedLength: clean.length,
    };
}
// ---------------------------------------------------------------------------
// Default preferences factory
// ---------------------------------------------------------------------------
function createDefaultPreferences(userId) {
    return {
        userId,
        zoomLevel: DISPLAY_CONFIG.defaultZoom,
        contrastPresetId: "high-contrast-dark",
        brightness: 1.15,
        glareReduction: 0,
        fontSize: 24,
        boldText: true,
        singleColumnReflow: true,
        largerClickTargets: true,
        updatedAt: isoNow(),
    };
}
// ---------------------------------------------------------------------------
// Low Vision Service
// ---------------------------------------------------------------------------
class LowVisionService {
    // ---- 1. Display Config ----
    getDisplayConfig() {
        return {
            ...DISPLAY_CONFIG,
            contrastPresets: [...DISPLAY_CONFIG.contrastPresets],
            largerClickTargets: { ...DISPLAY_CONFIG.largerClickTargets },
        };
    }
    // ---- 2. Alt Text ----
    async generateAltText(req) {
        // Validate input — at least one of imageUrl or imageContext must be provided
        if (!req.imageUrl && !req.imageContext) {
            throw new LowVisionInputError("Either imageUrl or imageContext must be provided.");
        }
        let validatedUrl;
        let validatedContext;
        if (req.imageUrl) {
            validatedUrl = validateUrl(req.imageUrl, "imageUrl");
        }
        if (req.imageContext) {
            validatedContext = validateAndSanitizeText(req.imageContext, "imageContext");
        }
        const cacheKey = getCacheKeyForAltText(validatedUrl, validatedContext);
        const cached = altTextCache.get(cacheKey);
        if (cached && cached.expiresAt > now()) {
            console.log(`[LowVision] alt-text cache HIT for ${cacheKey.slice(0, 60)}`);
            return { ...cached.data, cached: true };
        }
        console.log(`[LowVision] alt-text: calling LLM (url=${validatedUrl ? "yes" : "no"}, ctx=${validatedContext ? (validatedContext.length + " chars") : "no"})`);
        const altText = await generateAltTextWithLLM(validatedUrl, validatedContext);
        let response;
        if (altText) {
            response = { altText, cached: false };
        }
        else {
            response = { altText: null, cached: false, error: "unavailable" };
        }
        // Cache
        altTextCache.set(cacheKey, { data: response, expiresAt: now() + ALT_TEXT_CACHE_TTL_MS });
        console.log(`[LowVision] alt-text: ${altText ? "success" : "fallback"}`);
        return response;
    }
    // ---- 3. Preferences (GET) ----
    async getPreferences(userId) {
        if (!userId || typeof userId !== "string") {
            throw new LowVisionInputError("userId is required.");
        }
        checkRateLimit(userId);
        const prefs = preferencesStore.get(userId);
        if (!prefs) {
            // Return defaults for new users
            return createDefaultPreferences(userId);
        }
        return { ...prefs };
    }
    // ---- 4. Preferences (POST/UPDATE) ----
    async updatePreferences(userId, update) {
        if (!userId || typeof userId !== "string") {
            throw new LowVisionInputError("userId is required.");
        }
        checkRateLimit(userId);
        const current = preferencesStore.get(userId) ?? createDefaultPreferences(userId);
        // Partial update with validation
        const updated = {
            ...current,
            userId,
            updatedAt: isoNow(),
        };
        if (update.zoomLevel !== undefined) {
            updated.zoomLevel = validateNumber(update.zoomLevel, "zoomLevel", 1.0, 4.0);
        }
        if (update.contrastPresetId !== undefined) {
            if (typeof update.contrastPresetId !== "string" || update.contrastPresetId.trim().length === 0) {
                throw new LowVisionInputError("contrastPresetId must be a non-empty string.");
            }
            const validPresetIds = CONTRAST_PRESETS.map((p) => p.id);
            if (!validPresetIds.includes(update.contrastPresetId)) {
                throw new LowVisionInputError(`contrastPresetId must be one of: ${validPresetIds.join(", ")}`);
            }
            updated.contrastPresetId = update.contrastPresetId;
        }
        if (update.brightness !== undefined) {
            updated.brightness = validateNumber(update.brightness, "brightness", 0.1, 2.0);
        }
        if (update.glareReduction !== undefined) {
            updated.glareReduction = validateNumber(update.glareReduction, "glareReduction", 0, 1.0);
        }
        if (update.fontSize !== undefined) {
            updated.fontSize = validateNumber(update.fontSize, "fontSize", 8, 72);
        }
        if (update.boldText !== undefined) {
            updated.boldText = validateBoolean(update.boldText, "boldText");
        }
        if (update.singleColumnReflow !== undefined) {
            updated.singleColumnReflow = validateBoolean(update.singleColumnReflow, "singleColumnReflow");
        }
        if (update.largerClickTargets !== undefined) {
            updated.largerClickTargets = validateBoolean(update.largerClickTargets, "largerClickTargets");
        }
        preferencesStore.set(userId, updated);
        console.log(`[LowVision] preferences UPDATED for user ${userId}`);
        return { ...updated };
    }
    // ---- 5. Read Aloud Text ----
    async cleanTextForReadAloud(req) {
        const cleanText = validateAndSanitizeText(req.pageText, "pageText");
        const result = cleanPageTextForReadAloud(cleanText);
        const reductionPercent = result.originalLength > 0
            ? Math.round((1 - result.cleanedLength / result.originalLength) * 100)
            : 0;
        console.log(`[LowVision] read-aloud: ${result.originalLength} → ${result.cleanedLength} chars (${reductionPercent}% reduction)`);
        return {
            cleanedText: result.cleaned,
            originalLength: result.originalLength,
            cleanedLength: result.cleanedLength,
            reductionPercent,
        };
    }
    // ---- 6. Health ----
    health() {
        return {
            status: "ok",
            mode: "lowvision",
            timestamp: isoNow(),
            version: VERSION,
            endpoints: [
                "/api/lowvision/display-config",
                "/api/lowvision/alt-text",
                "/api/lowvision/preferences",
                "/api/lowvision/read-aloud-text",
                "/api/lowvision/health",
            ],
        };
    }
}
exports.LowVisionService = LowVisionService;
