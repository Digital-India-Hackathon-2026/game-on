const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "../..");

test("Astigmatism module files exist", () => {
  const files = [
    "astigmatism/AstigmatismTypes.ts",
    "astigmatism/AstigmatismService.ts",
    "astigmatism/AstigmatismControllers.ts",
    "astigmatism/index.ts",
  ];
  for (const file of files) {
    assert.ok(fs.existsSync(path.join(root, file)), `Missing: ${file}`);
  }
});

test("Astigmatism routes are registered", () => {
  const routes = fs.readFileSync(path.join(root, "api", "APIRoutes.ts"), "utf8");
  const expectedRoutes = [
    "/v1/astigmatism/health",
    "/v1/astigmatism/config",
    "/v1/astigmatism/toggle",
    "/v1/astigmatism/transform",
    "/v1/astigmatism/transform-json",
    "/v1/astigmatism/preview",
    "/v1/astigmatism/preview-json",
  ];
  for (const route of expectedRoutes) {
    assert.match(routes, new RegExp(route.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});

test("APIControllers delegates Astigmatism handlers", () => {
  const controllers = fs.readFileSync(path.join(root, "api", "APIControllers.ts"), "utf8");
  assert.match(controllers, /import.*AstigmatismControllers/);
  assert.match(controllers, /name\.startsWith\("astigmatism"\)/);
  assert.match(controllers, /new AstigmatismControllers\(\)/);
});

test("Astigmatism service exposes required behavior", () => {
  const service = fs.readFileSync(path.join(root, "astigmatism", "AstigmatismService.ts"), "utf8");
  const methods = [
    "getConfig",
    "getToggleState",
    "updateToggleState",
    "transformUrl",
    "previewUrl",
    "injectCorrection",
    "buildInjectionSnippet",
  ];
  for (const method of methods) {
    assert.match(service, new RegExp(`${method}\\(`));
  }
});

test("Astigmatism severities scale correction values", () => {
  const service = fs.readFileSync(path.join(root, "astigmatism", "AstigmatismService.ts"), "utf8");
  assert.match(service, /mild:[\s\S]*letterSpacingEm: 0\.03/);
  assert.match(service, /moderate:[\s\S]*letterSpacingEm: 0\.04/);
  assert.match(service, /severe:[\s\S]*letterSpacingEm: 0\.05/);
  assert.match(service, /mild:[\s\S]*bodyFontScale: 1\.16/);
  assert.match(service, /moderate:[\s\S]*bodyFontScale: 1\.2/);
  assert.match(service, /severe:[\s\S]*headingFontScale: 1\.3/);
  assert.match(service, /mild:[\s\S]*lineHeightMultiplier: 1\.72/);
  assert.match(service, /moderate:[\s\S]*lineHeightMultiplier: 1\.8/);
  assert.match(service, /mild:[\s\S]*edgeBoost: 0\.1/);
  assert.match(service, /severe:[\s\S]*edgeBoost: 0\.2/);
});

test("Astigmatism injection includes reversible runtime and visual correction CSS", () => {
  const service = fs.readFileSync(path.join(root, "astigmatism", "AstigmatismService.ts"), "utf8");
  const requiredSnippets = [
    "SARALO_ASTIGMATISM_TOGGLE",
    "window.SaraloAstigmatism",
    "saralo-astigmatism-enabled",
    "font-weight:",
    "font-size:calc(1em*",
    "letter-spacing:",
    "line-height:",
    "feConvolveMatrix",
    "brightness(var(--saralo-astigmatism-brightness",
    "border-width:var(--saralo-astigmatism-border",
    "max-width:var(--saralo-astigmatism-column",
    "--saralo-astigmatism-image-scale",
    "--saralo-astigmatism-secondary-opacity",
    "transition:background-color 250ms ease",
    "box-shadow:none!important",
    "#FAFAFA",
    "#111",
  ];
  for (const snippet of requiredSnippets) {
    assert.ok(service.includes(snippet), `Missing injection snippet: ${snippet}`);
  }
});

test("Astigmatism preview endpoint builds before and after frames", () => {
  const service = fs.readFileSync(path.join(root, "astigmatism", "AstigmatismService.ts"), "utf8");
  assert.match(service, /Astigmatism Mode Preview/);
  assert.match(service, /<h2>Original<\/h2>/);
  assert.match(service, /<h2>Corrected<\/h2>/);
  assert.match(service, /srcdoc=/);
});
