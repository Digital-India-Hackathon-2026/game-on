import type { VoiceCommand, VoicePreferences } from "./VoiceTypes";

export const defaultVoicePreferences: VoicePreferences = {
  ttsEnabled: true,
  sttEnabled: false,
  voiceId: "default_calm",
  language: "en",
  speechRate: 0.9,
  pitch: 1,
  volume: 1,
  autoReading: false,
  continuousReading: false,
  captionsEnabled: true
};

export const VoiceConfiguration = {
  maxAudioBytes: 10 * 1024 * 1024,
  maxTextCharacters: 12000,
  commands: [
    ["open_website", ["open website"], true, true, "open_website"],
    ["summarize_page", ["summarize page"], true, false, "ai_summarize"],
    ["explain_page", ["explain page"], true, false, "ai_explain"],
    ["read_aloud", ["read aloud", "read this"], true, false, "tts_read"],
    ["pause", ["pause"], true, false, "reader_pause"],
    ["resume", ["resume"], true, false, "reader_resume"],
    ["translate", ["translate"], true, false, "ai_translate"],
    ["switch_accessibility_mode", ["switch accessibility mode"], true, true, "profile_switch"],
    ["bookmark_page", ["bookmark page"], true, false, "bookmark_create"],
    ["find_button", ["find button"], true, false, "find_button"],
    ["find_form", ["find form"], true, false, "find_form"],
    ["find_login", ["find login"], true, false, "find_login"],
    ["navigate_page", ["navigate page", "next section"], true, false, "navigate"],
    ["stop", ["stop"], true, false, "reader_stop"],
    ["skip", ["skip"], true, false, "reader_skip"]
  ].map(([key, phrases, enabled, requiresConfirmation, action]) => ({
    key,
    phrases,
    enabled,
    requiresConfirmation,
    action
  })) as VoiceCommand[]
};
