"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VoiceValidators = void 0;
const VoiceConfiguration_1 = require("./VoiceConfiguration");
class VoiceValidators {
    validatePreferences(preferences) {
        if (preferences.speechRate < 0.5 || preferences.speechRate > 2)
            throw new Error("Speech rate is out of range.");
        if (preferences.pitch < 0.5 || preferences.pitch > 2)
            throw new Error("Pitch is out of range.");
        if (preferences.volume < 0 || preferences.volume > 1)
            throw new Error("Volume is out of range.");
    }
    validateTts(request) {
        if (!request.preferences.ttsEnabled)
            throw new Error("Text-to-speech is disabled.");
        if (!request.text.trim())
            throw new Error("Text-to-speech text is required.");
        if (request.text.length > VoiceConfiguration_1.VoiceConfiguration.maxTextCharacters)
            throw new Error("Text-to-speech text is too long.");
    }
    validateStt(request) {
        if (request.audio.byteLength > VoiceConfiguration_1.VoiceConfiguration.maxAudioBytes)
            throw new Error("Audio upload is too large.");
    }
}
exports.VoiceValidators = VoiceValidators;
