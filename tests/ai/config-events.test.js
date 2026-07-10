const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "../..");

test("configuration owns models, temperatures, max tokens, retries, timeout, flags, safety, and trusted instructions", () => {
  const source = fs.readFileSync(path.join(root, "ai", "AIConfiguration.ts"), "utf8");
  for (const token of ["model", "temperature", "maxTokens", "retry", "timeoutMs", "featureFlags", "safetyRules", "trustedInstructions"]) {
    assert.match(source, new RegExp(token));
  }
});

test("AI event system exposes required event names", () => {
  const source = fs.readFileSync(path.join(root, "ai", "AIEvents.ts"), "utf8");
  for (const event of ["AI_REQUEST_STARTED", "AI_REQUEST_COMPLETED", "AI_REQUEST_FAILED", "MEMORY_UPDATED", "PROMPT_SELECTED", "MODEL_CHANGED", "HISTORY_SAVED"]) {
    assert.match(source, new RegExp(event));
  }
});
