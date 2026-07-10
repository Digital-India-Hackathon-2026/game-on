"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIHistoryManager = exports.InMemoryAIHistoryRepository = void 0;
const AIEvents_1 = require("./AIEvents");
const AIUtilities_1 = require("./AIUtilities");
class InMemoryAIHistoryRepository {
    records = [];
    async save(record) {
        this.records.push(record);
    }
    async list(filter = {}) {
        return this.records
            .filter((record) => !filter.userId || record.userId === filter.userId)
            .filter((record) => !filter.pageSessionId || record.pageSessionId === filter.pageSessionId)
            .slice(-(filter.limit ?? 50));
    }
}
exports.InMemoryAIHistoryRepository = InMemoryAIHistoryRepository;
class AIHistoryManager {
    repository;
    eventBus;
    constructor(repository = new InMemoryAIHistoryRepository(), eventBus) {
        this.repository = repository;
        this.eventBus = eventBus;
    }
    async saveSuccess(request, response, prompt) {
        if (request.preferences?.historyEnabled === false)
            return;
        const record = {
            id: (0, AIUtilities_1.createId)("hist"),
            userId: request.userId,
            pageSessionId: request.pageSessionId,
            taskType: request.task,
            prompt,
            response: response.formatted.content,
            timestamp: (0, AIUtilities_1.nowIso)(),
            website: request.webpage?.sourceUrl,
            accessibilityMode: request.preferences?.accessibilityProfileKey,
            language: response.metadata?.language ?? request.language ?? "en",
            executionTimeMs: response.executionTimeMs,
            model: response.model,
            provider: response.provider,
            tokenUsage: response.tokenUsage,
            status: "success",
            metadata: response.metadata
        };
        await this.repository.save(record);
        this.eventBus?.emit(AIEvents_1.AIEvents.HISTORY_SAVED, { historyId: record.id, requestId: response.requestId });
    }
    async saveFailure(request, error, executionTimeMs) {
        if (request.preferences?.historyEnabled === false)
            return;
        await this.repository.save({
            id: (0, AIUtilities_1.createId)("hist"),
            userId: request.userId,
            pageSessionId: request.pageSessionId,
            taskType: request.task,
            prompt: request.input,
            response: "",
            timestamp: (0, AIUtilities_1.nowIso)(),
            website: request.webpage?.sourceUrl,
            accessibilityMode: request.preferences?.accessibilityProfileKey,
            language: request.language ?? "en",
            executionTimeMs,
            model: request.model ?? "unknown",
            provider: request.provider ?? "mock",
            status: "failed",
            errors: [error.message]
        });
    }
    list(filter) {
        return this.repository.list(filter);
    }
}
exports.AIHistoryManager = AIHistoryManager;
