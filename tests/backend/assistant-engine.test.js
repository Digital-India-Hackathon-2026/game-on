const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "../..");
const assistantEnginePath = path.join(root, "apps", "web", "src", "services", "assistantEngine.ts");

test("assistant engine exports shared rule-based universal command parser", () => {
  const source = fs.readFileSync(assistantEnginePath, "utf8");

  assert.match(source, /export function handleUniversalCommand\(inputText: string\)/);
  assert.match(source, /AssistantCommandResult/);
  assert.doesNotMatch(source, /Gemini|generateContent|fetch\(|speechSynthesis|SpeechRecognition/);

  for (const snippet of [
    "open cart",
    "cart kholo",
    "checkout kholo",
    "page padho",
    "short mein batao",
    "text bada karo",
    "dyslexia mode",
    "focus mode",
    "stop reading",
  ]) {
    assert.match(source, new RegExp(snippet));
  }

  for (const intent of [
    "OPEN_CART",
    "OPEN_CHECKOUT",
    "READ_PAGE",
    "SUMMARIZE_PAGE",
    "TURN_ON_LOW_VISION",
    "TURN_ON_DYSLEXIA",
    "TURN_ON_ADHD",
    "STOP_READING",
  ]) {
    assert.match(source, new RegExp(intent));
  }
});
