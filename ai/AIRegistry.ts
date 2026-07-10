import type { AIProviderAdapter, AIModule } from "./AIInterfaces";
import type { AIProviderName, AITaskType } from "./AITypes";
import { AIEngineError } from "./AIErrorHandler";

export class AIRegistry {
  private readonly providers = new Map<AIProviderName, AIProviderAdapter>();
  private readonly modules = new Map<AITaskType, AIModule>();

  registerProvider(provider: AIProviderAdapter): void {
    this.providers.set(provider.name, provider);
  }

  getProvider(name: AIProviderName): AIProviderAdapter {
    const provider = this.providers.get(name);
    if (!provider) throw new AIEngineError("configuration_error", `AI provider ${name} is not registered.`, 500);
    return provider;
  }

  registerModule(module: AIModule): void {
    this.modules.set(module.task, module);
  }

  getModule(task: AITaskType): AIModule {
    const module = this.modules.get(task);
    if (!module) throw new AIEngineError("configuration_error", `AI module ${task} is not registered.`, 500);
    return module;
  }

  listProviders(): AIProviderName[] {
    return [...this.providers.keys()];
  }

  listModules(): AITaskType[] {
    return [...this.modules.keys()];
  }
}
