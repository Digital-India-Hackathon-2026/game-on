import type { AIRequest } from "./AITypes";
import { AIEngineError } from "./AIErrorHandler";
import { estimateTokens } from "./AIUtilities";

const supportedTasks = new Set([
  "simplify",
  "summarize",
  "explain",
  "rewrite",
  "translate",
  "reading_guide",
  "visual_explain",
  "form_assistant",
  "checklist",
  "ask",
  "conversation",
  "accessibility_support",
  "website_explanation",
  "navigation_guidance",
  "security_explanation",
  "predict_next_step",
  "mistake_detection"
]);

export class AIRequestValidator {
  validate(request: AIRequest): void {
    if (!supportedTasks.has(request.task)) {
      throw new AIEngineError("validation_failed", "Unsupported AI task.", 400, { task: request.task });
    }
    if (!request.input || request.input.trim().length === 0) {
      throw new AIEngineError("validation_failed", "AI input cannot be empty.", 400);
    }
    if (request.input.length > 20000 || estimateTokens(request.input) > 5000) {
      throw new AIEngineError("token_limit", "AI input is too large.", 413);
    }
    if (request.language && !/^[a-z]{2,3}(-[A-Z]{2})?$/.test(request.language)) {
      throw new AIEngineError("validation_failed", "Language must be a supported BCP 47 style tag.", 400);
    }
  }
}
