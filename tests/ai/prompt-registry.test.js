const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "../..");

test("prompt library keeps each required prompt in its own module", () => {
  const promptDir = path.join(root, "ai", "PromptTemplates");
  const files = fs.readdirSync(promptDir).filter((file) => file.endsWith(".ts") && !["common.ts", "index.ts"].includes(file));
  const expected = [
    "accessibilitySupport.ts",
    "askQuestions.ts",
    "checklistGenerator.ts",
    "conversation.ts",
    "explain.ts",
    "formAssistant.ts",
    "navigationGuidance.ts",
    "readingGuide.ts",
    "rewrite.ts",
    "securityExplanation.ts",
    "simplify.ts",
    "summarize.ts",
    "translate.ts",
    "visualExplanation.ts",
    "websiteExplanation.ts"
  ];
  for (const file of expected) assert.ok(files.includes(file), `${file} prompt module should exist`);
});

test("service orchestration does not contain task prompt strings", () => {
  const serviceSource = fs.readFileSync(path.join(root, "ai", "AIService.ts"), "utf8");
  assert.doesNotMatch(serviceSource, /Rewrite the|Summarize the|Translate the|Explain the selected/);
  assert.match(serviceSource, /PromptRegistry/);
});
