import type {
  AIBuiltContext,
  AIEvent,
  AIEventName,
  AIFormattedResponse,
  AIHistoryRecord,
  AIMemoryState,
  AIProviderName,
  AIProviderRequest,
  AIProviderResponse,
  AIRequest,
  AIResponse,
  AITaskType,
  PromptTemplate
} from "./AITypes";

export interface AIProviderAdapter {
  readonly name: AIProviderName;
  complete(request: AIProviderRequest): Promise<AIProviderResponse>;
  countTokens?(input: string): Promise<number>;
  health?(): Promise<"healthy" | "degraded" | "unavailable">;
}

export interface AIPromptProvider {
  get(key: string, locale?: string): PromptTemplate;
  getByTask(task: AITaskType, locale?: string): PromptTemplate;
  list(): PromptTemplate[];
}

export interface AIContextProvider {
  build(request: AIRequest): Promise<AIBuiltContext>;
}

export interface AIResponseFormatterPort {
  format(raw: AIProviderResponse, context: AIBuiltContext): AIFormattedResponse;
}

export interface AIHistoryRepository {
  save(record: AIHistoryRecord): Promise<void>;
  list(filter?: { userId?: string; pageSessionId?: string; limit?: number }): Promise<AIHistoryRecord[]>;
}

export interface AIMemoryRepository {
  load(scopeId: string): Promise<AIMemoryState | undefined>;
  save(scopeId: string, memory: AIMemoryState): Promise<void>;
}

export interface AIEventBus {
  emit(name: AIEventName, payload: Record<string, unknown>): void;
  subscribe(name: AIEventName, handler: (event: AIEvent) => void): () => void;
}

export interface AIModule {
  readonly task: AITaskType;
  execute(request: AIRequest, service: AIServicePort): Promise<AIResponse>;
}

export interface AIServicePort {
  run(request: AIRequest): Promise<AIResponse>;
}
