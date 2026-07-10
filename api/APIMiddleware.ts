import type { APIRequest, APIResponse } from "./APIModels";
import { APIError } from "./APIError";

export type Middleware = (request: APIRequest, next: () => Promise<APIResponse>) => Promise<APIResponse>;

export function composeMiddleware(middleware: Middleware[], terminal: () => Promise<APIResponse>): (request: APIRequest) => Promise<APIResponse> {
  return async (request) => {
    let index = -1;
    const dispatch = async (position: number): Promise<APIResponse> => {
      if (position <= index) throw new APIError("middleware_error", "Middleware called next more than once.", 500);
      index = position;
      const layer = middleware[position];
      return layer ? layer(request, () => dispatch(position + 1)) : terminal();
    };
    return dispatch(0);
  };
}

export const requestLogger: Middleware = async (request, next) => next();

export const authentication: Middleware = async (request, next) => {
  const auth = request.headers.authorization;
  if (auth?.startsWith("Bearer ")) {
    request.user = { id: "authenticated", role: "user", scopes: ["read", "write"] };
  }
  return next();
};

export const rateLimiter: Middleware = async (_request, next) => next();

export const errorHandler = async (request: APIRequest, action: () => Promise<APIResponse>): Promise<APIResponse> => {
  try {
    return await action();
  } catch (error) {
    const apiError = error instanceof APIError ? error : new APIError("internal_error", "Unexpected server error.", 500);
    return { status: apiError.status, body: apiError.toEnvelope(request.requestId) };
  }
};
