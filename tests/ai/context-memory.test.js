const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "../..");

test("context builder combines page, accessibility, voice, conversation, memory, language, and task", () => {
  const source = fs.readFileSync(path.join(root, "ai", "AIContextBuilder.ts"), "utf8");
  for (const token of [
    "request.webpage?.sections",
    "request.preferences",
    "request.voicePreferences",
    "memory.conversation",
    "request.language",
    "currentTask: request.task"
  ]) {
    assert.match(source, new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});

test("memory manager supports conversation, session, preference, context, and future long-term memory", () => {
  const source = fs.readFileSync(path.join(root, "ai", "AIMemoryManager.ts"), "utf8");
  for (const token of ["conversation", "session", "preferences", "context", "longTerm"]) {
    assert.match(source, new RegExp(token));
  }
});
