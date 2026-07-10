"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIContextBuilder = void 0;
const AIUtilities_1 = require("./AIUtilities");
class AIContextBuilder {
    config;
    memoryManager;
    constructor(config, memoryManager) {
        this.config = config;
        this.memoryManager = memoryManager;
    }
    async build(request) {
        const memory = await this.memoryManager.loadForRequest(request);
        const sections = request.webpage?.sections ?? [];
        const selectedSections = (0, AIUtilities_1.trimToTokenBudget)(sections, this.config.contextTokenBudget);
        const sourceText = selectedSections.map((section) => `${section.heading ?? ""}\n${section.text}`).join("\n");
        const promptInjectionDetected = (0, AIUtilities_1.detectPromptInjection)(`${sourceText}\n${request.input}`);
        const language = request.language ??
            request.preferences?.language ??
            request.voicePreferences?.language ??
            request.webpage?.language ??
            this.config.defaultLanguage;
        return {
            trustedInstructions: this.config.trustedInstructions,
            taskInstruction: request.promptKey ?? request.task,
            userInput: request.input,
            untrustedSections: selectedSections,
            security: {
                decision: request.webpage?.securityDecision ?? "unknown",
                warnings: request.webpage?.securityWarnings ?? [],
                promptInjectionDetected
            },
            preferences: request.preferences ?? {},
            voicePreferences: request.voicePreferences ?? {},
            conversation: memory.conversation,
            memory,
            language,
            currentTask: request.task,
            citationMap: Object.fromEntries(selectedSections.map((section) => [section.id, section.heading ?? section.id])),
            estimatedTokens: (0, AIUtilities_1.estimateTokens)(sourceText) + (0, AIUtilities_1.estimateTokens)(request.input)
        };
    }
}
exports.AIContextBuilder = AIContextBuilder;
