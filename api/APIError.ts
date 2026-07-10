import type { ErrorEnvelope } from "./APIModels";

export class APIError extends Error {
  constructor(readonly code: string, message: string, readonly status = 400, readonly details: Record<string, unknown> = {}) {
    super(message);
  }

  toEnvelope(requestId: string): ErrorEnvelope {
    return {
      error: {
        code: this.code,
        message: this.message,
        details: this.details,
        request_id: requestId,
        docs_url: `https://docs.saralo.example/errors/${this.code}`
      }
    };
  }
}
