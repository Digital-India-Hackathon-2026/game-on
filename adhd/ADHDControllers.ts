import type { APIRequest, APIResponse } from "../api/APIModels";
import { ADHDService, ADHDInputError, ADHDRateLimitError } from "./ADHDService";
import type {
  ADHDReadTimeRequest,
  ADHDSummaryRequest,
  ADHDChunkRequest,
  ADHDBookmarkCreateRequest,
  ADHDReadingProgressRequest,
} from "./ADHDTypes";

export class ADHDControllers {
  private readonly service = new ADHDService();

  async handle(name: string, request: APIRequest): Promise<APIResponse> {
    try {
      const table: Record<string, () => Promise<APIResponse>> = {
        // ---- Health ----
        adhdHealth: async () => ({
          status: 200,
          body: this.service.health(),
        }),

        // ---- Read Time ----
        adhdReadTime: async () => {
          const body = request.body as ADHDReadTimeRequest;
          const result = await this.service.estimateReadTime(body);
          return { status: 200, body: result };
        },

        // ---- Summary ----
        adhdSummary: async () => {
          const body = request.body as ADHDSummaryRequest;
          const result = await this.service.generateSummary(body);
          return { status: 200, body: result };
        },

        // ---- Chunk ----
        adhdChunk: async () => {
          const body = request.body as ADHDChunkRequest;
          const result = await this.service.chunkText(body);
          return { status: 200, body: result };
        },

        // ---- Declutter Config ----
        adhdDeclutterConfig: async () => ({
          status: 200,
          body: this.service.getDeclutterConfig(),
        }),

        // ---- Palette ----
        adhdPalette: async () => ({
          status: 200,
          body: this.service.getPalette(),
        }),

        // ---- Bookmarks ----
        adhdListBookmarks: async () => {
          const userId = request.user?.id ?? "anonymous";
          const result = await this.service.listBookmarks(userId);
          return { status: 200, body: result };
        },

        adhdCreateBookmark: async () => {
          const userId = request.user?.id ?? "anonymous";
          const body = request.body as ADHDBookmarkCreateRequest;
          const result = await this.service.createBookmark(userId, body);
          return { status: 201, body: result };
        },

        adhdDeleteBookmark: async () => {
          const userId = request.user?.id ?? "anonymous";
          const bookmarkId = request.params.bookmark_id;
          await this.service.deleteBookmark(userId, bookmarkId);
          return { status: 200, body: { ok: true } };
        },

        // ---- Reading Progress ----
        adhdGetReadingProgress: async () => {
          const userId = request.user?.id ?? "anonymous";
          const url = (request.query as Record<string, string>).url;
          const result = await this.service.getReadingProgress(userId, url);
          return { status: 200, body: result ?? { error: "not_found" } };
        },

        adhdSaveReadingProgress: async () => {
          const userId = request.user?.id ?? "anonymous";
          const body = request.body as ADHDReadingProgressRequest;
          const result = await this.service.saveReadingProgress(userId, body);
          return { status: 200, body: result };
        },
      };

      return (table[name]?.() ?? { status: 404, body: { error: "not_found", message: `Handler ${name} not found.` } });
    } catch (err) {
      return this.handleError(err, request.requestId);
    }
  }

  private handleError(err: unknown, requestId: string): APIResponse {
    if (err instanceof ADHDInputError) {
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
    if (err instanceof ADHDRateLimitError) {
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
    if (err instanceof Error && err.message === "Bookmark not found.") {
      return {
        status: 404,
        body: {
          error: {
            code: "adhd_not_found",
            message: err.message,
            request_id: requestId,
          },
        },
      };
    }
    // Generic error
    console.error(`[ADHD] Unhandled error: ${err instanceof Error ? err.message : String(err)}`);
    return {
      status: 500,
      body: {
        error: {
          code: "adhd_internal_error",
          message: "An unexpected error occurred.",
          request_id: requestId,
        },
      },
    };
  }
}