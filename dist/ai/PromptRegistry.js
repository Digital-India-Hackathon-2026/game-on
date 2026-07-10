"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromptRegistry = void 0;
const AIErrorHandler_1 = require("./AIErrorHandler");
const PromptTemplates_1 = require("./PromptTemplates");
class PromptRegistry {
    prompts = new Map();
    constructor(templates = PromptTemplates_1.defaultPromptTemplates) {
        for (const template of templates)
            this.register(template);
    }
    register(template) {
        if (!template.key || !template.version || template.status === "disabled") {
            throw new AIErrorHandler_1.AIEngineError("invalid_prompt", "Prompt template is invalid.", 500, { key: template.key });
        }
        this.prompts.set(this.registryKey(template.key, template.locale), template);
    }
    get(key, locale = "en") {
        const prompt = this.prompts.get(this.registryKey(key, locale)) ?? this.prompts.get(this.registryKey(key, "en"));
        if (!prompt || prompt.status !== "active") {
            throw new AIErrorHandler_1.AIEngineError("invalid_prompt", `Prompt ${key} is not available.`, 500);
        }
        return prompt;
    }
    getByTask(task, locale = "en") {
        const prompt = this.list().find((candidate) => candidate.task === task && candidate.locale === locale) ??
            this.list().find((candidate) => candidate.task === task && candidate.locale === "en");
        if (!prompt)
            throw new AIErrorHandler_1.AIEngineError("invalid_prompt", `No active prompt registered for ${task}.`, 500);
        return prompt;
    }
    list() {
        return [...this.prompts.values()].filter((prompt) => prompt.status === "active");
    }
    registryKey(key, locale) {
        return `${key}:${locale}`;
    }
}
exports.PromptRegistry = PromptRegistry;
