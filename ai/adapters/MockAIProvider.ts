import type { AIProviderAdapter } from "../AIInterfaces";
import type { AIProviderRequest, AIProviderResponse } from "../AITypes";
import { estimateTokens } from "../AIUtilities";

export class MockAIProvider implements AIProviderAdapter {
  readonly name = "mock" as const;

  constructor(private readonly responder: (request: AIProviderRequest) => string = MockAIProvider.defaultResponse) {}

  async complete(request: AIProviderRequest): Promise<AIProviderResponse> {
    const text = this.responder(request);
    return {
      text,
      model: request.model,
      provider: this.name,
      tokenUsage: {
        inputTokens: estimateTokens(request.messages.map((message) => message.content).join("\n")),
        outputTokens: estimateTokens(text),
        totalTokens: estimateTokens(request.messages.map((message) => message.content).join("\n")) + estimateTokens(text)
      }
    };
  }

  async health(): Promise<"healthy"> {
    return "healthy";
  }

  private static defaultResponse(request: AIProviderRequest): string {
    const taskLine = request.messages.find((message) => message.role === "user")?.content.match(/Task: ([^\n]+)/)?.[1] ?? "task";
    return [
      `Saralo ${taskLine} response.`,
      "- Key takeaway: This is grounded in the provided page context.",
      "- Action: Review the cited source section before taking sensitive action.",
      "Accessibility note: Kept short sentences and plain language.",
      "Citation: section_1"
    ].join("\n");
  }
}
