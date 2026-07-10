const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "../..");

test("voice control service uses adapters and external prompt templates", () => {
  const service = fs.readFileSync(path.join(root, "voice", "VoiceControlService.ts"), "utf8");
  const prompts = fs.readFileSync(path.join(root, "ai", "PromptTemplates", "voiceControl.ts"), "utf8");

  assert.match(service, /VoiceAdapter/);
  assert.match(service, /AIServicePort/);
  assert.doesNotMatch(service, /gemini|openai|whisper|claude/i);
  assert.match(prompts, /voice_control\.intent/);
  assert.match(prompts, /voice_control\.grounding/);
  assert.match(prompts, /voice_control\.confirmation/);
});

test("voice control data contracts cover multilingual execution and clarification", () => {
  const types = fs.readFileSync(path.join(root, "voice", "VoiceControlTypes.ts"), "utf8");
  const voiceTypes = fs.readFileSync(path.join(root, "voice", "VoiceTypes.ts"), "utf8");

  for (const action of ["click", "type", "scroll", "navigate", "unknown"]) {
    assert.match(types, new RegExp(action));
  }
  assert.match(types, /clarifyingQuestion/);
  assert.match(types, /VoiceControlElementManifest/);
  assert.match(voiceTypes, /languageCode/);
  assert.match(voiceTypes, /autoDetectLanguage/);
});

test("web voice dashboard asks permission, rate limits, confirms destructive actions, and supports undo", () => {
  const hook = fs.readFileSync(path.join(root, "apps", "web", "src", "voice", "useVoiceControlAgent.ts"), "utf8");
  const panel = fs.readFileSync(path.join(root, "apps", "web", "src", "components", "Viewer", "VoiceControlPanel.tsx"), "utf8");

  assert.match(hook, /getUserMedia\(\{ audio: true \}\)/);
  assert.match(hook, /allowCommand/);
  assert.match(hook, /requiresConfirmation/);
  assert.match(hook, /undoLast/);
  assert.match(hook, /SpeechRecognition|webkitSpeechRecognition/);
  assert.match(panel, /voice-language-options/);
  assert.match(panel, /Confirm/);
});
