export type VoiceMode = "tts" | "stt" | "voice_command";
export type VoiceCommandKey =
  | "open_website"
  | "summarize_page"
  | "explain_page"
  | "read_aloud"
  | "pause"
  | "resume"
  | "translate"
  | "switch_accessibility_mode"
  | "bookmark_page"
  | "find_button"
  | "find_form"
  | "find_login"
  | "navigate_page"
  | "stop"
  | "skip";

export interface VoicePreferences {
  ttsEnabled: boolean;
  sttEnabled: boolean;
  voiceId: string;
  language: string;
  speechRate: number;
  pitch: number;
  volume: number;
  autoReading: boolean;
  continuousReading: boolean;
  captionsEnabled: boolean;
}

export interface VoiceSession {
  id: string;
  userId?: string;
  pageSessionId?: string;
  mode: VoiceMode;
  provider: string;
  inputText?: string;
  transcript?: string;
  audioPath?: string;
  status: "queued" | "processing" | "ready" | "failed";
  createdAt: string;
  metadata: Record<string, unknown>;
}

export interface VoiceCommand {
  key: VoiceCommandKey;
  phrases: string[];
  enabled: boolean;
  requiresConfirmation: boolean;
  action: string;
}

export interface TextToSpeechRequest {
  text: string;
  preferences: VoicePreferences;
  pageSessionId?: string;
  userId?: string;
}

export interface TextToSpeechResult {
  audioPath: string;
  durationMs: number;
  captions: string;
}

export interface SpeechToTextRequest {
  audio: Uint8Array;
  language?: string;
  autoDetectLanguage?: boolean;
  userId?: string;
  onPartialTranscript?: (text: string) => void;
}

export interface SpeechToTextResult {
  transcript: string;
  languageCode: string;
  confidence: number;
  requiresConfirmation: boolean;
}
