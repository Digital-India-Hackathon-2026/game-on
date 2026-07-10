import { AccessibilityService } from "../accessibility";
import { AIService } from "../ai";
import { SecurityService } from "../security";
import { VoiceService } from "../voice";
import { ADHDControllers } from "../adhd/ADHDControllers";
import { LowVisionControllers } from "../lowvision/LowVisionControllers";
import { AstigmatismControllers } from "../astigmatism/AstigmatismControllers";
import type { APIRequest, APIResponse, PageSessionCreateRequest } from "./APIModels";
import { createAccepted } from "./APIUtilities";

export class APIControllers {
  constructor(
    private readonly accessibility = new AccessibilityService(),
    private readonly ai = new AIService({ config: { defaultProvider: "mock" } }),
    private readonly voice = new VoiceService(),
    private readonly security = new SecurityService(),
    private readonly adhd = new ADHDControllers(),
    private readonly lowvision = new LowVisionControllers(),
    private readonly astigmatism = new AstigmatismControllers()
  ) {}

  async handle(name: string, request: APIRequest): Promise<APIResponse> {
    // ADHD handlers are isolated behind the "adhd" prefix — delegate to ADHDControllers
    if (name.startsWith("adhd")) {
      return this.adhd.handle(name, request);
    }

    // Low Vision handlers are isolated behind the "lowvision" prefix — delegate to LowVisionControllers
    if (name.startsWith("lowvision")) {
      return this.lowvision.handle(name, request);
    }

    if (name.startsWith("astigmatism")) {
      return this.astigmatism.handle(name, request);
    }

    const table: Record<string, () => Promise<APIResponse>> = {
      health: async () => ({ status: 200, body: { status: "ok", api_version: "v1", timestamp: new Date().toISOString() } }),
      capabilities: async () => ({ status: 200, body: { profiles: this.accessibility.registry.list().map((plugin) => plugin.manifest.profileKey), features: ["url_sessions", "ai_chat", "tts", "uploads"], voice_providers: ["mock"], max_upload_bytes: 10485760 } }),
      accessibilityProfiles: async () => ({ status: 200, body: this.accessibility.registry.list().map((plugin) => plugin.manifest) }),
      createPageSession: async () => {
        const body = request.body as PageSessionCreateRequest;
        const scan = await this.security.scan({ url: body.url });
        return { status: 202, body: { ...createAccepted("session_mock", "page-sessions"), security: scan } };
      },
      securityAnalyzeUrl: async () => ({ status: 200, body: await this.security.scan({ url: (request.body as { url: string }).url }) }),
      securityHistory: async () => ({ status: 200, body: await this.security.history.list() }),
      securityDashboard: async () => ({ status: 200, body: { scans: (await this.security.history.list()).length } }),
      aiSummarize: async () => ({ status: 200, body: await this.ai.summarize({ input: "Summarize this page", provider: "mock" }) }),
      aiSimplify: async () => ({ status: 200, body: await this.ai.simplify({ input: "Simplify this section", provider: "mock" }) }),
      aiChat: async () => ({ status: 200, body: await this.ai.ask({ input: String((request.body as { message?: string }).message ?? ""), provider: "mock" }) }),
      translate: async () => ({ status: 200, body: await this.ai.translate({ input: "Translate this content", provider: "mock" }) }),
      voicePreferences: async () => ({ status: 200, body: await this.voice.preferences.get(request.user?.id) }),
      updateVoicePreferences: async () => ({ status: 200, body: request.body ?? {} }),
      tts: async () => ({ status: 202, body: await this.voice.readText({ text: "Read aloud", preferences: await this.voice.preferences.get(request.user?.id), userId: request.user?.id }) }),
      voiceCommand: async () => ({ status: 200, body: this.voice.detectCommand(String((request.body as { command?: string }).command ?? "")) ?? null })
    };
    return table[name]?.() ?? { status: 200, body: { ok: true, handler: name } };
  }
}
