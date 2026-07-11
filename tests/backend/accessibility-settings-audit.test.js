const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "../..");

test("viewer settings persist per mode and external pages render in a direct iframe", () => {
  const sessionHook = fs.readFileSync(path.join(root, "apps", "web", "src", "hooks", "useAdaptiveSession.ts"), "utf8");
  const adaptiveViewer = fs.readFileSync(path.join(root, "apps", "web", "src", "components", "Viewer", "AdaptiveViewer.tsx"), "utf8");
  const viewerCss = fs.readFileSync(path.join(root, "apps", "web", "src", "custom", "custom-ui.css"), "utf8");

  assert.ok(sessionHook.includes("saralo-viewer-settings-v2"), "Settings should persist in localStorage");
  assert.ok(sessionHook.includes("saveStoredModeSettings(activeMode, next)"), "Updated settings should persist for the active mode");
  assert.ok(sessionHook.includes("getSettingsForMode(modeId)"), "Mode switching should restore saved settings");
  assert.ok(sessionHook.includes("removedStoredSettingKeys"), "Removed/dead settings should be filtered from stored mode settings");
  assert.ok(sessionHook.includes("resetModeSettings"), "Reset Mode should replace the active mode settings");
  assert.ok(adaptiveViewer.includes("src={targetUrl}"), "Opened URLs should render directly in the iframe");
  assert.ok(!adaptiveViewer.includes("/api/proxy?url=${encodeURIComponent(targetUrl)}"), "The visible renderer should not proxy external pages");
  assert.ok(adaptiveViewer.includes("key={targetUrl}"), "Changing URLs should create a fresh iframe runtime");
  assert.ok(adaptiveViewer.includes("needsPointerTracking"), "Mouse relay should be enabled only for modes/settings that need pointer overlays");
  assert.ok(adaptiveViewer.includes("visualScale"), "Settings sliders should drive cross-origin-safe iframe scaling");
  assert.ok(adaptiveViewer.includes("viewer-mode-effects"), "Settings should apply visible effects outside the iframe");
  assert.ok(adaptiveViewer.includes("viewer-magnifier-lens"), "Magnifier setting should render a safe external-site lens");
  assert.ok(adaptiveViewer.includes("viewer-large-cursor"), "Cursor size setting should render a visible cursor assist");
  assert.ok(adaptiveViewer.includes("Loading website..."), "Viewer should show a loading state while the iframe starts");
  assert.ok(adaptiveViewer.includes("Website could not be loaded"), "Viewer should show an error fallback if framing fails");
  assert.ok(adaptiveViewer.includes("Open original site in new tab"), "Viewer should offer a safe external fallback");
  assert.ok(!adaptiveViewer.includes("SARALO_APPLY_MODE"), "External iframe DOM must not be manipulated by mode injection");
  assert.ok(!adaptiveViewer.includes("SARALO_ENABLE_MOUSE_RELAY"), "External iframe DOM must not be used for mouse relays");
  assert.ok(viewerCss.includes("height: calc(100vh - 96px)"), "Iframe area should fill the viewport under the toolbar");
  assert.ok(viewerCss.includes("z-index: 205"), "Iframe container should sit above the mode background");
  assert.ok(viewerCss.includes(".viewer-mode-effects") && viewerCss.includes("z-index: 208"), "Mode effects should sit above the iframe and below controls");
  assert.ok(viewerCss.includes(".viewer-mode-effects") && viewerCss.includes("pointer-events: none"), "Mode effects must not block external-site interaction");
  assert.ok(viewerCss.includes(".viewer-magnifier-lens") && viewerCss.includes("pointer-events: none"), "Magnifier must not block external-site interaction");
  assert.ok(viewerCss.includes(".viewer-large-cursor") && viewerCss.includes("pointer-events: none"), "Large cursor must not block external-site interaction");
  assert.ok(viewerCss.includes("border: 0"), "Iframe should render without a border");
  assert.ok(viewerCss.includes("background: #fff"), "Iframe should have a white loading background");
  assert.ok(viewerCss.includes("display: block"), "Iframe should be visible as a block element");
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
    "window.__SARALO_MOUSE_RELAY_ENABLED__",
  ];

  for (const snippet of requiredSnippets) {
    assert.ok(viteConfig.includes(snippet), `Missing settings behavior: ${snippet}`);
  }
});

