export interface ApiClientConfig { baseUrl: string; getToken?: () => string | undefined }
export class ApiClient {
  constructor(private readonly config: ApiClientConfig) {}
  async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const token = this.config.getToken?.();
    const response = await fetch(`${this.config.baseUrl}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...init.headers }
    });
    if (!response.ok) throw new Error(`API request failed: ${response.status}`);
    return response.json() as Promise<T>;
  }
}
export const apiClient = new ApiClient({ baseUrl: "/v1" });
