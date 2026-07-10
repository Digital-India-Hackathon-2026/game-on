const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "../..");

test("provider layer includes Gemini and mock adapters behind the common adapter contract", () => {
  const gemini = fs.readFileSync(path.join(root, "ai", "adapters", "GeminiAIProviderAdapter.ts"), "utf8");
  const mock = fs.readFileSync(path.join(root, "ai", "adapters", "MockAIProvider.ts"), "utf8");
  assert.match(gemini, /implements AIProviderAdapter/);
  assert.match(mock, /implements AIProviderAdapter/);
});

test("history manager stores audit fields required by the AI docs", () => {
  const source = fs.readFileSync(path.join(root, "ai", "AIHistoryManager.ts"), "utf8");
  for (const field of ["prompt", "response", "timestamp", "website", "accessibilityMode", "language", "executionTimeMs", "model", "provider", "tokenUsage", "status", "errors"]) {
    assert.match(source, new RegExp(field));
  }
});

test("error handler covers provider, timeout, prompt, rate limit, network, empty, malformed, and token errors", () => {
  const source = fs.readFileSync(path.join(root, "ai", "AIErrorHandler.ts"), "utf8");
  for (const code of ["provider_failure", "timeout", "invalid_prompt", "rate_limit", "network_failure", "empty_response", "malformed_response", "token_limit"]) {
    assert.match(source, new RegExp(code));
  }
});
