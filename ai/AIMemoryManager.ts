import type { AIMemoryRepository } from "./AIInterfaces";
import type { AIConversationMessage, AIMemoryState, AIRequest } from "./AITypes";
import { AIEvents } from "./AIEvents";
import type { InMemoryAIEventBus } from "./AIEvents";

export class InMemoryAIMemoryRepository implements AIMemoryRepository {
  private readonly store = new Map<string, AIMemoryState>();

  async load(scopeId: string): Promise<AIMemoryState | undefined> {
    return this.store.get(scopeId);
  }

  async save(scopeId: string, memory: AIMemoryState): Promise<void> {
    this.store.set(scopeId, memory);
  }
}

export class AIMemoryManager {
  constructor(
    private readonly repository: AIMemoryRepository = new InMemoryAIMemoryRepository(),
    private readonly eventBus?: InMemoryAIEventBus
  ) {}

  async loadForRequest(request: AIRequest): Promise<AIMemoryState> {
    const scopeId = this.scopeId(request);
    return (
      (await this.repository.load(scopeId)) ?? {
        conversation: [],
        session: {},
        preferences: {},
        context: {},
        longTerm: {}
      }
    );
  }

  async remember(request: AIRequest, update: Partial<AIMemoryState>): Promise<AIMemoryState> {
    const scopeId = this.scopeId(request);
    const current = await this.loadForRequest(request);
    const next: AIMemoryState = {
      conversation: update.conversation ?? current.conversation,
      session: { ...current.session, ...update.session },
      preferences: { ...current.preferences, ...update.preferences },
      context: { ...current.context, ...update.context },
      longTerm: { ...current.longTerm, ...update.longTerm }
    };
    await this.repository.save(scopeId, next);
    this.eventBus?.emit(AIEvents.MEMORY_UPDATED, { scopeId, pageSessionId: request.pageSessionId });
    return next;
  }

  async appendConversation(request: AIRequest, messages: AIConversationMessage[]): Promise<void> {
    const memory = await this.loadForRequest(request);
    await this.remember(request, { conversation: [...memory.conversation, ...messages].slice(-20) });
  }

  private scopeId(request: AIRequest): string {
    return request.conversationId ?? request.pageSessionId ?? request.userId ?? "guest";
  }
}
