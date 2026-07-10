import type { SpeechToTextRequest, SpeechToTextResult, TextToSpeechRequest, TextToSpeechResult } from "./VoiceTypes";

export interface VoiceAdapter {
  readonly name: string;
  synthesize(request: TextToSpeechRequest): Promise<TextToSpeechResult>;
  transcribe(request: SpeechToTextRequest): Promise<SpeechToTextResult>;
  listVoices(): Promise<string[]>;
}

export class MockVoiceAdapter implements VoiceAdapter {
  readonly name = "mock";

  async synthesize(request: TextToSpeechRequest): Promise<TextToSpeechResult> {
    return {
      audioPath: `voice-assets/mock/${Date.now()}.txt`,
      durationMs: Math.max(1000, request.text.split(/\s+/).length * 350),
      captions: request.preferences.captionsEnabled ? request.text : ""
    };
  }

  async transcribe(request: SpeechToTextRequest): Promise<SpeechToTextResult> {
    if (request.onPartialTranscript) {
      request.onPartialTranscript("read");
      await new Promise((resolve) => setTimeout(resolve, 80));
      request.onPartialTranscript("read aloud");
    }
    return { transcript: "read aloud", languageCode: "en", confidence: 0.99, requiresConfirmation: false };
  }

  async listVoices(): Promise<string[]> {
    return ["default_calm"];
  }
}
