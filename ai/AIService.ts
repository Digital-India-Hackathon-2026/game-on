import type { AIConfiguration } from "./AIConfiguration";
import { createDefaultAIConfiguration, validateAIConfiguration } from "./AIConfiguration";
import { AIEvents, InMemoryAIEventBus } from "./AIEvents";
import { AIErrorHandler } from "./AIErrorHandler";
import type { AIContextProvider, AIProviderAdapter, AIResponseFormatterPort, AIServicePort } from "./AIInterfaces";
import { AIRegistry } from "./AIRegistry";
import { PromptRegistry } from "./PromptRegistry";
import { AIRequestValidator } from "./AIRequestValidator";
import { AIContextBuilder } from "./AIContextBuilder";
import { AIResponseFormatter } from "./AIResponseFormatter";
import { AIHistoryManager } from "./AIHistoryManager";
import { AIMemoryManager } from "./AIMemoryManager";
import { AIConversationManager } from "./AIConversationManager";
import { GeminiAIProviderAdapter } from "./adapters/GeminiAIProviderAdapter";
import { MockAIProvider } from "./adapters/MockAIProvider";
import { defaultAIModules } from "./modules";
import type { AIProviderMessage, AIRequest, AIResponse, AITaskType } from "./AITypes";
import { createId, nowIso, serializeContextForProvider } from "./AIUtilities";

export interface AIServiceDependencies {
  config?: Partial<AIConfiguration>;
  registry?: AIRegistry;
  promptRegistry?: PromptRegistry;
  validator?: AIRequestValidator;
  contextBuilder?: AIContextProvider;
  formatter?: AIResponseFormatterPort;
  historyManager?: AIHistoryManager;
  memoryManager?: AIMemoryManager;
  conversationManager?: AIConversationManager;
  eventBus?: InMemoryAIEventBus;
  errorHandler?: AIErrorHandler;
  providers?: AIProviderAdapter[];
}

export class AIService implements AIServicePort {
  readonly config: AIConfiguration;
  readonly registry: AIRegistry;
  readonly promptRegistry: PromptRegistry;
  readonly eventBus: InMemoryAIEventBus;
  readonly memoryManager: AIMemoryManager;
  readonly historyManager: AIHistoryManager;

  private readonly validator: AIRequestValidator;
  private readonly contextBuilder: AIContextProvider;
  private readonly formatter: AIResponseFormatterPort;
  private readonly conversationManager: AIConversationManager;
  private readonly errorHandler: AIErrorHandler;

  constructor(dependencies: AIServiceDependencies = {}) {
    this.config = createDefaultAIConfiguration(dependencies.config);
    validateAIConfiguration(this.config);
    this.eventBus = dependencies.eventBus ?? new InMemoryAIEventBus();
    this.registry = dependencies.registry ?? new AIRegistry();
    this.promptRegistry = dependencies.promptRegistry ?? new PromptRegistry();
    this.memoryManager = dependencies.memoryManager ?? new AIMemoryManager(undefined, this.eventBus);
    this.historyManager = dependencies.historyManager ?? new AIHistoryManager(undefined, this.eventBus);
    this.validator = dependencies.validator ?? new AIRequestValidator();
    this.contextBuilder = dependencies.contextBuilder ?? new AIContextBuilder(this.config, this.memoryManager);
    this.formatter = dependencies.formatter ?? new AIResponseFormatter();
    this.conversationManager = dependencies.conversationManager ?? new AIConversationManager(this.memoryManager);
    this.errorHandler = dependencies.errorHandler ?? new AIErrorHandler();

    for (const provider of dependencies.providers ?? [new GeminiAIProviderAdapter(), new MockAIProvider()]) {
      this.registry.registerProvider(provider);
    }
    for (const module of defaultAIModules) this.registry.registerModule(module);
  }

