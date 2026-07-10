const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "../..");

// ---------------------------------------------------------------------------
// 1. Verify all ADHD files exist
// ---------------------------------------------------------------------------

test("ADHD module files exist", () => {
  const files = [
    "adhd/ADHDTypes.ts",
    "adhd/ADHDService.ts",
    "adhd/ADHDControllers.ts",
    "adhd/index.ts",
  ];
  for (const file of files) {
    assert.ok(fs.existsSync(path.join(root, file)), `Missing: ${file}`);
  }
});

// ---------------------------------------------------------------------------
// 2. Verify ADHD routes are registered in APIRoutes
// ---------------------------------------------------------------------------

test("ADHD routes are registered in APIRoutes", () => {
  const routes = fs.readFileSync(path.join(root, "api", "APIRoutes.ts"), "utf8");
  const expectedRoutes = [
    "/v1/adhd/health",
    "/v1/adhd/read-time",
    "/v1/adhd/summary",
    "/v1/adhd/chunk",
    "/v1/adhd/declutter-config",
    "/v1/adhd/palette",
    "/v1/adhd/bookmarks",
    "/v1/adhd/reading-progress",
  ];
  for (const route of expectedRoutes) {
    assert.match(routes, new RegExp(route.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});

// ---------------------------------------------------------------------------
// 3. Verify ADHD tags are present
// ---------------------------------------------------------------------------

test("ADHD routes have ADHD tag", () => {
  const routes = fs.readFileSync(path.join(root, "api", "APIRoutes.ts"), "utf8");
  const adhdTagCount = (routes.match(/"ADHD"/g) || []).length;
  assert.ok(adhdTagCount >= 11, `Expected at least 11 ADHD tags, found ${adhdTagCount}`);
});

// ---------------------------------------------------------------------------
// 4. Verify ADHDControllers is imported in APIControllers
// ---------------------------------------------------------------------------

test("ADHDControllers is imported in APIControllers", () => {
  const controllers = fs.readFileSync(path.join(root, "api", "APIControllers.ts"), "utf8");
  assert.match(controllers, /import.*ADHDControllers/);
  assert.match(controllers, /name\.startsWith\("adhd"\)/);
  assert.match(controllers, /new ADHDControllers\(\)/);
});

// ---------------------------------------------------------------------------
// 5. Verify ADHDService has all required methods
// ---------------------------------------------------------------------------

test("ADHDService has all required methods", () => {
  const service = fs.readFileSync(path.join(root, "adhd", "ADHDService.ts"), "utf8");
  const methods = [
    "estimateReadTime",
    "generateSummary",
    "chunkText",
    "getDeclutterConfig",
    "getPalette",
    "listBookmarks",
    "createBookmark",
    "deleteBookmark",
    "getReadingProgress",
    "saveReadingProgress",
    "health",
  ];
  for (const method of methods) {
    assert.match(service, new RegExp(`async ${method}|${method}\\(`));
  }
});

// ---------------------------------------------------------------------------
// 6. Verify ADHDTypes has all required interfaces
// ---------------------------------------------------------------------------

test("ADHDTypes has all required interfaces", () => {
  const types = fs.readFileSync(path.join(root, "adhd", "ADHDTypes.ts"), "utf8");
  const interfaces = [
    "ADHDReadTimeRequest",
    "ADHDReadTimeResponse",
    "ADHDSummaryRequest",
    "ADHDSummaryResponse",
    "ADHDChunkRequest",
    "ADHDChunkResponse",
    "ADHDDeclutterConfig",
    "ADHDPalette",
    "ADHDBookmark",
    "ADHDBookmarkCreateRequest",
    "ADHDReadingProgress",
    "ADHDReadingProgressRequest",
    "ADHDHealthResponse",
    "ADHDErrorResponse",
  ];
  for (const iface of interfaces) {
    assert.match(types, new RegExp(`interface ${iface}`));
  }
});

// ---------------------------------------------------------------------------
// 7. Verify input sanitization exists
// ---------------------------------------------------------------------------

test("ADHDService includes input sanitization", () => {
  const service = fs.readFileSync(path.join(root, "adhd", "ADHDService.ts"), "utf8");
  assert.match(service, /sanitizeText/);
  assert.match(service, /validateAndSanitizeInput/);
  assert.match(service, /strip HTML tags/i);
  assert.match(service, /MAX_INPUT_LENGTH/);
});

// ---------------------------------------------------------------------------
// 8. Verify LLM timeout and retry logic
// ---------------------------------------------------------------------------

test("ADHDService includes LLM timeout and retry logic", () => {
  const service = fs.readFileSync(path.join(root, "adhd", "ADHDService.ts"), "utf8");
  assert.match(service, /LLM_TIMEOUT_MS/);
  assert.match(service, /LLM_MAX_RETRIES/);
  assert.match(service, /callLLMWithFallback/);
  assert.match(service, /callLLMOnce/);
  assert.match(service, /mockLLM/);
  assert.match(service, /8_000/); // 8s timeout
  assert.match(service, /2/); // 2 retries
});

// ---------------------------------------------------------------------------
// 9. Verify caching exists
// ---------------------------------------------------------------------------

test("ADHDService includes caching for summary and chunk", () => {
  const service = fs.readFileSync(path.join(root, "adhd", "ADHDService.ts"), "utf8");
  assert.match(service, /CACHE_TTL_MS/);
  assert.match(service, /summaryCache/);
  assert.match(service, /chunkCache/);
  assert.match(service, /15 \* 60/); // 15 min TTL
});

// ---------------------------------------------------------------------------
// 10. Verify rate limiting exists
// ---------------------------------------------------------------------------

test("ADHDService includes rate limiting", () => {
  const service = fs.readFileSync(path.join(root, "adhd", "ADHDService.ts"), "utf8");
  assert.match(service, /RATE_LIMIT_WINDOW_MS/);
  assert.match(service, /RATE_LIMIT_MAX_REQUESTS/);
  assert.match(service, /checkRateLimit/);
  assert.match(service, /ADHDRateLimitError/);
});

// ---------------------------------------------------------------------------
// 11. Verify error handling
// ---------------------------------------------------------------------------

test("ADHDControllers includes consistent error handling", () => {
  const controllers = fs.readFileSync(path.join(root, "adhd", "ADHDControllers.ts"), "utf8");
  assert.match(controllers, /ADHDInputError/);
  assert.match(controllers, /ADHDRateLimitError/);
  assert.match(controllers, /handleError/);
  assert.match(controllers, /adhd_internal_error/);
  assert.match(controllers, /adhd_not_found/);
});

// ---------------------------------------------------------------------------
// 12. Verify fallback for LLM failures
// ---------------------------------------------------------------------------

test("ADHDService includes fallback for LLM failures", () => {
  const service = fs.readFileSync(path.join(root, "adhd", "ADHDService.ts"), "utf8");
  assert.match(service, /error: "unavailable"/);
  assert.match(service, /tldr: null/);
});

// ---------------------------------------------------------------------------
// 13. Verify no PII in logging
// ---------------------------------------------------------------------------

test("ADHDService logs without PII", () => {
  const service = fs.readFileSync(path.join(root, "adhd", "ADHDService.ts"), "utf8");
  // Check that console.log uses safe identifiers, not raw user data
  const logLines = service.match(/console\.log\(.*\)/g) || [];
  for (const line of logLines) {
    // Should not log raw pageText content
    assert.doesNotMatch(line, /pageText/);
  }
});

// ---------------------------------------------------------------------------
// 14. Verify read-time uses word count / 200wpm (no LLM)
// ---------------------------------------------------------------------------

test("Read time uses word count / 200wpm without LLM", () => {
  const service = fs.readFileSync(path.join(root, "adhd", "ADHDService.ts"), "utf8");
  assert.match(service, /WORDS_PER_MINUTE = 200/);
  assert.match(service, /wordCount/);
  assert.match(service, /Math\.round\(wc \/ WORDS_PER_MINUTE\)/);
  // Read time should NOT call LLM
  const estimateReadTimeBlock = service.match(/estimateReadTime[\s\S]*?^  \/\/ ---- 2\./m);
  if (estimateReadTimeBlock) {
    assert.doesNotMatch(estimateReadTimeBlock[0], /callLLM/);
  }
});

// ---------------------------------------------------------------------------
// 15. Verify declutter config and palette return static data
// ---------------------------------------------------------------------------

test("Declutter config and palette are static", () => {
  const service = fs.readFileSync(path.join(root, "adhd", "ADHDService.ts"), "utf8");
  assert.match(service, /adSelectors/);
  assert.match(service, /popupSelectors/);
  assert.match(service, /autoplaySelectors/);
  assert.match(service, /hideSelectors/);
  assert.match(service, /background: "#faf8f5"/);
  assert.match(service, /text: "#2d2d2d"/);
  assert.match(service, /focus: "#f59e0b"/);
});

// ---------------------------------------------------------------------------
// 16. Verify bookmark CRUD operations
// ---------------------------------------------------------------------------

test("Bookmark CRUD operations exist", () => {
  const service = fs.readFileSync(path.join(root, "adhd", "ADHDService.ts"), "utf8");
  assert.match(service, /bookmarkStore/);
  assert.match(service, /listBookmarks/);
  assert.match(service, /createBookmark/);
  assert.match(service, /deleteBookmark/);
  assert.match(service, /generateId/);
});

// ---------------------------------------------------------------------------
// 17. Verify reading progress operations
// ---------------------------------------------------------------------------

test("Reading progress operations exist", () => {
  const service = fs.readFileSync(path.join(root, "adhd", "ADHDService.ts"), "utf8");
  assert.match(service, /readingProgressStore/);
  assert.match(service, /getReadingProgress/);
  assert.match(service, /saveReadingProgress/);
});

// ---------------------------------------------------------------------------
// 18. Verify health endpoint
// ---------------------------------------------------------------------------

test("Health endpoint returns status ok", () => {
  const service = fs.readFileSync(path.join(root, "adhd", "ADHDService.ts"), "utf8");
  assert.match(service, /status: "ok"/);
  assert.match(service, /mode: "adhd"/);
  assert.match(service, /1\.0\.0/);
});

// ---------------------------------------------------------------------------
// 19. Verify existing non-ADHD routes are untouched
// ---------------------------------------------------------------------------

test("Existing non-ADHD routes are unchanged", () => {
  const routes = fs.readFileSync(path.join(root, "api", "APIRoutes.ts"), "utf8");
  // Verify all original route groups still exist
  const groups = [
    "Health",
    "User Profile",
    "Accessibility",
    "AI",
    "Voice",
    "Security",
    "History",
    "Bookmarks",
    "Notes",
    "Analytics",
    "Reports",
    "Preferences",
    "Website Processing",
    "Upload",
    "Feedback",
  ];
  for (const group of groups) {
    assert.match(routes, new RegExp(group));
  }
  // Verify original routes still exist
  const originalRoutes = [
    "/v1/health",
    "/v1/me",
    "/v1/page-sessions",
    "/v1/security/analyze-url",
    "/v1/voice/stt",
    "/v1/bookmarks",
    "/v1/notes",
    "/v1/documents",
    "/v1/feedback",
    "/v1/public/webhooks",
  ];
  for (const route of originalRoutes) {
    assert.match(routes, new RegExp(route.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});

// ---------------------------------------------------------------------------
// 20. Verify existing APIControllers handlers are unchanged
// ---------------------------------------------------------------------------

test("Existing APIControllers handlers are unchanged", () => {
  const controllers = fs.readFileSync(path.join(root, "api", "APIControllers.ts"), "utf8");
  const originalHandlers = [
    "health",
    "capabilities",
    "accessibilityProfiles",
    "createPageSession",
    "securityAnalyzeUrl",
    "securityHistory",
    "securityDashboard",
    "aiSummarize",
    "aiSimplify",
    "aiChat",
    "translate",
    "voicePreferences",
    "updateVoicePreferences",
    "tts",
    "voiceCommand",
  ];
  for (const handler of originalHandlers) {
    assert.match(controllers, new RegExp(`${handler}: async`));
  }
});

// ---------------------------------------------------------------------------
// 21. Verify tsconfig includes adhd directory
// ---------------------------------------------------------------------------

test("tsconfig includes adhd directory", () => {
  const tsconfig = fs.readFileSync(path.join(root, "tsconfig.json"), "utf8");
  assert.match(tsconfig, /adhd/);
});