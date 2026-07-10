"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIService = void 0;
const AIConfiguration_1 = require("./AIConfiguration");
const AIEvents_1 = require("./AIEvents");
const AIErrorHandler_1 = require("./AIErrorHandler");
const AIRegistry_1 = require("./AIRegistry");
const PromptRegistry_1 = require("./PromptRegistry");
const AIRequestValidator_1 = require("./AIRequestValidator");
const AIContextBuilder_1 = require("./AIContextBuilder");
const AIResponseFormatter_1 = require("./AIResponseFormatter");
const AIHistoryManager_1 = require("./AIHistoryManager");
const AIMemoryManager_1 = require("./AIMemoryManager");
const AIConversationManager_1 = require("./AIConversationManager");
const GeminiAIProviderAdapter_1 = require("./adapters/GeminiAIProviderAdapter");
const MockAIProvider_1 = require("./adapters/MockAIProvider");
const modules_1 = require("./modules");
const AIUtilities_1 = require("./AIUtilities");
class AIService {
    config;
    registry;
    promptRegistry;
    eventBus;
    memoryManager;
    historyManager;
    validator;
    contextBuilder;
    formatter;
    conversationManager;
    errorHandler;
    constructor(dependencies = {}) {
        this.config = (0, AIConfiguration_1.createDefaultAIConfiguration)(dependencies.config);
        (0, AIConfiguration_1.validateAIConfiguration)(this.config);
        this.eventBus = dependencies.eventBus ?? new AIEvents_1.InMemoryAIEventBus();
        this.registry = dependencies.registry ?? new AIRegistry_1.AIRegistry();
        this.promptRegistry = dependencies.promptRegistry ?? new PromptRegistry_1.PromptRegistry();
        this.memoryManager = dependencies.memoryManager ?? new AIMemoryManager_1.AIMemoryManager(undefined, this.eventBus);
        this.historyManager = dependencies.historyManager ?? new AIHistoryManager_1.AIHistoryManager(undefined, this.eventBus);
        this.validator = dependencies.validator ?? new AIRequestValidator_1.AIRequestValidator();
        this.contextBuilder = dependencies.contextBuilder ?? new AIContextBuilder_1.AIContextBuilder(this.config, this.memoryManager);
        this.formatter = dependencies.formatter ?? new AIResponseFormatter_1.AIResponseFormatter();
        this.conversationManager = dependencies.conversationManager ?? new AIConversationManager_1.AIConversationManager(this.memoryManager);
        this.errorHandler = dependencies.errorHandler ?? new AIErrorHandler_1.AIErrorHandler();
        for (const provider of dependencies.providers ?? [new GeminiAIProviderAdapter_1.GeminiAIProviderAdapter(), new MockAIProvider_1.MockAIProvider()]) {
            this.registry.registerProvider(provider);
        }
        for (const module of modules_1.defaultAIModules)
            this.registry.registerModule(module);
    }
    async run(request) {
        const requestId = (0, AIUtilities_1.createId)("ai_req");
        const started = Date.now();
        this.eventBus.emit(AIEvents_1.AIEvents.AI_REQUEST_STARTED, { requestId, task: request.task, pageSessionId: request.pageSessionId });
        try {
            this.validator.validate(request);
            const context = await this.contextBuilder.build(request);
            const prompt = request.promptKey
                ? this.promptRegistry.get(request.promptKey, context.language)
                : this.promptRegistry.getByTask(request.task, context.language);
            this.eventBus.emit(AIEvents_1.AIEvents.PROMPT_SELECTED, { requestId, promptKey: prompt.key, promptVersion: prompt.version });
            const route = this.config.taskRoutes[request.task];
            const providerName = request.provider ?? route.provider ?? this.config.defaultProvider;
            const provider = this.registry.getProvider(providerName);
            const model = request.model ?? route.model;
            const providerRequest = {
                messages: this.toProviderMessages(prompt.systemInstruction, prompt.developerInstruction, (0, AIUtilities_1.serializeContextForProvider)(context)),
                model,
                temperature: route.temperature,
                maxTokens: route.maxTokens,
                timeoutMs: this.config.timeoutMs,
                responseFormat: request.outputFormat ?? "markdown",
                metadata: { requestId, task: request.task, promptKey: prompt.key, promptVersion: prompt.version }
            };
            const raw = await provider.complete(providerRequest);
            const formatted = this.formatter.format(raw, context);
            const response = {
                requestId,
                task: request.task,
                provider: raw.provider,
                model: raw.model,
                safetyStatus: context.security.decision === "block" ? "blocked" : context.security.warnings.length ? "warned" : "passed",
                formatted,
                createdAt: (0, AIUtilities_1.nowIso)(),
                executionTimeMs: Date.now() - started,
                tokenUsage: raw.tokenUsage,
                metadata: {
                    language: context.language,
                    promptKey: prompt.key,
                    promptVersion: prompt.version,
                    promptInjectionDetected: context.security.promptInjectionDetected
                }
            };
            await this.historyManager.saveSuccess(request, response, providerRequest.messages.map((message) => message.content).join("\n\n"));
            await this.conversationManager.recordTurn(request, response);
            this.eventBus.emit(AIEvents_1.AIEvents.AI_REQUEST_COMPLETED, { requestId, task: request.task, executionTimeMs: response.executionTimeMs });
            return response;
        }
        catch (error) {
            const normalized = this.errorHandler.normalize(error);
            await this.historyManager.saveFailure(request, normalized, Date.now() - started);
            this.eventBus.emit(AIEvents_1.AIEvents.AI_REQUEST_FAILED, { requestId, task: request.task, code: normalized.code, message: normalized.message });
            throw normalized;
        }
    }
    simplify(request) {
        return this.registry.getModule("simplify").execute({ ...request, task: "simplify" }, this);
    }
    summarize(request) {
        return this.registry.getModule("summarize").execute({ ...request, task: "summarize" }, this);
    }
    translate(request) {
        return this.registry.getModule("translate").execute({ ...request, task: "translate" }, this);
    }
    rewrite(request) {
        return this.registry.getModule("rewrite").execute({ ...request, task: "rewrite" }, this);
    }
    explain(request) {
        return this.registry.getModule("explain").execute({ ...request, task: "explain" }, this);
    }
    conversation(request) {
        return this.registry.getModule("conversation").execute({ ...request, task: "conversation" }, this);
    }
    ask(request) {
        return this.registry.getModule("ask").execute({ ...request, task: "ask" }, this);
    }
    generateChecklist(request) {
        return this.registry.getModule("checklist").execute({ ...request, task: "checklist" }, this);
    }
    readingGuide(request) {
        return this.registry.getModule("reading_guide").execute({ ...request, task: "reading_guide" }, this);
    }
    visualExplain(request) {
        return this.registry.getModule("visual_explain").execute({ ...request, task: "visual_explain" }, this);
    }
    formAssistant(request) {
        return this.registry.getModule("form_assistant").execute({ ...request, task: "form_assistant" }, this);
    }
    websiteGuide(request) {
        return this.registry.getModule("website_explanation").execute({ ...request, task: "website_explanation" }, this);
    }
    navigationGuide(request) {
        return this.registry.getModule("navigation_guidance").execute({ ...request, task: "navigation_guidance" }, this);
    }
    securityExplanation(request) {
        return this.registry.getModule("security_explanation").execute({ ...request, task: "security_explanation" }, this);
    }
    predictNextStep(request) {
        return this.registry.getModule("predict_next_step").execute({ ...request, task: "predict_next_step" }, this);
    }
    mistakeDetection(request) {
        return this.registry.getModule("mistake_detection").execute({ ...request, task: "mistake_detection" }, this);
    }
    toProviderMessages(systemInstruction, developerInstruction, context) {
        return [
            { role: "system", content: systemInstruction },
            { role: "system", content: developerInstruction },
            { role: "user", content: context }
        ];
    }
}
exports.AIService = AIService;
