"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VoicePreferenceRepository = exports.VoiceSessionRepository = void 0;
const VoiceConfiguration_1 = require("./VoiceConfiguration");
class VoiceSessionRepository {
    sessions = new Map();
    async save(session) {
        this.sessions.set(session.id, session);
    }
    async list(userId) {
        return [...this.sessions.values()].filter((session) => !userId || session.userId === userId);
    }
}
exports.VoiceSessionRepository = VoiceSessionRepository;
class VoicePreferenceRepository {
    preferences = new Map();
    async get(userId = "guest") {
        return this.preferences.get(userId) ?? VoiceConfiguration_1.defaultVoicePreferences;
    }
    async save(userId, preferences) {
        this.preferences.set(userId, preferences);
    }
}
exports.VoicePreferenceRepository = VoicePreferenceRepository;
