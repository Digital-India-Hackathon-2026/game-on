const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "../..");

test("AIService preserves the documented pipeline order", () => {
  const source = fs.readFileSync(path.join(root, "ai", "AIService.ts"), "utf8");
  const runBody = source.slice(source.indexOf("async run("), source.indexOf("simplify(request"));
  const stages = [
    "this.validator.validate",
    "this.contextBuilder.build",
    "this.promptRegistry",
    "provider.complete",
    "this.formatter.format",
    "this.historyManager.saveSuccess"
  ];
  const positions = stages.map((stage) => runBody.indexOf(stage));
  for (const [index, position] of positions.entries()) assert.notEqual(position, -1, `${stages[index]} should be present`);
  assert.deepEqual([...positions].sort((a, b) => a - b), positions);
});

test("every requested module is registered as replaceable capability", () => {
  const source = fs.readFileSync(path.join(root, "ai", "modules", "index.ts"), "utf8");
  for (const task of [
    "simplify",
    "summarize",
    "translate",
    "rewrite",
    "explain",
    "conversation",
    "ask",
    "checklist",
    "reading_guide",
    "visual_explain",
    "form_assistant",
    "website_explanation",
    "navigation_guidance",
    "security_explanation",
    "predict_next_step",
    "mistake_detection"
  ]) {
    assert.match(source, new RegExp(`"${task}"`));
  }
});
