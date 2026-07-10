import { apiClient } from "./apiClient";
export const saraloService = {
  capabilities: () => apiClient.request("/capabilities"),
  createPageSession: (url: string) => apiClient.request("/page-sessions", { method: "POST", body: JSON.stringify({ source_type: "url", url }) }),
  aiChat: (sessionId: string, message: string) => apiClient.request(`/page-sessions/${sessionId}/ai/chat`, { method: "POST", body: JSON.stringify({ message }) }),
  securityScan: (url: string) => apiClient.request("/security/analyze-url", { method: "POST", body: JSON.stringify({ url }) }),
  voicePreferences: () => apiClient.request("/voice/preferences"),
  bookmarks: () => apiClient.request("/bookmarks"),
  history: () => apiClient.request("/page-sessions")
};
