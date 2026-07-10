"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AstigmatismControllers = void 0;
const AstigmatismService_1 = require("./AstigmatismService");
class AstigmatismControllers {
    service = new AstigmatismService_1.AstigmatismService();
    async handle(name, request) {
        try {
            const table = {
                astigmatismHealth: async () => ({ status: 200, body: this.service.health() }),
                astigmatismConfig: async () => ({ status: 200, body: this.service.getConfig() }),
                astigmatismGetToggle: async () => ({
                    status: 200,
                    body: this.service.getToggleState(request.user?.id ?? "anonymous"),
                }),
                astigmatismUpdateToggle: async () => ({
                    status: 200,
                    body: this.service.updateToggleState(request.user?.id ?? "anonymous", request.body),
                }),
                astigmatismTransform: async () => {
                    const result = await this.service.transformUrl(request.body);
                    return {
                        status: 200,
                        headers: { "Content-Type": "text/html; charset=utf-8" },
                        body: result.html,
                    };
                },
                astigmatismTransformJson: async () => ({
                    status: 200,
                    body: await this.service.transformUrl(request.body),
                }),
                astigmatismPreview: async () => {
                    const result = await this.service.previewUrl(request.body);
                    return {
                        status: 200,
                        headers: { "Content-Type": "text/html; charset=utf-8" },
                        body: result.html,
                    };
                },
                astigmatismPreviewJson: async () => ({
                    status: 200,
                    body: await this.service.previewUrl(request.body),
                }),
            };
            return table[name]?.() ?? {
                status: 404,
                body: { error: "not_found", message: `Handler ${name} not found.` },
            };
        }
        catch (error) {
            return this.handleError(error, request.requestId);
        }
    }
    handleError(error, requestId) {
        if (error instanceof AstigmatismService_1.AstigmatismInputError || error instanceof AstigmatismService_1.AstigmatismFetchError) {
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
exports.AstigmatismControllers = AstigmatismControllers;
