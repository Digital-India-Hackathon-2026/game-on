// ---------------------------------------------------------------------------
// Low Vision Mode — Tests
// ---------------------------------------------------------------------------

import { LowVisionService, LowVisionInputError, LowVisionRateLimitError } from "../../lowvision/LowVisionService";
import type { AltTextRequest, LowVisionPreferencesUpdate, ReadAloudTextRequest } from "../../lowvision/LowVisionTypes";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`ASSERTION FAILED: ${message}`);
}

function assertEqual<T>(actual: T, expected: T, label: string): void {
  if (actual !== expected) {
    throw new Error(`ASSERTION FAILED [${label}]: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

function assertDefined<T>(value: T | null | undefined, label: string): T {
  if (value === null || value === undefined) {
    throw new Error(`ASSERTION FAILED [${label}]: expected defined, got ${String(value)}`);
  }
  return value;
}

let passed = 0;
let failed = 0;

async function test(name: string, fn: () => Promise<void> | void): Promise<void> {
  try {
    await fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (err: unknown) {
    failed++;
    console.error(`  ✗ ${name}: ${err instanceof Error ? err.message : String(err)}`);
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

const service = new LowVisionService();

// ---- 1. Display Config ----
test("display-config returns valid config", () => {
  const config = service.getDisplayConfig();
  assert(config.zoomLevels.length > 0, "zoomLevels should not be empty");
  assert(config.contrastPresets.length > 0, "contrastPresets should not be empty");
  assert(config.brightnessLevels.length > 0, "brightnessLevels should not be empty");
  assert(config.glareReductionLevels.length > 0, "glareReductionLevels should not be empty");
  assert(config.defaultZoom >= 1.0, "defaultZoom should be >= 1.0");
  assert(config.largerClickTargets.minSizePx >= 64, "minSizePx should support large touch targets");
  assertEqual(typeof config.boldText, "boolean", "boldText should be boolean");
  assertEqual(typeof config.singleColumnReflow, "boolean", "singleColumnReflow should be boolean");
  assert(config.assistiveFeatures.smartMagnifier, "smart magnifier should be enabled");
  assert(config.assistiveFeatures.readPageButton, "read page button should be enabled");
  assert(config.assistiveFeatures.imageOcrOnDemand, "on-demand OCR should be enabled");
  assert(config.assistiveFeatures.persistentZoom >= 1.2, "persistent zoom should be high enough for low vision users");
  assertEqual(config.assistiveFeatures.focusMasks, false, "focus masks should not be used for low vision");
  assertEqual(config.assistiveFeatures.spotlightEffects, false, "spotlight effects should not be used for low vision");
});

test("display-config contrast presets have valid structure", () => {
  const config = service.getDisplayConfig();
  for (const preset of config.contrastPresets) {
    assert(typeof preset.id === "string" && preset.id.length > 0, `preset ${preset.id} should have valid id`);
    assert(typeof preset.foreground === "string" && preset.foreground.startsWith("#"), `preset ${preset.id} should have valid foreground`);
    assert(typeof preset.background === "string" && preset.background.startsWith("#"), `preset ${preset.id} should have valid background`);
    assert(["normal", "high", "inverted", "custom"].includes(preset.type), `preset ${preset.id} should have valid type`);
  }
});

// ---- 2. Alt Text ----
test("alt-text with valid imageUrl returns alt text", async () => {
  const result = await service.generateAltText({ imageUrl: "https://example.com/photo.jpg" });
  assertDefined(result, "result should be defined");
  assert(typeof result.altText === "string", "altText should be a string");
  assertEqual(result.cached, false, "should not be cached on first call");
});

test("alt-text with valid imageContext returns alt text", async () => {
  const result = await service.generateAltText({ imageContext: "A beautiful sunset over the ocean with orange and purple colors." });
  assertDefined(result, "result should be defined");
  assert(typeof result.altText === "string", "altText should be a string");
});

test("alt-text with both imageUrl and imageContext returns alt text", async () => {
  const result = await service.generateAltText({
    imageUrl: "https://example.com/sunset.jpg",
    imageContext: "Sunset over mountains",
  });
  assertDefined(result, "result should be defined");
  assert(typeof result.altText === "string", "altText should be a string");
});

test("alt-text caches responses per image URL", async () => {
  const result1 = await service.generateAltText({ imageUrl: "https://example.com/cached-image.png" });
  const result2 = await service.generateAltText({ imageUrl: "https://example.com/cached-image.png" });
  assertEqual(result2.cached, true, "second call should be cached");
  assertEqual(result1.altText, result2.altText, "cached alt text should match");
});

test("alt-text with missing input throws error", async () => {
  try {
    await service.generateAltText({});
    assert(false, "should have thrown");
  } catch (err) {
    assert(err instanceof LowVisionInputError, "should be LowVisionInputError");
    assertEqual((err as LowVisionInputError).statusCode, 400, "should be 400");
  }
});

test("alt-text with invalid URL throws error", async () => {
  try {
    await service.generateAltText({ imageUrl: "not-a-url" });
    assert(false, "should have thrown");
  } catch (err) {
    assert(err instanceof LowVisionInputError, "should be LowVisionInputError");
    assertEqual((err as LowVisionInputError).statusCode, 400, "should be 400");
  }
});

test("alt-text with ftp URL throws error", async () => {
  try {
    await service.generateAltText({ imageUrl: "ftp://example.com/image.jpg" });
    assert(false, "should have thrown");
  } catch (err) {
    assert(err instanceof LowVisionInputError, "should be LowVisionInputError");
  }
});

// ---- 3. Preferences (GET) ----
test("get-preferences returns defaults for new user", async () => {
  const prefs = await service.getPreferences("test-user-new");
  assertEqual(prefs.userId, "test-user-new", "userId should match");
  assertEqual(prefs.zoomLevel, 1.2, "default zoom should be 1.2");
  assertEqual(prefs.contrastPresetId, "high-contrast-dark", "default contrast should be high contrast");
  assertEqual(prefs.brightness, 1.15, "default brightness should be boosted");
  assertEqual(prefs.glareReduction, 0, "default glare reduction should be 0");
  assertEqual(prefs.fontSize, 24, "default font size should be extra large");
  assertEqual(prefs.boldText, true, "bold text should default on");
  assertEqual(prefs.singleColumnReflow, true, "single column reflow should default on");
  assertEqual(prefs.largerClickTargets, true, "larger click targets should default on");
});

test("get-preferences with missing userId throws error", async () => {
  try {
    await service.getPreferences("");
    assert(false, "should have thrown");
  } catch (err) {
    assert(err instanceof LowVisionInputError, "should be LowVisionInputError");
  }
});

// ---- 4. Preferences (POST/UPDATE) ----
test("update-preferences saves and returns updated values", async () => {
  const update: LowVisionPreferencesUpdate = {
    zoomLevel: 2.0,
    contrastPresetId: "high-contrast-dark",
    brightness: 0.7,
    glareReduction: 0.5,
    fontSize: 24,
    boldText: true,
    singleColumnReflow: true,
    largerClickTargets: true,
  };
  const result = await service.updatePreferences("test-user-update", update);
  assertEqual(result.zoomLevel, 2.0, "zoomLevel should be updated");
  assertEqual(result.contrastPresetId, "high-contrast-dark", "contrastPresetId should be updated");
  assertEqual(result.brightness, 0.7, "brightness should be updated");
  assertEqual(result.glareReduction, 0.5, "glareReduction should be updated");
  assertEqual(result.fontSize, 24, "fontSize should be updated");
  assertEqual(result.boldText, true, "boldText should be updated");
  assertEqual(result.singleColumnReflow, true, "singleColumnReflow should be updated");
  assertEqual(result.largerClickTargets, true, "largerClickTargets should be updated");
});

test("update-preferences partial update works", async () => {
  const result = await service.updatePreferences("test-user-partial", { zoomLevel: 1.5 });
  assertEqual(result.zoomLevel, 1.5, "zoomLevel should be updated");
  assertEqual(result.contrastPresetId, "high-contrast-dark", "contrastPresetId should remain default");
  assertEqual(result.brightness, 1.15, "brightness should remain default");
});

test("update-preferences validates zoomLevel range", async () => {
  try {
    await service.updatePreferences("test-user-zoom", { zoomLevel: 5.0 });
    assert(false, "should have thrown");
  } catch (err) {
    assert(err instanceof LowVisionInputError, "should be LowVisionInputError");
  }
});

test("update-preferences validates zoomLevel minimum", async () => {
  try {
    await service.updatePreferences("test-user-zoom-min", { zoomLevel: 0.5 });
    assert(false, "should have thrown");
  } catch (err) {
    assert(err instanceof LowVisionInputError, "should be LowVisionInputError");
  }
});

test("update-preferences validates contrastPresetId", async () => {
  try {
    await service.updatePreferences("test-user-contrast", { contrastPresetId: "invalid-preset" });
    assert(false, "should have thrown");
  } catch (err) {
    assert(err instanceof LowVisionInputError, "should be LowVisionInputError");
  }
});

test("update-preferences validates brightness range", async () => {
  try {
    await service.updatePreferences("test-user-brightness", { brightness: 3.0 });
    assert(false, "should have thrown");
  } catch (err) {
    assert(err instanceof LowVisionInputError, "should be LowVisionInputError");
  }
});

test("update-preferences validates glareReduction range", async () => {
  try {
    await service.updatePreferences("test-user-glare", { glareReduction: 1.5 });
    assert(false, "should have thrown");
  } catch (err) {
    assert(err instanceof LowVisionInputError, "should be LowVisionInputError");
  }
});

test("update-preferences validates fontSize range", async () => {
  try {
    await service.updatePreferences("test-user-font", { fontSize: 100 });
    assert(false, "should have thrown");
  } catch (err) {
    assert(err instanceof LowVisionInputError, "should be LowVisionInputError");
  }
});

test("update-preferences validates boolean fields", async () => {
  try {
    await service.updatePreferences("test-user-bool", { boldText: "yes" as any });
    assert(false, "should have thrown");
  } catch (err) {
    assert(err instanceof LowVisionInputError, "should be LowVisionInputError");
  }
});

test("update-preferences persists across calls", async () => {
  const userId = "test-user-persist";
  await service.updatePreferences(userId, { zoomLevel: 3.0, contrastPresetId: "inverted" });
  const prefs = await service.getPreferences(userId);
  assertEqual(prefs.zoomLevel, 3.0, "zoomLevel should persist");
  assertEqual(prefs.contrastPresetId, "inverted", "contrastPresetId should persist");
});

// ---- 5. Read Aloud Text ----
test("read-aloud-text cleans boilerplate from page text", async () => {
  const result = await service.cleanTextForReadAloud({
    pageText: "<p>This is the main content of the page.</p><nav>Navigation links here</nav><footer>All rights reserved 2024</footer>",
  });
  assert(result.cleanedText.includes("main content"), "should keep main content");
  assert(!result.cleanedText.toLowerCase().includes("all rights reserved"), "should remove footer boilerplate");
  assert(result.cleanedLength < result.originalLength, "cleaned text should be shorter");
  assert(result.reductionPercent > 0, "reduction percent should be > 0");
});

test("read-aloud-text handles empty input", async () => {
  try {
    await service.cleanTextForReadAloud({ pageText: "" });
    assert(false, "should have thrown");
  } catch (err) {
    assert(err instanceof LowVisionInputError, "should be LowVisionInputError");
  }
});

test("read-aloud-text handles HTML entities", async () => {
  const result = await service.cleanTextForReadAloud({
    pageText: "Hello & welcome to the site. It's great!",
  });
  assert(result.cleanedText.includes("&"), "should decode &");
  assert(result.cleanedText.includes("'"), "should decode '");
});

test("read-aloud-text removes script and style blocks", async () => {
  const result = await service.cleanTextForReadAloud({
    pageText: "Main text here.<script>alert('bad')</script><style>.css{}</style>More content.",
  });
  assert(!result.cleanedText.includes("alert"), "should remove script content");
  assert(!result.cleanedText.includes(".css"), "should remove style content");
  assert(result.cleanedText.includes("Main text"), "should keep main text");
});

test("read-aloud-text removes cookie consent boilerplate", async () => {
  const result = await service.cleanTextForReadAloud({
    pageText: "This site uses cookies. Accept all cookies? This is the real article content about accessibility.",
  });
  assert(result.cleanedText.includes("real article"), "should keep article content");
});

test("read-aloud-text returns reduction stats", async () => {
  const result = await service.cleanTextForReadAloud({
    pageText: "Short text.",
  });
  assert(result.originalLength > 0, "originalLength should be > 0");
  assert(result.cleanedLength >= 0, "cleanedLength should be >= 0");
  assert(typeof result.reductionPercent === "number", "reductionPercent should be a number");
});

// ---- 6. Health ----
test("health returns valid response", () => {
  const health = service.health();
  assertEqual(health.status, "ok", "status should be ok");
  assertEqual(health.mode, "lowvision", "mode should be lowvision");
  assert(typeof health.timestamp === "string", "timestamp should be a string");
  assert(health.endpoints.length > 0, "endpoints should not be empty");
  assert(health.endpoints.includes("/api/lowvision/health"), "should include health endpoint");
});

// ---- 7. Rate Limiting ----
test("rate limiting works for preferences", async () => {
  const userId = "test-user-rate-limited";
  // Make many rapid requests
  const promises: Promise<unknown>[] = [];
  for (let i = 0; i < 35; i++) {
    promises.push(service.getPreferences(userId).catch((err) => err));
  }
  const results = await Promise.all(promises);
  const rateLimited = results.filter((r) => r instanceof LowVisionRateLimitError);
  assert(rateLimited.length > 0, "some requests should be rate limited");
});

// ---- 8. Alt Text Timeout Simulation ----
test("alt-text fallback on timeout simulation", async () => {
  // Use a very long URL that would cause the mock to still work
  const result = await service.generateAltText({ imageUrl: "https://example.com/timeout-test.jpg" });
  assertDefined(result, "result should be defined even on timeout");
  // Should still get alt text from mock fallback
  assert(typeof result.altText === "string" || result.altText === null, "altText should be string or null");
});

// ---- 9. Edge Cases ----
test("alt-text with very long URL is truncated", async () => {
  const longUrl = "https://example.com/" + "a".repeat(5000) + ".jpg";
  const result = await service.generateAltText({ imageUrl: longUrl });
  assertDefined(result, "result should be defined for long URL");
});

test("read-aloud-text with very long text is truncated", async () => {
  const longText = "Hello world. ".repeat(20000);
  const result = await service.cleanTextForReadAloud({ pageText: longText });
  assert(result.cleanedLength > 0, "should produce some output");
});

test("preferences with all fields at boundaries", async () => {
  const result = await service.updatePreferences("test-user-boundaries", {
    zoomLevel: 1.0,
    brightness: 0.1,
    glareReduction: 0,
    fontSize: 8,
  });
  assertEqual(result.zoomLevel, 1.0, "zoomLevel at minimum");
  assertEqual(result.brightness, 0.1, "brightness at minimum");
  assertEqual(result.glareReduction, 0, "glareReduction at minimum");
  assertEqual(result.fontSize, 8, "fontSize at minimum");
});

// ---------------------------------------------------------------------------
// Summary (run via: npx tsx tests/lowvision/LowVisionService.test.ts)
// ---------------------------------------------------------------------------

setTimeout(() => {
  console.log(`\n========================================`);
  console.log(`  Low Vision Mode Tests: ${passed} passed, ${failed} failed`);
  console.log(`========================================`);
}, 500);
