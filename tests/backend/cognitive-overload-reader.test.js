const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "../..");

test("Cognitive Overload mode preserves page content and adds reader tools", () => {
  const viteConfig = fs.readFileSync(path.join(root, "apps", "web", "vite.config.ts"), "utf8");

  const requiredSnippets = [
    "saralo-cog-simplified",
    "Show full text",
    "saralo-cog-primary",
    "ensureCognitiveReader",
    "removeCognitiveReader",
    "saralo-mode-cognitive-overload.saralo-setting-theme-dark",
  ];

  for (const snippet of requiredSnippets) {
    assert.ok(viteConfig.includes(snippet), `Missing Cognitive Overload snippet: ${snippet}`);
  }

  const cognitiveCssStart = viteConfig.indexOf("html.saralo-mode-cognitive-overload");
  const cssEnd = viteConfig.indexOf("  `;", cognitiveCssStart);
  const cognitiveCss = viteConfig.slice(cognitiveCssStart, cssEnd);

  assert.ok(!cognitiveCss.includes("aside,html.saralo-mode-cognitive-overload nav"), "Cognitive mode should not use the old broad hide rule");
  assert.ok(!cognitiveCss.includes("[class*=\"ad\"],html.saralo-mode-cognitive-overload [id*=\"ad\"]{display:none"), "Cognitive mode should collapse ads instead of hard-removing page regions");
  assert.ok(!cognitiveCss.includes("main{display:none"), "Cognitive mode should not hide main content");
  assert.ok(cognitiveCss.includes("max-height:96px"), "Secondary content should collapse instead of disappearing");
  assert.ok(cognitiveCss.includes("main,html.saralo-mode-cognitive-overload article"), "Main content should stay visible");
  assert.ok(!viteConfig.includes("saralo-cog-toolbar"), "Cognitive controls should live in Settings, not an injected page toolbar");
  assert.ok(!viteConfig.includes("Cognitive Overload Mode</strong>"), "Cognitive mode should not add a duplicate control bar");
  assert.ok(!viteConfig.includes("in a calmer reading experience"), "Cognitive mode should not inject a direct AI Summary card into the website");
});

test("Settings panel no longer exposes Fix This UI wording", () => {
  const toolbar = fs.readFileSync(path.join(root, "apps", "web", "src", "components", "Viewer", "ViewerToolbar.tsx"), "utf8");
  assert.ok(!toolbar.includes("Fix This UI"), "Fix This UI button should be removed");
});

test("AI Summary is settings-driven and does not add a floating page button", () => {
  const viteConfig = fs.readFileSync(path.join(root, "apps", "web", "vite.config.ts"), "utf8");

  const requiredSnippets = [
    "saralo-ai-summary-card",
    "ensureGlobalAiSummary",
    "toggleGlobalAiSummary",
    "removeGlobalAiSummary",
    "data-summary-mode",
    "data-summary-length",
    "installProxyNavigation",
    "removeGlobalAiSummary();",
  ];

  for (const snippet of requiredSnippets) {
    assert.ok(viteConfig.includes(snippet), `Missing global AI Summary snippet: ${snippet}`);
  }

  const applyStart = viteConfig.indexOf("function apply(payload)");
  const startupBlock = viteConfig.slice(applyStart);
  assert.ok(!viteConfig.includes("saralo-ai-summary-trigger"), "AI Summary should not add a floating button inside the website");
  assert.ok(!startupBlock.includes("ensureGlobalAiSummary();"), "AI Summary should not initialize unless the Settings toggle enables it");
  assert.ok(!startupBlock.includes("toggleGlobalAiSummary(true)"), "AI Summary should not render directly into the website");

  const cognitiveOnlyBlock = "if(payload.mode==='cognitive-overload'){ensureCognitiveReader();applyCognitiveRuntime(settings);}";
  const cognitiveOnlyStart = viteConfig.indexOf(cognitiveOnlyBlock);
  assert.ok(cognitiveOnlyStart > -1, "Cognitive settings should keep driving the summary runtime");
});
