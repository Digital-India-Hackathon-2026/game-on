"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VoiceHistory = void 0;
class VoiceHistory {
    records = [];
    record(session) {
        this.records.push(session);
    }
    list(userId) {
        return this.records.filter((session) => !userId || session.userId === userId);
    }
}
exports.VoiceHistory = VoiceHistory;
