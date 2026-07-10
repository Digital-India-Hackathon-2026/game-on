import { APIControllers } from "./APIControllers";
import { APIError } from "./APIError";
import { apiRoutes } from "./APIRoutes";
import { authentication, composeMiddleware, errorHandler, rateLimiter, requestLogger } from "./APIMiddleware";
import type { APIRequest, APIResponse, RouteDefinition } from "./APIModels";

export class RESTRouter {
  constructor(private readonly controllers = new APIControllers(), private readonly routes: RouteDefinition[] = apiRoutes) {}

  async dispatch(request: APIRequest): Promise<APIResponse> {
    return errorHandler(request, async () => {
      const route = this.routes.find((candidate) => candidate.method === request.method && this.matches(candidate.path, request.path));
      if (!route) throw new APIError("not_found", "Route not found.", 404);
      if (route.auth !== "public" && !request.headers.authorization) throw new APIError("unauthorized", "Authentication is required.", 401);
      const run = composeMiddleware([requestLogger, rateLimiter, authentication], () => this.controllers.handle(route.handlerName, request));
      return run(request);
    });
  }

  listRoutes(): RouteDefinition[] {
    return this.routes;
  }

  private matches(template: string, path: string): boolean {
    const pattern = new RegExp(`^${template.replace(/\{[^/]+\}/g, "[^/]+")}$`);
    return pattern.test(path);
  }
}
