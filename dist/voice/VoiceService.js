"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VoiceService = void 0;
const SpeechToText_1 = require("./SpeechToText");
const TextToSpeech_1 = require("./TextToSpeech");
const VoiceAdapter_1 = require("./VoiceAdapter");
const VoiceConfiguration_1 = require("./VoiceConfiguration");
const VoiceEvents_1 = require("./VoiceEvents");
const VoiceHistory_1 = require("./VoiceHistory");
const VoicePreferenceManager_1 = require("./VoicePreferenceManager");
const VoiceSessionManager_1 = require("./VoiceSessionManager");
class VoiceService {
    adapter;
    commands;
    events = new VoiceEvents_1.VoiceEvents();
    preferences = new VoicePreferenceManager_1.VoicePreferenceManager();
    sessions = new VoiceSessionManager_1.VoiceSessionManager();
    history = new VoiceHistory_1.VoiceHistory();
    tts;
    stt;
    constructor(adapter = new VoiceAdapter_1.MockVoiceAdapter(), commands = VoiceConfiguration_1.VoiceConfiguration.commands) {
        this.adapter = adapter;
        this.commands = commands;
        this.tts = new TextToSpeech_1.TextToSpeechModule(adapter);
        this.stt = new SpeechToText_1.SpeechToTextModule(adapter);
    }
    async readText(request) {
        this.events.emit("TextToSpeechRequested", { userId: request.userId, pageSessionId: request.pageSessionId });
        const session = await this.sessions.create({ userId: request.userId, pageSessionId: request.pageSessionId, mode: "tts", provider: this.adapter.name, inputText: request.text });
        const result = await this.tts.generate(request);
        this.history.record({ ...session, audioPath: result.audioPath, status: "ready" });
        this.events.emit("TextToSpeechCompleted", { sessionId: session.id });
        return { sessionId: session.id, ...result };
    }
    async transcribe(request) {
        this.events.emit("SpeechToTextRequested", { userId: request.userId });
        const result = await this.stt.transcribe(request);
        this.events.emit("SpeechToTextCompleted", { confidence: result.confidence });
        return result;
    }
    detectCommand(text) {
        const normalized = text.toLowerCase();
        const command = this.commands.find((candidate) => candidate.enabled && candidate.phrases.some((phrase) => normalized.includes(phrase)));
        if (command)
            this.events.emit("VoiceCommandDetected", { key: command.key });
        return command;
    }
}
exports.VoiceService = VoiceService;
