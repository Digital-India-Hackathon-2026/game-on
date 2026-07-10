"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InMemoryAIEventBus = exports.AIEvents = void 0;
const AIUtilities_1 = require("./AIUtilities");
exports.AIEvents = {
    AI_REQUEST_STARTED: "AI_REQUEST_STARTED",
    AI_REQUEST_COMPLETED: "AI_REQUEST_COMPLETED",
    AI_REQUEST_FAILED: "AI_REQUEST_FAILED",
    MEMORY_UPDATED: "MEMORY_UPDATED",
    PROMPT_SELECTED: "PROMPT_SELECTED",
    MODEL_CHANGED: "MODEL_CHANGED",
    HISTORY_SAVED: "HISTORY_SAVED"
};
class InMemoryAIEventBus {
    handlers = new Map();
    events = [];
    emit(name, payload) {
        const event = { id: (0, AIUtilities_1.createId)("evt"), name, timestamp: (0, AIUtilities_1.nowIso)(), payload };
        this.events.push(event);
        for (const handler of this.handlers.get(name) ?? [])
            handler(event);
    }
    subscribe(name, handler) {
        const handlers = this.handlers.get(name) ?? new Set();
        handlers.add(handler);
        this.handlers.set(name, handlers);
        return () => handlers.delete(handler);
    }
}
exports.InMemoryAIEventBus = InMemoryAIEventBus;
