"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockVoiceAdapter = void 0;
class MockVoiceAdapter {
    name = "mock";
    async synthesize(request) {
        return {
            audioPath: `voice-assets/mock/${Date.now()}.txt`,
            durationMs: Math.max(1000, request.text.split(/\s+/).length * 350),
            captions: request.preferences.captionsEnabled ? request.text : ""
        };
    }
    async transcribe(request) {
        if (request.onPartialTranscript) {
            request.onPartialTranscript("read");
            await new Promise((resolve) => setTimeout(resolve, 80));
            request.onPartialTranscript("read aloud");
        }
        return { transcript: "read aloud", languageCode: "en", confidence: 0.99, requiresConfirmation: false };
    }
    async listVoices() {
        return ["default_calm"];
    }
}
exports.MockVoiceAdapter = MockVoiceAdapter;
