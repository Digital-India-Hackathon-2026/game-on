import type { AIEventBus, AIHistoryRepository } from "./AIInterfaces";
import type { AIHistoryRecord, AIRequest, AIResponse } from "./AITypes";
import { AIEvents } from "./AIEvents";
import { createId, nowIso } from "./AIUtilities";

export class InMemoryAIHistoryRepository implements AIHistoryRepository {
  private readonly records: AIHistoryRecord[] = [];

  async save(record: AIHistoryRecord): Promise<void> {
    this.records.push(record);
  }

  async list(filter: { userId?: string; pageSessionId?: string; limit?: number } = {}): Promise<AIHistoryRecord[]> {
    return this.records
      .filter((record) => !filter.userId || record.userId === filter.userId)
      .filter((record) => !filter.pageSessionId || record.pageSessionId === filter.pageSessionId)
      .slice(-(filter.limit ?? 50));
  }
}

export class AIHistoryManager {
  constructor(private readonly repository: AIHistoryRepository = new InMemoryAIHistoryRepository(), private readonly eventBus?: AIEventBus) {}

  async saveSuccess(request: AIRequest, response: AIResponse, prompt: string): Promise<void> {
    if (request.preferences?.historyEnabled === false) return;
    const record: AIHistoryRecord = {
      id: createId("hist"),
      userId: request.userId,
      pageSessionId: request.pageSessionId,
      taskType: request.task,
      prompt,
      response: response.formatted.content,
      timestamp: nowIso(),
      website: request.webpage?.sourceUrl,
      accessibilityMode: request.preferences?.accessibilityProfileKey,
      language: response.metadata?.language as string ?? request.language ?? "en",
      executionTimeMs: response.executionTimeMs,
      model: response.model,
      provider: response.provider,
      tokenUsage: response.tokenUsage,
      status: "success",
      metadata: response.metadata
    };
    await this.repository.save(record);
    this.eventBus?.emit(AIEvents.HISTORY_SAVED, { historyId: record.id, requestId: response.requestId });
  }

  async saveFailure(request: AIRequest, error: Error, executionTimeMs: number): Promise<void> {
    if (request.preferences?.historyEnabled === false) return;
    await this.repository.save({
      id: createId("hist"),
      userId: request.userId,
      pageSessionId: request.pageSessionId,
      taskType: request.task,
      prompt: request.input,
      response: "",
      timestamp: nowIso(),
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

  list(filter?: { userId?: string; pageSessionId?: string; limit?: number }): Promise<AIHistoryRecord[]> {
    return this.repository.list(filter);
  }
}
