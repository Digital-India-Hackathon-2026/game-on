"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockAIProvider = void 0;
const AIUtilities_1 = require("../AIUtilities");
class MockAIProvider {
    responder;
    name = "mock";
    constructor(responder = MockAIProvider.defaultResponse) {
        this.responder = responder;
    }
    async complete(request) {
        const text = this.responder(request);
        return {
            text,
            model: request.model,
            provider: this.name,
            tokenUsage: {
                inputTokens: (0, AIUtilities_1.estimateTokens)(request.messages.map((message) => message.content).join("\n")),
                outputTokens: (0, AIUtilities_1.estimateTokens)(text),
                totalTokens: (0, AIUtilities_1.estimateTokens)(request.messages.map((message) => message.content).join("\n")) + (0, AIUtilities_1.estimateTokens)(text)
            }
        };
    }
    async health() {
        return "healthy";
    }
    static defaultResponse(request) {
        const taskLine = request.messages.find((message) => message.role === "user")?.content.match(/Task: ([^\n]+)/)?.[1] ?? "task";
        return [
            `Saralo ${taskLine} response.`,
            "- Key takeaway: This is grounded in the provided page context.",
            "- Action: Review the cited source section before taking sensitive action.",
            "Accessibility note: Kept short sentences and plain language.",
            "Citation: section_1"
        ].join("\n");
    }
}
exports.MockAIProvider = MockAIProvider;
