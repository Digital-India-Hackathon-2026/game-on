"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VoiceEvents = void 0;
class VoiceEvents {
    events = [];
    emit(name, payload) {
        this.events.push({ name, timestamp: new Date().toISOString(), payload });
    }
}
exports.VoiceEvents = VoiceEvents;