test("Medicart demo URL is compatible with proxy normalization and smooth viewer runtime", () => {
  const home = fs.readFileSync(path.join(root, "apps", "web", "src", "custom", "SaraloHome.tsx"), "utf8");
  const adaptiveViewer = fs.readFileSync(path.join(root, "apps", "web", "src", "components", "Viewer", "AdaptiveViewer.tsx"), "utf8");
  const viewerCss = fs.readFileSync(path.join(root, "apps", "web", "src", "custom", "custom-ui.css"), "utf8");
  const viteConfig = fs.readFileSync(path.join(root, "apps", "web", "vite.config.ts"), "utf8");

  assert.ok(home.includes("normalizeInputUrl"), "Landing URL input should normalize bare Medicart hostnames");
  assert.ok(home.includes("`https://${trimmed}`"), "Bare domains should become HTTPS URLs");
  assert.ok(adaptiveViewer.includes("src={targetUrl}"), "Medicart should be loaded by the visible iframe renderer");
  assert.ok(adaptiveViewer.includes('allow="clipboard-read; clipboard-write; fullscreen; geolocation; microphone"'), "Iframe should keep normal external-site capabilities available");
  assert.ok(viteConfig.includes("User-Agent"), "Proxy should send browser-like headers to Vercel/SPA hosts");
  assert.ok(viteConfig.includes("isMedicartDemoUrl"), "Medicart demo should have a first-class compatibility guard");
  assert.ok(viteConfig.includes("medicartCompatibilityPage"), "Medicart demo should get a transformable compatibility shell if server-side fetch is blocked");
  assert.ok(viteConfig.includes("https://medicart-demo.vercel.app/assets/index-BPBXxCYU.js"), "Medicart compatibility shell should load the real app bundle");
  assert.ok(viteConfig.includes("https://medicart-demo.vercel.app/assets/index-DjXOjoir.css"), "Medicart compatibility shell should load the real app styles");
  assert.ok(viteConfig.includes("installSummaryRefresh"), "Runtime should refresh after SPA content changes");
  assert.ok(!viteConfig.includes("transition:font-size 220ms ease,line-height 220ms ease"), "Low Vision should not animate every element on interactive pages");
  assert.ok(!viteConfig.includes("transition:background-color 260ms ease,color 260ms ease"), "Cognitive mode should not animate every element on interactive pages");
  assert.ok(viewerCss.includes("contain: layout paint style"), "Viewer should isolate expensive frame rendering");
  assert.ok(viewerCss.includes("will-change: transform"), "Scaled iframe should stay compositor-friendly");
  assert.ok(viewerCss.includes(".reading-guide-overlay") && viewerCss.includes("pointer-events: none"), "Reading guide overlay should not block iframe interaction");
  assert.ok(viewerCss.includes(".focus-mask-overlay") && viewerCss.includes("pointer-events: none"), "Focus mask overlay should not block iframe interaction");
});

test("Medicart compatibility page includes Saralo order bridge", () => {
  const viteConfig = fs.readFileSync(path.join(root, "apps", "web", "vite.config.ts"), "utf8");

  const requiredSnippets = [
    "MEDICART_BRIDGE_KEY",
    "medicartBridgeState",
    "/api/medicart-bridge",
    "updateMedicartBridgeState",
    "medicartBridgeSnippet",
    "const medicartModeEngine = modeEngineSnippet('')",
    "medicart_orders_v2",
    "medicart_products_v2",
    "medicart_support_tickets_v1",
    "window.__SARALO_MEDICART_BRIDGE_READY__",
    "await window.__SARALO_MEDICART_BRIDGE_READY__",
    "localStorage.setItem=function",
    "localStorage.removeItem=function",
    "new StorageEvent('storage'",
    "setInterval(pull,1800)",
  ];

  for (const snippet of requiredSnippets) {
    assert.ok(viteConfig.includes(snippet), `Missing Medicart bridge behavior: ${snippet}`);
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
