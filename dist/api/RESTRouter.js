"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RESTRouter = void 0;
const APIControllers_1 = require("./APIControllers");
const APIError_1 = require("./APIError");
const APIRoutes_1 = require("./APIRoutes");
const APIMiddleware_1 = require("./APIMiddleware");
class RESTRouter {
    controllers;
    routes;
    constructor(controllers = new APIControllers_1.APIControllers(), routes = APIRoutes_1.apiRoutes) {
        this.controllers = controllers;
        this.routes = routes;
    }
    async dispatch(request) {
        return (0, APIMiddleware_1.errorHandler)(request, async () => {
            const route = this.routes.find((candidate) => candidate.method === request.method && this.matches(candidate.path, request.path));
            if (!route)
                throw new APIError_1.APIError("not_found", "Route not found.", 404);
            if (route.auth !== "public" && !request.headers.authorization)
                throw new APIError_1.APIError("unauthorized", "Authentication is required.", 401);
            const run = (0, APIMiddleware_1.composeMiddleware)([APIMiddleware_1.requestLogger, APIMiddleware_1.rateLimiter, APIMiddleware_1.authentication], () => this.controllers.handle(route.handlerName, request));
            return run(request);
        });
    }
    listRoutes() {
        return this.routes;
    }
    matches(template, path) {
        const pattern = new RegExp(`^${template.replace(/\{[^/]+\}/g, "[^/]+")}$`);
        return pattern.test(path);
    }
}
exports.RESTRouter = RESTRouter;
