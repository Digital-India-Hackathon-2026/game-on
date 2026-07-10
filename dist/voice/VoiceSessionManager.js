"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VoiceSessionManager = void 0;
const VoiceRepositories_1 = require("./VoiceRepositories");
const VoiceUtilities_1 = require("./VoiceUtilities");
class VoiceSessionManager {
    repository;
    constructor(repository = new VoiceRepositories_1.VoiceSessionRepository()) {
        this.repository = repository;
    }
    async create(input) {
        const session = {
            id: (0, VoiceUtilities_1.createVoiceId)("voice"),
            userId: input.userId,
            pageSessionId: input.pageSessionId,
            mode: input.mode,
            provider: input.provider,
            inputText: input.inputText,
            status: "processing",
            createdAt: new Date().toISOString(),
            metadata: input.metadata ?? {}
        };
        await this.repository.save(session);
        return session;
    }
    list(userId) {
        return this.repository.list(userId);
    }
}
exports.VoiceSessionManager = VoiceSessionManager;
