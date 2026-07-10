"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createVoiceId = createVoiceId;
exports.normalizeSpeechText = normalizeSpeechText;
exports.isSensitiveReadout = isSensitiveReadout;
function createVoiceId(prefix) {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
function normalizeSpeechText(text) {
    return text.replace(/\s+/g, " ").trim();
}
function isSensitiveReadout(text) {
    return /password|credit card|ssn|one-time code|otp|payment/i.test(text);
}
