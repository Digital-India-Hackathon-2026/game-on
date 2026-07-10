"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccessibilityEventBus = void 0;
class AccessibilityEventBus {
    events = [];
    emit(name, payload) {
        this.events.push({ name, timestamp: new Date().toISOString(), payload });
    }
}
exports.AccessibilityEventBus = AccessibilityEventBus;
