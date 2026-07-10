"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityEvents = void 0;
class SecurityEvents {
    events = [];
    emit(name, payload) {
        this.events.push({ name, timestamp: new Date().toISOString(), payload });
    }
}
exports.SecurityEvents = SecurityEvents;
