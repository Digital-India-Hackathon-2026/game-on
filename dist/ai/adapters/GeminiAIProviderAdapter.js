"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeminiAIProviderAdapter = void 0;
const AIErrorHandler_1 = require("../AIErrorHandler");
const AIUtilities_1 = require("../AIUtilities");
class GeminiAIProviderAdapter {
    options;
    name = "gemini";
    endpoint;
    fetcher;
    constructor(options = {}) {
        this.options = options;
        this.endpoint = options.endpoint ?? "https://generativelanguage.googleapis.com/v1beta";
        this.fetcher = options.fetcher ?? fetch;
    }
    async complete(request) {
        if (!this.options.apiKey) {
            throw new AIErrorHandler_1.AIEngineError("configuration_error", "Gemini API key is not configured.", 500);
        }
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), request.timeoutMs);
        try {
            const response = await this.fetcher(`${this.endpoint}/models/${encodeURIComponent(request.model)}:generateContent?key=${encodeURIComponent(this.options.apiKey)}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                signal: controller.signal,
                body: JSON.stringify({
                    contents: request.messages.map((message) => ({
                        role: message.role === "assistant" ? "model" : "user",
                        parts: [{ text: `${message.role.toUpperCase()}: ${message.content}` }]
                    })),
                    generationConfig: {
                        temperature: request.temperature,
                        maxOutputTokens: request.maxTokens
                    }
                })
            });
            if (!response.ok) {
                throw new AIErrorHandler_1.AIEngineError("provider_failure", `Gemini returned ${response.status}.`, 502);
            }
            const data = (await response.json());
            const text = data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("").trim();
            if (!text)
                throw new AIErrorHandler_1.AIEngineError("empty_response", "Gemini returned an empty response.", 502);
            return {
                text,
                model: request.model,
                provider: this.name,
                tokenUsage: {
                    inputTokens: data.usageMetadata?.promptTokenCount ?? (0, AIUtilities_1.estimateTokens)(request.messages.map((m) => m.content).join("\n")),
                    outputTokens: data.usageMetadata?.candidatesTokenCount ?? (0, AIUtilities_1.estimateTokens)(text),
                    totalTokens: data.usageMetadata?.totalTokenCount ?? (0, AIUtilities_1.estimateTokens)(text)
                },
                raw: data
            };
        }
        finally {
            clearTimeout(timeout);
        }
    }
}
exports.GeminiAIProviderAdapter = GeminiAIProviderAdapter;
