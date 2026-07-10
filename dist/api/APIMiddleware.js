"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.rateLimiter = exports.authentication = exports.requestLogger = void 0;
exports.composeMiddleware = composeMiddleware;
const APIError_1 = require("./APIError");
function composeMiddleware(middleware, terminal) {
    return async (request) => {
        let index = -1;
        const dispatch = async (position) => {
            if (position <= index)
                throw new APIError_1.APIError("middleware_error", "Middleware called next more than once.", 500);
            index = position;
            const layer = middleware[position];
            return layer ? layer(request, () => dispatch(position + 1)) : terminal();
        };
        return dispatch(0);
    };
}
const requestLogger = async (request, next) => next();
exports.requestLogger = requestLogger;
const authentication = async (request, next) => {
    const auth = request.headers.authorization;
    if (auth?.startsWith("Bearer ")) {
        request.user = { id: "authenticated", role: "user", scopes: ["read", "write"] };
    }
    return next();
};
exports.authentication = authentication;
const rateLimiter = async (_request, next) => next();
exports.rateLimiter = rateLimiter;
const errorHandler = async (request, action) => {
    try {
        return await action();
    }
    catch (error) {
        const apiError = error instanceof APIError_1.APIError ? error : new APIError_1.APIError("internal_error", "Unexpected server error.", 500);
        return { status: apiError.status, body: apiError.toEnvelope(request.requestId) };
    }
};
exports.errorHandler = errorHandler;
