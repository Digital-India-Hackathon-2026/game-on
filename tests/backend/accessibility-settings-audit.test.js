const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "../..");

test("viewer settings persist per mode and are sent into the proxied page", () => {
  const sessionHook = fs.readFileSync(path.join(root, "apps", "web", "src", "hooks", "useAdaptiveSession.ts"), "utf8");
  const adaptiveViewer = fs.readFileSync(path.join(root, "apps", "web", "src", "components", "Viewer", "AdaptiveViewer.tsx"), "utf8");

  assert.ok(sessionHook.includes("saralo-viewer-settings-v2"), "Settings should persist in localStorage");
  assert.ok(sessionHook.includes("saveStoredModeSettings(activeMode, next)"), "Updated settings should persist for the active mode");
  assert.ok(sessionHook.includes("getSettingsForMode(modeId)"), "Mode switching should restore saved settings");
  assert.ok(sessionHook.includes("removedStoredSettingKeys"), "Removed/dead settings should be filtered from stored mode settings");
  assert.ok(sessionHook.includes("resetModeSettings"), "Reset Mode should replace the active mode settings");
  assert.ok(adaptiveViewer.includes("settings,"), "Full settings object should be posted to the iframe");
  assert.ok(adaptiveViewer.includes("settingsPayload"), "Settings changes should retrigger iframe application");
  assert.ok(adaptiveViewer.includes("applyModeToIframe"), "The viewer should retry applying settings after iframe readiness changes");
  assert.ok(adaptiveViewer.includes("key={targetUrl}"), "Changing URLs should create a fresh iframe runtime");
});

test("injected mode engine implements visible behavior for settings controls", () => {
  const viteConfig = fs.readFileSync(path.join(root, "apps", "web", "vite.config.ts"), "utf8");

  const requiredSnippets = [
    "applySettingClasses",
    "applySettingVars",
    "saralo-setting-hideSidebar",
    "saralo-setting-hideImages",
    "saralo-setting-reduceAnimations",
    "saralo-setting-chunkParagraphs",
    "saralo-setting-readingRuler",
    "highlightSyllables",
    "startReadAlong",
    "--saralo-astig-font",
    "--saralo-astig-width",
    "--saralo-lowvision-text",
    "--saralo-lowvision-button",
    "installReadSelectedText",
    "document.documentElement.lang=settings.language",
    "ensureLowVisionRuntime",
    "enableLowVisionImageReader",
    "--saralo-colorblind-contrast",
    "saralo-setting-patternOverlay",
    "saralo-setting-colorLabels",
    "saralo-setting-oneTaskAtATime",
    "saralo-setting-simplifyForms",
    "installProxyNavigation",
    "window.location.origin+'/api/proxy?url='",
    "installSummaryRefresh",
    "summaryMode",
    "summaryLength",
    "refineSummaryWithAi",
    "window.__SARALO_LAST_PAYLOAD__",
    "scheduleRuntimeRefresh",
    "refreshActiveRuntime",
  ];

  for (const snippet of requiredSnippets) {
    assert.ok(viteConfig.includes(snippet), `Missing settings behavior: ${snippet}`);
  }
});

test("settings UI removes duplicate dark and language controls", () => {
  const toolbar = fs.readFileSync(path.join(root, "apps", "web", "src", "components", "Viewer", "ViewerToolbar.tsx"), "utf8");

  assert.ok(toolbar.includes('label="Theme"'), "A single Theme selector should remain");
  assert.ok(!toolbar.includes('label="Language"'), "Language control should be removed from settings");
  assert.ok(!toolbar.includes('label="Dark Mode"'), "Duplicate General Dark Mode toggle should be removed");
  assert.ok(!toolbar.includes('label="Dark Comfort Mode"'), "Astigmatism dark duplicate should be removed");
  assert.ok(!toolbar.includes('label="Dark High-Contrast Mode"'), "Low Vision dark duplicate should be removed");
  assert.ok(!toolbar.includes('label="Calm Dark Theme"'), "Cognitive dark duplicate should be removed");
});
