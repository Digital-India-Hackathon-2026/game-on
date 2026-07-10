const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "../..");

test("accessibility engine defines required plugin profiles without switch statements", () => {
  const plugins = fs.readFileSync(path.join(root, "accessibility", "plugins", "index.ts"), "utf8");
  for (const profile of ["ai_adaptive", "adhd", "dyslexia", "binocular_vision", "color_vision", "presbyopia", "visual_comfort", "senior"]) {
    assert.match(plugins, new RegExp(profile));
  }
  const serviceFiles = fs.readdirSync(path.join(root, "accessibility")).filter((file) => file.endsWith(".ts"));
  for (const file of serviceFiles) {
    assert.doesNotMatch(fs.readFileSync(path.join(root, "accessibility", file), "utf8"), /\bswitch\s*\(/);
  }
});

test("voice engine exposes configurable commands and STT/TTS modules", () => {
  const config = fs.readFileSync(path.join(root, "voice", "VoiceConfiguration.ts"), "utf8");
  for (const command of ["open_website", "summarize_page", "explain_page", "read_aloud", "pause", "resume", "translate", "switch_accessibility_mode", "bookmark_page", "find_button", "find_form", "find_login", "navigate_page"]) {
    assert.match(config, new RegExp(command));
  }
  assert.ok(fs.existsSync(path.join(root, "voice", "TextToSpeech.ts")));
  assert.ok(fs.existsSync(path.join(root, "voice", "SpeechToText.ts")));
});
