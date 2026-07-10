"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIErrorHandler = exports.AIEngineError = void 0;
class AIEngineError extends Error {
    code;
    statusCode;
    details;
    constructor(code, message, statusCode = 500, details = {}) {
        super(message);
        this.name = "AIEngineError";
        this.code = code;
        this.statusCode = statusCode;
        this.details = details;
    }
}
exports.AIEngineError = AIEngineError;
class AIErrorHandler {
    normalize(error) {
        if (error instanceof AIEngineError)
            return error;
        if (error instanceof Error && /timeout/i.test(error.message)) {
            return new AIEngineError("timeout", "The AI provider took too long to respond.", 503);
        }
        if (error instanceof Error && /rate/i.test(error.message)) {
            return new AIEngineError("rate_limit", "The AI provider rate limit was reached.", 429);
        }
        if (error instanceof Error && /network|fetch/i.test(error.message)) {
            return new AIEngineError("network_failure", "The AI provider network request failed.", 502);
        }
        return new AIEngineError("provider_failure", "The AI request failed.", 502, {
            originalMessage: error instanceof Error ? error.message : String(error)
        });
    }
}
exports.AIErrorHandler = AIErrorHandler;
