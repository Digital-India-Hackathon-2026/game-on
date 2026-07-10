"use strict";
// ---------------------------------------------------------------------------
// Low Vision Mode — Controllers
// ---------------------------------------------------------------------------
Object.defineProperty(exports, "__esModule", { value: true });
exports.LowVisionControllers = void 0;
const LowVisionService_1 = require("./LowVisionService");
class LowVisionControllers {
    service = new LowVisionService_1.LowVisionService();
    async handle(name, request) {
        try {
            const table = {
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
                    const body = request.body;
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
                    const body = request.body;
                    const result = await this.service.updatePreferences(userId, body);
                    return { status: 200, body: result };
                },
                // ---- Read Aloud Text ----
                lowvisionReadAloudText: async () => {
                    const body = request.body;
                    const result = await this.service.cleanTextForReadAloud(body);
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
        if (err instanceof LowVisionService_1.LowVisionInputError) {
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
        if (err instanceof LowVisionService_1.LowVisionRateLimitError) {
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
exports.LowVisionControllers = LowVisionControllers;
