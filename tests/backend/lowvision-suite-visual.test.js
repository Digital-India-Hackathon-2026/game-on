const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "../..");

test("Low Vision Suite advertises assistive technology defaults", () => {
  const service = fs.readFileSync(path.join(root, "lowvision", "LowVisionService.ts"), "utf8");
  const types = fs.readFileSync(path.join(root, "lowvision", "LowVisionTypes.ts"), "utf8");

  assert.match(types, /interface LowVisionAssistiveFeatures/);
  assert.match(service, /defaultZoom: 1\.2/);
  assert.match(service, /minSizePx: 64/);
  assert.match(service, /extraLargeTextScale: 1\.8/);
  assert.match(service, /cursorScale: 1\.8/);
  assert.match(service, /smartMagnifier: true/);
  assert.match(service, /readPageButton: true/);
  assert.match(service, /imageOcrOnDemand: true/);
  assert.match(service, /focusMasks: false/);
  assert.match(service, /spotlightEffects: false/);
});

test("Low Vision iframe mode engine is distinct from Astigmatism clarity mode", () => {
  const viteConfig = fs.readFileSync(path.join(root, "apps", "web", "vite.config.ts"), "utf8");

  const requiredSnippets = [
    "ensureLowVisionRuntime",
    "saralo-lowvision-magnifier",
    "saralo-lowvision-image-reader",
    "speechSynthesis",
    "--saralo-lowvision-text:1.9",
    "min-height:64px",
    "cursor:url",
    "background:var(--saralo-lowvision-bg)",
    "toggleLowVisionMagnifier",
    "enableLowVisionImageReader",
  ];

  for (const snippet of requiredSnippets) {
    assert.ok(viteConfig.includes(snippet), `Missing Low Vision snippet: ${snippet}`);
  }

  const lowVisionCssStart = viteConfig.indexOf("html.saralo-mode-low-vision");
  const nextModeStart = viteConfig.indexOf("html.saralo-mode-colorblind", lowVisionCssStart);
  const lowVisionBlock = viteConfig.slice(lowVisionCssStart, nextModeStart);

  assert.ok(!lowVisionBlock.includes("radial-gradient(circle 90px"), "Low Vision should not use tunnel masks");
  assert.ok(!lowVisionBlock.includes("spotlight"), "Low Vision should not use spotlight effects");
  assert.ok(!lowVisionBlock.includes("display:none"), "Low Vision should collapse secondary content, not hide page regions");
  assert.ok(!viteConfig.includes("saralo-lowvision-toolbar"), "Low Vision controls should live in settings, not in an injected page toolbar");
  assert.ok(!viteConfig.includes("Low Vision Suite active"), "Low Vision should not cover the website with a status strip");
  assert.ok(!viteConfig.includes("installLowVisionOcrLabels"), "Low Vision should not inject OCR labels by default");
});
