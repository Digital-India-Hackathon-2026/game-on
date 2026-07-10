import type { AIConversationMessage, AIRequest, AIResponse } from "./AITypes";
import { createId, nowIso } from "./AIUtilities";
import { AIMemoryManager } from "./AIMemoryManager";

export class AIConversationManager {
  constructor(private readonly memoryManager: AIMemoryManager) {}

  async recordTurn(request: AIRequest, response: AIResponse): Promise<void> {
    const messages: AIConversationMessage[] = [
      {
        id: createId("msg"),
        role: "user",
        content: request.input,
        timestamp: nowIso()
      },
      {
        id: createId("msg"),
        role: "assistant",
        content: response.formatted.content,
        timestamp: nowIso(),
        metadata: { requestId: response.requestId, task: response.task }
      }
    ];
    await this.memoryManager.appendConversation(request, messages);
  }
}
