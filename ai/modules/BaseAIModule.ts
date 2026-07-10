import type { AIModule, AIServicePort } from "../AIInterfaces";
import type { AIRequest, AIResponse, AITaskType } from "../AITypes";

export class BaseAIModule implements AIModule {
  constructor(readonly task: AITaskType) {}

  execute(request: AIRequest, service: AIServicePort): Promise<AIResponse> {
    return service.run({ ...request, task: this.task });
  }
}
