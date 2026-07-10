import type { APIRequest, APIResponse } from "../api/APIModels";
import { AstigmatismFetchError, AstigmatismInputError, AstigmatismService } from "./AstigmatismService";
import type { AstigmatismToggleRequest, AstigmatismTransformRequest } from "./AstigmatismTypes";

export class AstigmatismControllers {
  private readonly service = new AstigmatismService();

  async handle(name: string, request: APIRequest): Promise<APIResponse> {
    try {
      const table: Record<string, () => Promise<APIResponse>> = {
        astigmatismHealth: async () => ({ status: 200, body: this.service.health() }),
        astigmatismConfig: async () => ({ status: 200, body: this.service.getConfig() }),
        astigmatismGetToggle: async () => ({
          status: 200,
          body: this.service.getToggleState(request.user?.id ?? "anonymous"),
        }),
        astigmatismUpdateToggle: async () => ({
          status: 200,
          body: this.service.updateToggleState(request.user?.id ?? "anonymous", request.body as AstigmatismToggleRequest),
        }),
        astigmatismTransform: async () => {
          const result = await this.service.transformUrl(request.body as AstigmatismTransformRequest);
          return {
            status: 200,
            headers: { "Content-Type": "text/html; charset=utf-8" },
            body: result.html,
          };
        },
        astigmatismTransformJson: async () => ({
          status: 200,
          body: await this.service.transformUrl(request.body as AstigmatismTransformRequest),
        }),
        astigmatismPreview: async () => {
          const result = await this.service.previewUrl(request.body as AstigmatismTransformRequest);
          return {
            status: 200,
            headers: { "Content-Type": "text/html; charset=utf-8" },
            body: result.html,
          };
        },
        astigmatismPreviewJson: async () => ({
          status: 200,
          body: await this.service.previewUrl(request.body as AstigmatismTransformRequest),
        }),
      };

      return table[name]?.() ?? {
        status: 404,
        body: { error: "not_found", message: `Handler ${name} not found.` },
      };
    } catch (error) {
      return this.handleError(error, request.requestId);
    }
  }

  private handleError(error: unknown, requestId: string): APIResponse {
    if (error instanceof AstigmatismInputError || error instanceof AstigmatismFetchError) {
      return {
        status: error.statusCode,
        body: {
          error: {
            code: error.code,
            message: error.message,
            request_id: requestId,
          },
        },
      };
    }
    console.error(`[Astigmatism] Unhandled error: ${error instanceof Error ? error.message : String(error)}`);
    return {
      status: 500,
      body: {
        error: {
          code: "astigmatism_internal_error",
          message: "An unexpected error occurred.",
          request_id: requestId,
        },
      },
    };
  }
}
