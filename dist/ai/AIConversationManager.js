"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIConversationManager = void 0;
const AIUtilities_1 = require("./AIUtilities");
class AIConversationManager {
    memoryManager;
    constructor(memoryManager) {
        this.memoryManager = memoryManager;
    }
    async recordTurn(request, response) {
        const messages = [
            {
                id: (0, AIUtilities_1.createId)("msg"),
                role: "user",
                content: request.input,
                timestamp: (0, AIUtilities_1.nowIso)()
            },
            {
                id: (0, AIUtilities_1.createId)("msg"),
                role: "assistant",
                content: response.formatted.content,
                timestamp: (0, AIUtilities_1.nowIso)(),
                metadata: { requestId: response.requestId, task: response.task }
            }
        ];
        await this.memoryManager.appendConversation(request, messages);
    }
}
exports.AIConversationManager = AIConversationManager;
