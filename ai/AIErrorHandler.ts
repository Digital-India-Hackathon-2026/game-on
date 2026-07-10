export type AIErrorCode =
  | "provider_failure"
  | "timeout"
  | "invalid_prompt"
  | "rate_limit"
  | "network_failure"
  | "empty_response"
  | "malformed_response"
  | "token_limit"
  | "validation_failed"
  | "configuration_error";

export class AIEngineError extends Error {
  readonly code: AIErrorCode;
  readonly statusCode: number;
  readonly details: Record<string, unknown>;

  constructor(code: AIErrorCode, message: string, statusCode = 500, details: Record<string, unknown> = {}) {
    super(message);
    this.name = "AIEngineError";
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export class AIErrorHandler {
  normalize(error: unknown): AIEngineError {
    if (error instanceof AIEngineError) return error;
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
