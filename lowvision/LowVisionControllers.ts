// ---------------------------------------------------------------------------
// Low Vision Mode — Controllers
// ---------------------------------------------------------------------------

import type { APIRequest, APIResponse } from "../api/APIModels";
import { LowVisionService, LowVisionInputError, LowVisionRateLimitError } from "./LowVisionService";
import type {
  AltTextRequest,
  LowVisionPreferencesUpdate,
  ReadAloudTextRequest,
} from "./LowVisionTypes";

export class LowVisionControllers {
  private readonly service = new LowVisionService();

  async handle(name: string, request: APIRequest): Promise<APIResponse> {
    try {
      const table: Record<string, () => Promise<APIResponse>> = {
        // ---- Health ----
        lowvisionHealth: async () => ({
          status: 200,
          body: this.service.health(),
        }),

        // ---- Display Config ----
        lowvisionDisplayConfig: async () => ({
          status: 200,
          body: this.service.getDisplayConfig(),
        }),

        // ---- Alt Text ----
        lowvisionAltText: async () => {
          const body = request.body as AltTextRequest;
          const result = await this.service.generateAltText(body);
          return { status: 200, body: result };
        },

        // ---- Preferences (GET) ----
        lowvisionGetPreferences: async () => {
          const userId = request.user?.id ?? "anonymous";
          const result = await this.service.getPreferences(userId);
          return { status: 200, body: result };
        },

        // ---- Preferences (POST/UPDATE) ----
        lowvisionUpdatePreferences: async () => {
          const userId = request.user?.id ?? "anonymous";
          const body = request.body as LowVisionPreferencesUpdate;
          const result = await this.service.updatePreferences(userId, body);
          return { status: 200, body: result };
        },

        // ---- Read Aloud Text ----
        lowvisionReadAloudText: async () => {
          const body = request.body as ReadAloudTextRequest;
          const result = await this.service.cleanTextForReadAloud(body);
          return { status: 200, body: result };
        },
      };

      return (table[name]?.() ?? { status: 404, body: { error: "not_found", message: `Handler ${name} not found.` } });
    } catch (err) {
      return this.handleError(err, request.requestId);
    }
  }

  private handleError(err: unknown, requestId: string): APIResponse {
    if (err instanceof LowVisionInputError) {
      return {
        status: err.statusCode,
        body: {
          error: {
            code: err.code,
            message: err.message,
            request_id: requestId,
          },
        },
      };
    }
    if (err instanceof LowVisionRateLimitError) {
      return {
        status: err.statusCode,
        body: {
          error: {
            code: err.code,
            message: err.message,
            request_id: requestId,
          },
        },
      };
    }
    // Generic error
    console.error(`[LowVision] Unhandled error: ${err instanceof Error ? err.message : String(err)}`);
    return {
      status: 500,
      body: {
        error: {
          code: "lowvision_internal_error",
          message: "An unexpected error occurred.",
          request_id: requestId,
        },
      },
    };
  }
}