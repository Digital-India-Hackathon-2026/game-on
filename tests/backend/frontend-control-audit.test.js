const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "../..");

function readWeb(relativePath) {
  return fs.readFileSync(path.join(root, "apps", "web", "src", ...relativePath.split("/")), "utf8");
}

test("visible frontend controls avoid placeholders and have safe actions", () => {
  const files = [
    "custom/LoginPage.tsx",
    "components/Footer/Footer.tsx",
    "components/Sections/AccessibilityModes.tsx",
    "components/Viewer/ViewerToolbar.tsx",
    "components/Auth/AuthModal.tsx",
    "components/Simulation/SimulationLayer.tsx",
    "components/Hero/HeroContent.tsx",
    "hooks/usePipeline.ts",
  ];

  const combined = files.map(readWeb).join("\n");

  assert.ok(!combined.includes('href="#"'), "Visible controls should not use placeholder hash links");
  assert.ok(!combined.includes("onClick={() => {}}"), "Visible controls should not have empty click handlers");
  assert.ok(!combined.includes("alert("), "Visible controls should not use placeholder alerts");
  assert.ok(!combined.includes("console.log("), "Visible controls should not be console-only");
  assert.ok(!combined.includes("localhost"), "Visible controls should not call localhost");
  assert.ok(!combined.includes("127.0.0.1"), "Visible controls should not call loopback URLs");

  const loginPage = readWeb("custom/LoginPage.tsx");
  assert.ok(loginPage.includes("showDemoHelp"), "Login helper/footer controls should produce visible feedback");
  assert.ok(loginPage.includes('aria-pressed={showPassword}'), "Password visibility toggle should expose pressed state");
  assert.ok(loginPage.includes("disabled={auth.authLoading}"), "Login actions should disable while authentication is processing");

  const accessibilityModes = readWeb("components/Sections/AccessibilityModes.tsx");
  assert.ok(accessibilityModes.includes("<button"), "Mode card CTA should be a real button");
  assert.ok(accessibilityModes.includes("disabled={!onSelectMode}"), "Mode card CTA should have a disabled fallback state");
  assert.ok(!accessibilityModes.includes("#mode-"), "Mode card CTA should not point to missing hash routes");

  const toolbar = readWeb("components/Viewer/ViewerToolbar.tsx");
  assert.ok(toolbar.includes('aria-haspopup="menu"'), "Mode dropdown trigger should declare menu behavior");
  assert.ok(toolbar.includes("aria-expanded={showModeSwitch}"), "Mode dropdown trigger should expose expanded state");
  assert.ok(toolbar.includes('role="menuitem"'), "Mode dropdown items should expose menu item roles");

  const authModal = readWeb("components/Auth/AuthModal.tsx");
  assert.ok(authModal.match(/disabled=\{auth\.authLoading\}/g).length >= 3, "All modal auth actions should disable while loading");

  const simulationLayer = readWeb("components/Simulation/SimulationLayer.tsx");
  assert.ok(simulationLayer.includes('aria-label="Close simulation"'), "Icon-only simulator close button needs a label");
  assert.ok(simulationLayer.includes("aria-pressed={adhdFocusRecovery}"), "ADHD simulator toggle should expose pressed state");
  assert.ok(simulationLayer.includes("aria-pressed={cognitiveFixed}"), "Cognitive simulator toggle should expose pressed state");

  const pipeline = readWeb("hooks/usePipeline.ts");
  assert.ok(pipeline.includes("`https://${rawUrl}`"), "Analyze action should normalize bare domains to HTTPS");
});
