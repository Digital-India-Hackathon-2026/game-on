import { SpeechToTextModule } from "./SpeechToText";
import { TextToSpeechModule } from "./TextToSpeech";
import { MockVoiceAdapter, type VoiceAdapter } from "./VoiceAdapter";
import { VoiceConfiguration } from "./VoiceConfiguration";
import { VoiceEvents } from "./VoiceEvents";
import { VoiceHistory } from "./VoiceHistory";
import { VoicePreferenceManager } from "./VoicePreferenceManager";
import { VoiceSessionManager } from "./VoiceSessionManager";
import type { SpeechToTextRequest, TextToSpeechRequest, VoiceCommand } from "./VoiceTypes";

export class VoiceService {
  readonly events = new VoiceEvents();
  readonly preferences = new VoicePreferenceManager();
  readonly sessions = new VoiceSessionManager();
  readonly history = new VoiceHistory();
  readonly tts: TextToSpeechModule;
  readonly stt: SpeechToTextModule;

  constructor(private readonly adapter: VoiceAdapter = new MockVoiceAdapter(), private readonly commands: VoiceCommand[] = VoiceConfiguration.commands) {
    this.tts = new TextToSpeechModule(adapter);
    this.stt = new SpeechToTextModule(adapter);
  }

  async readText(request: TextToSpeechRequest) {
    this.events.emit("TextToSpeechRequested", { userId: request.userId, pageSessionId: request.pageSessionId });
    const session = await this.sessions.create({ userId: request.userId, pageSessionId: request.pageSessionId, mode: "tts", provider: this.adapter.name, inputText: request.text });
    const result = await this.tts.generate(request);
    this.history.record({ ...session, audioPath: result.audioPath, status: "ready" });
    this.events.emit("TextToSpeechCompleted", { sessionId: session.id });
    return { sessionId: session.id, ...result };
  }

  async transcribe(request: SpeechToTextRequest) {
    this.events.emit("SpeechToTextRequested", { userId: request.userId });
    const result = await this.stt.transcribe(request);
    this.events.emit("SpeechToTextCompleted", { confidence: result.confidence });
    return result;
  }

  detectCommand(text: string): VoiceCommand | undefined {
    const normalized = text.toLowerCase();
    const command = this.commands.find((candidate) => candidate.enabled && candidate.phrases.some((phrase) => normalized.includes(phrase)));
    if (command) this.events.emit("VoiceCommandDetected", { key: command.key });
    return command;
  }
}
