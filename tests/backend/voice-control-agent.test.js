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

test("web voice assistant uses universal safe intents and browser speech APIs", () => {
  const hook = fs.readFileSync(path.join(root, "apps", "web", "src", "voice", "useVoiceControlAgent.ts"), "utf8");
  const panel = fs.readFileSync(path.join(root, "apps", "web", "src", "components", "Viewer", "VoiceControlPanel.tsx"), "utf8");
  const adaptiveViewer = fs.readFileSync(path.join(root, "apps", "web", "src", "components", "Viewer", "AdaptiveViewer.tsx"), "utf8");
  const viteConfig = fs.readFileSync(path.join(root, "apps", "web", "vite.config.ts"), "utf8");

  assert.match(hook, /getUserMedia\(\{ audio: true \}\)/);
  assert.match(hook, /allowCommand/);
  assert.match(hook, /handleUniversalCommand/);
  assert.match(hook, /parseCommandWithAI/);
  assert.match(hook, /executeAssistantIntent/);
  assert.match(hook, /parseCommandFallback/);
  assert.match(hook, /allowedIntents/);
  assert.match(hook, /SARALO_BRIDGE_READY/);
  assert.match(hook, /SARALO_ASSISTANT_COMMAND/);
  assert.doesNotMatch(hook, /element\.click\(/);
  assert.doesNotMatch(hook, /querySelectorAll<HTMLElement>\("button,a,input/);
  assert.match(hook, /SpeechRecognition|webkitSpeechRecognition/);
  assert.match(hook, /speechSynthesis/);
  for (const intent of ["OPEN_CART", "OPEN_CHECKOUT", "SEARCH_PRODUCT", "TURN_ON_LOW_VISION", "STOP_READING"]) {
    assert.match(hook, new RegExp(intent));
  }
  assert.match(panel, /voice-language-options/);
  assert.match(panel, /Transcript/);
  assert.match(panel, /Detected command/);
  assert.match(panel, /Reply/);
  assert.match(adaptiveViewer, /useVoiceControlAgent\(\{ iframeRef, session \}\)/);
  assert.match(viteConfig, /\/api\/voice-intent/);
  assert.match(viteConfig, /responseMimeType: 'application\/json'/);
});
