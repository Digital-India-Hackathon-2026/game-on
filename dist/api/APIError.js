"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.APIError = void 0;
class APIError extends Error {
    code;
    status;
    details;
    constructor(code, message, status = 400, details = {}) {
        super(message);
        this.code = code;
        this.status = status;
        this.details = details;
    }
    toEnvelope(requestId) {
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
exports.APIError = APIError;
