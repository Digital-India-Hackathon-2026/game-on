import type { AIPromptProvider } from "./AIInterfaces";
import type { AITaskType, PromptTemplate } from "./AITypes";
import { AIEngineError } from "./AIErrorHandler";
import { defaultPromptTemplates } from "./PromptTemplates";

export class PromptRegistry implements AIPromptProvider {
  private readonly prompts = new Map<string, PromptTemplate>();

  constructor(templates: PromptTemplate[] = defaultPromptTemplates) {
    for (const template of templates) this.register(template);
  }

  register(template: PromptTemplate): void {
    if (!template.key || !template.version || template.status === "disabled") {
      throw new AIEngineError("invalid_prompt", "Prompt template is invalid.", 500, { key: template.key });
    }
    this.prompts.set(this.registryKey(template.key, template.locale), template);
  }

  get(key: string, locale = "en"): PromptTemplate {
    const prompt = this.prompts.get(this.registryKey(key, locale)) ?? this.prompts.get(this.registryKey(key, "en"));
    if (!prompt || prompt.status !== "active") {
      throw new AIEngineError("invalid_prompt", `Prompt ${key} is not available.`, 500);
    }
    return prompt;
  }

  getByTask(task: AITaskType, locale = "en"): PromptTemplate {
    const prompt = this.list().find((candidate) => candidate.task === task && candidate.locale === locale) ??
      this.list().find((candidate) => candidate.task === task && candidate.locale === "en");
    if (!prompt) throw new AIEngineError("invalid_prompt", `No active prompt registered for ${task}.`, 500);
    return prompt;
  }

  list(): PromptTemplate[] {
    return [...this.prompts.values()].filter((prompt) => prompt.status === "active");
  }

  private registryKey(key: string, locale: string): string {
    return `${key}:${locale}`;
  }
}
