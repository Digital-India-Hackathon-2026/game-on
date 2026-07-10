"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ADHDControllers = void 0;
const ADHDService_1 = require("./ADHDService");
class ADHDControllers {
    service = new ADHDService_1.ADHDService();
    async handle(name, request) {
        try {
            const table = {
                // ---- Health ----
                adhdHealth: async () => ({
                    status: 200,
                    body: this.service.health(),
                }),
                // ---- Read Time ----
                adhdReadTime: async () => {
                    const body = request.body;
                    const result = await this.service.estimateReadTime(body);
                    return { status: 200, body: result };
                },
                // ---- Summary ----
                adhdSummary: async () => {
                    const body = request.body;
                    const result = await this.service.generateSummary(body);
                    return { status: 200, body: result };
                },
                // ---- Chunk ----
                adhdChunk: async () => {
                    const body = request.body;
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
                    const body = request.body;
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
                    const url = request.query.url;
                    const result = await this.service.getReadingProgress(userId, url);
                    return { status: 200, body: result ?? { error: "not_found" } };
                },
                adhdSaveReadingProgress: async () => {
                    const userId = request.user?.id ?? "anonymous";
                    const body = request.body;
                    const result = await this.service.saveReadingProgress(userId, body);
                    return { status: 200, body: result };
                },
            };
            return (table[name]?.() ?? { status: 404, body: { error: "not_found", message: `Handler ${name} not found.` } });
        }
        catch (err) {
            return this.handleError(err, request.requestId);
        }
    }
    handleError(err, requestId) {
        if (err instanceof ADHDService_1.ADHDInputError) {
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
        if (err instanceof ADHDService_1.ADHDRateLimitError) {
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
exports.ADHDControllers = ADHDControllers;
