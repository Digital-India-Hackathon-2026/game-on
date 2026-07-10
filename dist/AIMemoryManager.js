"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIMemoryManager = exports.InMemoryAIMemoryRepository = void 0;
const AIEvents_1 = require("./AIEvents");
class InMemoryAIMemoryRepository {
    store = new Map();
    async load(scopeId) {
        return this.store.get(scopeId);
    }
    async save(scopeId, memory) {
        this.store.set(scopeId, memory);
    }
}
exports.InMemoryAIMemoryRepository = InMemoryAIMemoryRepository;
class AIMemoryManager {
    repository;
    eventBus;
    constructor(repository = new InMemoryAIMemoryRepository(), eventBus) {
        this.repository = repository;
        this.eventBus = eventBus;
    }
    async loadForRequest(request) {
        const scopeId = this.scopeId(request);
        return ((await this.repository.load(scopeId)) ?? {
            conversation: [],
            session: {},
            preferences: {},
            context: {},
            longTerm: {}
        });
    }
    async remember(request, update) {
        const scopeId = this.scopeId(request);
        const current = await this.loadForRequest(request);
        const next = {
            conversation: update.conversation ?? current.conversation,
            session: { ...current.session, ...update.session },
            preferences: { ...current.preferences, ...update.preferences },
            context: { ...current.context, ...update.context },
            longTerm: { ...current.longTerm, ...update.longTerm }
        };
        await this.repository.save(scopeId, next);
        this.eventBus?.emit(AIEvents_1.AIEvents.MEMORY_UPDATED, { scopeId, pageSessionId: request.pageSessionId });
        return next;
    }
    async appendConversation(request, messages) {
        const memory = await this.loadForRequest(request);
        await this.remember(request, { conversation: [...memory.conversation, ...messages].slice(-20) });
    }
    scopeId(request) {
        return request.conversationId ?? request.pageSessionId ?? request.userId ?? "guest";
    }
}
exports.AIMemoryManager = AIMemoryManager;
