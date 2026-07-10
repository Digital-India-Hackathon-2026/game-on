const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "../..");

test("authenticated users skip login while stored sessions are being restored", () => {
  const saraloHome = fs.readFileSync(path.join(root, "apps", "web", "src", "custom", "SaraloHome.tsx"), "utf8");
  const authHook = fs.readFileSync(path.join(root, "apps", "web", "src", "hooks", "useAuth.ts"), "utf8");

  assert.ok(authHook.includes("saralo.session"), "Auth should persist the user session");
  assert.ok(authHook.includes("readStoredSession"), "Auth should restore saved sessions");
  assert.ok(saraloHome.includes("auth.authLoading"), "Login should not render while auth is restoring");
  assert.ok(saraloHome.indexOf("auth.authLoading") < saraloHome.indexOf("!auth.isAuthenticated"), "Stored-session check should happen before rendering LoginPage");
});

test("profile menu replaces standalone logout and get started buttons", () => {
  const header = fs.readFileSync(path.join(root, "apps", "web", "src", "components", "Header", "Header.tsx"), "utf8");
  const styles = fs.readFileSync(path.join(root, "apps", "web", "src", "custom", "custom-ui.css"), "utf8");

  assert.ok(header.includes("profile-dropdown"), "Header should render a compact profile dropdown");
  assert.ok(header.includes("Logout"), "Dropdown should include logout");
  assert.ok(!header.includes("Get Started Free"), "Header should not render a standalone Get Started button");
  assert.ok(!header.includes("Log Out"), "Header should not render a standalone Log Out button");
  assert.ok(styles.includes(".profile-dropdown.is-open"), "Profile dropdown should animate open");
});

test("exiting viewer returns to mode selection and logout clears navigation state", () => {
  const sessionHook = fs.readFileSync(path.join(root, "apps", "web", "src", "hooks", "useAdaptiveSession.ts"), "utf8");
  const saraloHome = fs.readFileSync(path.join(root, "apps", "web", "src", "custom", "SaraloHome.tsx"), "utf8");

  assert.ok(sessionHook.includes('setSessionPhase("mode-select")'), "Viewer exit should return to Mode Selection");
  assert.ok(sessionHook.includes("exitModeSelect"), "Mode Selection should still support returning home");
  assert.ok(saraloHome.includes("handleLogout"), "Logout should use a controlled handler");
  assert.ok(saraloHome.includes("auth.logout()"), "Logout should clear the auth session");
  assert.ok(saraloHome.includes("session.exitModeSelect()"), "Logout should clear viewer navigation state");
});

test("hero hub uses the supplied Saralo plus image instead of the old model counter", () => {
  const orbit = fs.readFileSync(path.join(root, "apps", "web", "src", "components", "Hero", "OrbitEcosystem.tsx"), "utf8");
  const styles = fs.readFileSync(path.join(root, "apps", "web", "src", "custom", "custom-ui.css"), "utf8");

  assert.ok(orbit.includes("saralo-ai-plus.png"), "Hero hub should import the supplied Saralo plus asset");
  assert.ok(!orbit.includes("useCountUp"), "Hero hub should not show the old animated model counter");
  assert.ok(!orbit.includes("AI Models"), "Hero hub should not show the old AI Models label");
  assert.ok(styles.includes(".orbit-hub img"), "Hero hub image should be styled for smooth blending");
  assert.ok(styles.includes("object-fit: cover"), "Hero hub image should fill the circular crop");
  assert.ok(styles.includes("width: 164%"), "Hero hub should crop the supplied logo enough to remove empty image margins and visible rim");
  assert.ok(styles.includes("background: transparent"), "Hero hub should not add a second visible ring behind the logo");
  assert.ok(!styles.includes("rgba(235, 184, 255, 0.16)"), "Hero hub should not add a pink outline around the logo");
});
