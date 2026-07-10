import type { AIProviderAdapter } from "../AIInterfaces";
import type { AIProviderRequest, AIProviderResponse } from "../AITypes";
import { AIEngineError } from "../AIErrorHandler";
import { estimateTokens } from "../AIUtilities";

export interface GeminiAdapterOptions {
  apiKey?: string;
  endpoint?: string;
  fetcher?: typeof fetch;
}

export class GeminiAIProviderAdapter implements AIProviderAdapter {
  readonly name = "gemini" as const;
  private readonly endpoint: string;
  private readonly fetcher: typeof fetch;

  constructor(private readonly options: GeminiAdapterOptions = {}) {
    this.endpoint = options.endpoint ?? "https://generativelanguage.googleapis.com/v1beta";
    this.fetcher = options.fetcher ?? fetch;
  }

  async complete(request: AIProviderRequest): Promise<AIProviderResponse> {
    if (!this.options.apiKey) {
      throw new AIEngineError("configuration_error", "Gemini API key is not configured.", 500);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), request.timeoutMs);
    try {
      const response = await this.fetcher(
        `${this.endpoint}/models/${encodeURIComponent(request.model)}:generateContent?key=${encodeURIComponent(this.options.apiKey)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            contents: request.messages.map((message) => ({
              role: message.role === "assistant" ? "model" : "user",
              parts: [{ text: `${message.role.toUpperCase()}: ${message.content}` }]
            })),
            generationConfig: {
              temperature: request.temperature,
              maxOutputTokens: request.maxTokens
            }
          })
        }
      );

      if (!response.ok) {
        throw new AIEngineError("provider_failure", `Gemini returned ${response.status}.`, 502);
      }

      const data = (await response.json()) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
        usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number; totalTokenCount?: number };
      };
      const text = data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("").trim();
      if (!text) throw new AIEngineError("empty_response", "Gemini returned an empty response.", 502);

      return {
        text,
        model: request.model,
        provider: this.name,
        tokenUsage: {
          inputTokens: data.usageMetadata?.promptTokenCount ?? estimateTokens(request.messages.map((m) => m.content).join("\n")),
          outputTokens: data.usageMetadata?.candidatesTokenCount ?? estimateTokens(text),
          totalTokens: data.usageMetadata?.totalTokenCount ?? estimateTokens(text)
        },
        raw: data
      };
    } finally {
      clearTimeout(timeout);
    }
  }
}
