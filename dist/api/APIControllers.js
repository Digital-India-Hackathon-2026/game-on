"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.APIControllers = void 0;
const accessibility_1 = require("../accessibility");
const ai_1 = require("../ai");
const security_1 = require("../security");
const voice_1 = require("../voice");
const ADHDControllers_1 = require("../adhd/ADHDControllers");
const LowVisionControllers_1 = require("../lowvision/LowVisionControllers");
const AstigmatismControllers_1 = require("../astigmatism/AstigmatismControllers");
const APIUtilities_1 = require("./APIUtilities");
class APIControllers {
    accessibility;
    ai;
    voice;
    security;
    adhd;
    lowvision;
    astigmatism;
    constructor(accessibility = new accessibility_1.AccessibilityService(), ai = new ai_1.AIService({ config: { defaultProvider: "mock" } }), voice = new voice_1.VoiceService(), security = new security_1.SecurityService(), adhd = new ADHDControllers_1.ADHDControllers(), lowvision = new LowVisionControllers_1.LowVisionControllers(), astigmatism = new AstigmatismControllers_1.AstigmatismControllers()) {
        this.accessibility = accessibility;
        this.ai = ai;
        this.voice = voice;
        this.security = security;
        this.adhd = adhd;
        this.lowvision = lowvision;
        this.astigmatism = astigmatism;
    }
    async handle(name, request) {
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
        const table = {
            health: async () => ({ status: 200, body: { status: "ok", api_version: "v1", timestamp: new Date().toISOString() } }),
            capabilities: async () => ({ status: 200, body: { profiles: this.accessibility.registry.list().map((plugin) => plugin.manifest.profileKey), features: ["url_sessions", "ai_chat", "tts", "uploads"], voice_providers: ["mock"], max_upload_bytes: 10485760 } }),
            accessibilityProfiles: async () => ({ status: 200, body: this.accessibility.registry.list().map((plugin) => plugin.manifest) }),
            createPageSession: async () => {
                const body = request.body;
                const scan = await this.security.scan({ url: body.url });
                return { status: 202, body: { ...(0, APIUtilities_1.createAccepted)("session_mock", "page-sessions"), security: scan } };
            },
            securityAnalyzeUrl: async () => ({ status: 200, body: await this.security.scan({ url: request.body.url }) }),
            securityHistory: async () => ({ status: 200, body: await this.security.history.list() }),
            securityDashboard: async () => ({ status: 200, body: { scans: (await this.security.history.list()).length } }),
            aiSummarize: async () => ({ status: 200, body: await this.ai.summarize({ input: "Summarize this page", provider: "mock" }) }),
            aiSimplify: async () => ({ status: 200, body: await this.ai.simplify({ input: "Simplify this section", provider: "mock" }) }),
            aiChat: async () => ({ status: 200, body: await this.ai.ask({ input: String(request.body.message ?? ""), provider: "mock" }) }),
            translate: async () => ({ status: 200, body: await this.ai.translate({ input: "Translate this content", provider: "mock" }) }),
            voicePreferences: async () => ({ status: 200, body: await this.voice.preferences.get(request.user?.id) }),
            updateVoicePreferences: async () => ({ status: 200, body: request.body ?? {} }),
            tts: async () => ({ status: 202, body: await this.voice.readText({ text: "Read aloud", preferences: await this.voice.preferences.get(request.user?.id), userId: request.user?.id }) }),
            voiceCommand: async () => ({ status: 200, body: this.voice.detectCommand(String(request.body.command ?? "")) ?? null })
        };
        return table[name]?.() ?? { status: 200, body: { ok: true, handler: name } };
    }
}
exports.APIControllers = APIControllers;
