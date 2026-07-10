const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "../..");

test("security engine includes required analyzers and APIs", () => {
  const analyzers = fs.readFileSync(path.join(root, "security", "analyzers.ts"), "utf8");
  for (const component of ["ScamDetector", "PhishingDetector", "SSLVerifier", "DomainReputationAnalyzer", "TyposquattingDetector", "PermissionAnalyzer", "PrivacyAnalyzer", "RedirectAnalyzer", "DownloadAnalyzer", "OfficialDomainVerifier"]) {
    assert.match(analyzers, new RegExp(component));
  }
  const service = fs.readFileSync(path.join(root, "security", "SecurityService.ts"), "utf8");
  for (const api of ["scan", "trustScore", "securityReport", "safeNavigation"]) {
    assert.match(service, new RegExp(api));
  }
});

test("REST API layer contains documented endpoint groups and OpenAPI generator", () => {
  const routes = fs.readFileSync(path.join(root, "api", "APIRoutes.ts"), "utf8");
  for (const group of ["Authentication", "User Profile", "Accessibility", "AI", "Voice", "Security", "History", "Bookmarks", "Notes", "Analytics", "Reports", "Preferences", "Website Processing", "Upload", "Feedback"]) {
    assert.match(routes, new RegExp(group));
  }
  for (const route of ["/v1/page-sessions", "/v1/security/analyze-url", "/v1/voice/stt", "/v1/public/webhooks"]) {
    assert.match(routes, new RegExp(route.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  assert.ok(fs.existsSync(path.join(root, "api", "OpenAPI.ts")));
});
