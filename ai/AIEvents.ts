import type { AIEvent, AIEventName } from "./AITypes";
import type { AIEventBus } from "./AIInterfaces";
import { createId, nowIso } from "./AIUtilities";

export const AIEvents = {
  AI_REQUEST_STARTED: "AI_REQUEST_STARTED",
  AI_REQUEST_COMPLETED: "AI_REQUEST_COMPLETED",
  AI_REQUEST_FAILED: "AI_REQUEST_FAILED",
  MEMORY_UPDATED: "MEMORY_UPDATED",
  PROMPT_SELECTED: "PROMPT_SELECTED",
  MODEL_CHANGED: "MODEL_CHANGED",
  HISTORY_SAVED: "HISTORY_SAVED"
} as const;

export class InMemoryAIEventBus implements AIEventBus {
  private readonly handlers = new Map<AIEventName, Set<(event: AIEvent) => void>>();
  readonly events: AIEvent[] = [];

  emit(name: AIEventName, payload: Record<string, unknown>): void {
    const event: AIEvent = { id: createId("evt"), name, timestamp: nowIso(), payload };
    this.events.push(event);
    for (const handler of this.handlers.get(name) ?? []) handler(event);
  }

  subscribe(name: AIEventName, handler: (event: AIEvent) => void): () => void {
    const handlers = this.handlers.get(name) ?? new Set();
    handlers.add(handler);
    this.handlers.set(name, handlers);
    return () => handlers.delete(handler);
  }
}
