"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIRequestValidator = void 0;
const AIErrorHandler_1 = require("./AIErrorHandler");
const AIUtilities_1 = require("./AIUtilities");
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
class AIRequestValidator {
    validate(request) {
        if (!supportedTasks.has(request.task)) {
            throw new AIErrorHandler_1.AIEngineError("validation_failed", "Unsupported AI task.", 400, { task: request.task });
        }
        if (!request.input || request.input.trim().length === 0) {
            throw new AIErrorHandler_1.AIEngineError("validation_failed", "AI input cannot be empty.", 400);
        }
        if (request.input.length > 20000 || (0, AIUtilities_1.estimateTokens)(request.input) > 5000) {
            throw new AIErrorHandler_1.AIEngineError("token_limit", "AI input is too large.", 413);
        }
        if (request.language && !/^[a-z]{2,3}(-[A-Z]{2})?$/.test(request.language)) {
            throw new AIErrorHandler_1.AIEngineError("validation_failed", "Language must be a supported BCP 47 style tag.", 400);
        }
    }
}
exports.AIRequestValidator = AIRequestValidator;