  async run(request: AIRequest): Promise<AIResponse> {
    const requestId = createId("ai_req");
    const started = Date.now();
    this.eventBus.emit(AIEvents.AI_REQUEST_STARTED, { requestId, task: request.task, pageSessionId: request.pageSessionId });

    try {
      this.validator.validate(request);
      const context = await this.contextBuilder.build(request);
      const prompt = request.promptKey
        ? this.promptRegistry.get(request.promptKey, context.language)
        : this.promptRegistry.getByTask(request.task, context.language);
      this.eventBus.emit(AIEvents.PROMPT_SELECTED, { requestId, promptKey: prompt.key, promptVersion: prompt.version });

      const route = this.config.taskRoutes[request.task];
      const providerName = request.provider ?? route.provider ?? this.config.defaultProvider;
      const provider = this.registry.getProvider(providerName);
      const model = request.model ?? route.model;
      const providerRequest = {
        messages: this.toProviderMessages(prompt.systemInstruction, prompt.developerInstruction, serializeContextForProvider(context)),
        model,
        temperature: route.temperature,
        maxTokens: route.maxTokens,
        timeoutMs: this.config.timeoutMs,
        responseFormat: request.outputFormat ?? "markdown",
        metadata: { requestId, task: request.task, promptKey: prompt.key, promptVersion: prompt.version }
      };

      const raw = await provider.complete(providerRequest);
      const formatted = this.formatter.format(raw, context);
      const response: AIResponse = {
        requestId,
        task: request.task,
        provider: raw.provider,
        model: raw.model,
        safetyStatus: context.security.decision === "block" ? "blocked" : context.security.warnings.length ? "warned" : "passed",
        formatted,
        createdAt: nowIso(),
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
      this.eventBus.emit(AIEvents.AI_REQUEST_COMPLETED, { requestId, task: request.task, executionTimeMs: response.executionTimeMs });
      return response;
    } catch (error) {
      const normalized = this.errorHandler.normalize(error);
      await this.historyManager.saveFailure(request, normalized, Date.now() - started);
      this.eventBus.emit(AIEvents.AI_REQUEST_FAILED, { requestId, task: request.task, code: normalized.code, message: normalized.message });
      throw normalized;
    }
  }

  simplify(request: Omit<AIRequest, "task">): Promise<AIResponse> {
    return this.registry.getModule("simplify").execute({ ...request, task: "simplify" }, this);
  }

  summarize(request: Omit<AIRequest, "task">): Promise<AIResponse> {
    return this.registry.getModule("summarize").execute({ ...request, task: "summarize" }, this);
  }

  translate(request: Omit<AIRequest, "task">): Promise<AIResponse> {
    return this.registry.getModule("translate").execute({ ...request, task: "translate" }, this);
  }

  rewrite(request: Omit<AIRequest, "task">): Promise<AIResponse> {
    return this.registry.getModule("rewrite").execute({ ...request, task: "rewrite" }, this);
  }

  explain(request: Omit<AIRequest, "task">): Promise<AIResponse> {
    return this.registry.getModule("explain").execute({ ...request, task: "explain" }, this);
  }

  conversation(request: Omit<AIRequest, "task">): Promise<AIResponse> {
    return this.registry.getModule("conversation").execute({ ...request, task: "conversation" }, this);
  }

  ask(request: Omit<AIRequest, "task">): Promise<AIResponse> {
    return this.registry.getModule("ask").execute({ ...request, task: "ask" }, this);
  }

  generateChecklist(request: Omit<AIRequest, "task">): Promise<AIResponse> {
    return this.registry.getModule("checklist").execute({ ...request, task: "checklist" }, this);
  }

  readingGuide(request: Omit<AIRequest, "task">): Promise<AIResponse> {
    return this.registry.getModule("reading_guide").execute({ ...request, task: "reading_guide" }, this);
  }

  visualExplain(request: Omit<AIRequest, "task">): Promise<AIResponse> {
    return this.registry.getModule("visual_explain").execute({ ...request, task: "visual_explain" }, this);
  }

  formAssistant(request: Omit<AIRequest, "task">): Promise<AIResponse> {
    return this.registry.getModule("form_assistant").execute({ ...request, task: "form_assistant" }, this);
  }

  websiteGuide(request: Omit<AIRequest, "task">): Promise<AIResponse> {
    return this.registry.getModule("website_explanation").execute({ ...request, task: "website_explanation" }, this);
  }

  navigationGuide(request: Omit<AIRequest, "task">): Promise<AIResponse> {
    return this.registry.getModule("navigation_guidance").execute({ ...request, task: "navigation_guidance" }, this);
  }

  securityExplanation(request: Omit<AIRequest, "task">): Promise<AIResponse> {
    return this.registry.getModule("security_explanation").execute({ ...request, task: "security_explanation" }, this);
  }

  predictNextStep(request: Omit<AIRequest, "task">): Promise<AIResponse> {
    return this.registry.getModule("predict_next_step").execute({ ...request, task: "predict_next_step" }, this);
  }

  mistakeDetection(request: Omit<AIRequest, "task">): Promise<AIResponse> {
    return this.registry.getModule("mistake_detection").execute({ ...request, task: "mistake_detection" }, this);
  }

  private toProviderMessages(systemInstruction: string, developerInstruction: string, context: string): AIProviderMessage[] {
    return [
      { role: "system", content: systemInstruction },
      { role: "system", content: developerInstruction },
      { role: "user", content: context }
    ];
  }
}
