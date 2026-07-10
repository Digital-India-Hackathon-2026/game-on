import type { AIConfiguration } from "./AIConfiguration";
import type { AIContextProvider } from "./AIInterfaces";
import type { AIBuiltContext, AIRequest } from "./AITypes";
import { AIMemoryManager } from "./AIMemoryManager";
import { detectPromptInjection, estimateTokens, trimToTokenBudget } from "./AIUtilities";

export class AIContextBuilder implements AIContextProvider {
  constructor(private readonly config: AIConfiguration, private readonly memoryManager: AIMemoryManager) {}

  async build(request: AIRequest): Promise<AIBuiltContext> {
    const memory = await this.memoryManager.loadForRequest(request);
    const sections = request.webpage?.sections ?? [];
    const selectedSections = trimToTokenBudget(sections, this.config.contextTokenBudget);
    const sourceText = selectedSections.map((section) => `${section.heading ?? ""}\n${section.text}`).join("\n");
    const promptInjectionDetected = detectPromptInjection(`${sourceText}\n${request.input}`);
    const language =
      request.language ??
      request.preferences?.language ??
      request.voicePreferences?.language ??
      request.webpage?.language ??
      this.config.defaultLanguage;

    return {
      trustedInstructions: this.config.trustedInstructions,
      taskInstruction: request.promptKey ?? request.task,
      userInput: request.input,
      untrustedSections: selectedSections,
      security: {
        decision: request.webpage?.securityDecision ?? "unknown",
        warnings: request.webpage?.securityWarnings ?? [],
        promptInjectionDetected
      },
      preferences: request.preferences ?? {},
      voicePreferences: request.voicePreferences ?? {},
      conversation: memory.conversation,
      memory,
      language,
      currentTask: request.task,
      citationMap: Object.fromEntries(selectedSections.map((section) => [section.id, section.heading ?? section.id])),
      estimatedTokens: estimateTokens(sourceText) + estimateTokens(request.input)
    };
  }
}
