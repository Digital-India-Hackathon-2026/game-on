export type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE";

export interface APIRequest<TBody = unknown, TQuery = Record<string, string>, TParams = Record<string, string>> {
  method: HttpMethod;
  path: string;
  headers: Record<string, string | undefined>;
  body?: TBody;
  query: TQuery;
  params: TParams;
  user?: { id: string; role: string; scopes: string[] };
  requestId: string;
}

export interface APIResponse<T = unknown> {
  status: number;
  body: T;
  headers?: Record<string, string>;
}

export interface PaginationQuery {
  limit?: string;
  cursor?: string;
}

export interface PageSessionCreateRequest {
  source_type: "url";
  url: string;
  accessibility_profile_key?: string;
  options?: Record<string, unknown>;
}

export interface ErrorEnvelope {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
    request_id: string;
    docs_url?: string;
  };
}

export interface RouteDefinition {
  method: HttpMethod;
  path: string;
  summary: string;
  tags: string[];
  auth: "public" | "user" | "api_key";
  handlerName: string;
}
