"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VoiceProfileManager = void 0;
class VoiceProfileManager {
    adaptForAccessibility(profileKey, preferences) {
        const profileOverrides = {
            senior: { speechRate: 0.8, captionsEnabled: true },
            adhd: { continuousReading: false },
            dyslexia: { speechRate: 0.85 },
            visual_comfort: { volume: 0.85 }
        };
        return { ...preferences, ...(profileOverrides[profileKey] ?? {}) };
    }
}
exports.VoiceProfileManager = VoiceProfileManager;
