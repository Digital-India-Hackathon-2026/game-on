import type { AIServicePort } from "../ai/AIInterfaces";
import type { AIRequest } from "../ai/AITypes";
import type { VoiceAdapter } from "./VoiceAdapter";
import type {
  VoiceControlAction,
  VoiceControlAuditRecord,
  VoiceControlGrounding,
  VoiceControlRequest,
  VoiceControlResult
} from "./VoiceControlTypes";

const CONFIDENCE_HIGH = 0.85;
const CONFIDENCE_MEDIUM = 0.58;
const MAX_COMMANDS_PER_MINUTE = 18;

export class VoiceControlService {
  private readonly commandTimesBySession = new Map<string, number[]>();
  private readonly auditLog: VoiceControlAuditRecord[] = [];
  private readonly conversationHistoryBySession = new Map<string, Array<{ command: string; action: string; status: string }>>();

  constructor(
    private readonly voiceAdapter: VoiceAdapter,
    private readonly aiService: AIServicePort,
    private readonly now: () => number = () => Date.now()
  ) {}

  async handleCommand(request: VoiceControlRequest): Promise<VoiceControlResult> {
    const sessionKey = request.pageSessionId ?? request.userId ?? "anonymous";
    const languageHint = request.preferredLanguage || "auto";
    const auditId = `vca_${this.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

    if (!this.allowCommand(sessionKey)) {
      const action = this.unknownAction("Voice command rate limit exceeded.", languageHint);
      return this.result("rate_limited", request, action, undefined, "Please pause for a moment before giving another voice command.", auditId);
    }

    const history = this.conversationHistoryBySession.get(sessionKey) ?? [];
    const transcription = await this.voiceAdapter.transcribe({
      audio: request.audio,
      language: request.preferredLanguage,
      autoDetectLanguage: true,
      userId: request.userId
    });
    const languageCode = transcription.languageCode || request.preferredLanguage || "und";
    const intent = await this.parseIntent(transcription.transcript, languageCode, request, history);

    if (intent.action === "unknown" || intent.confidence < CONFIDENCE_MEDIUM) {
      const spokenText = await this.confirm(intent, "needs_clarification", languageCode, request);
      return this.result("needs_clarification", request, intent, undefined, spokenText, auditId, transcription.transcript, languageCode);
    }

    const actionsToProcess = intent.actions || [{
      action: intent.action,
      targetDescription: intent.targetDescription,
      value: intent.value,
      confidence: intent.confidence
    }];

    if (intent.needsClarification || actionsToProcess.some(a => a.confidence < CONFIDENCE_MEDIUM || a.action === "unknown")) {
      const clarified = { ...intent, clarifyingQuestion: intent.clarifyingQuestion ?? "I didn't understand that command. Could you please clarify?" };
      const spokenText = await this.confirm(clarified, "needs_clarification", languageCode, request);
      return this.result("needs_clarification", request, clarified, undefined, spokenText, auditId, transcription.transcript, languageCode);
    }

    let finalGrounding: VoiceControlGrounding | undefined;
    for (const step of actionsToProcess) {
      const stepAction: VoiceControlAction = {
        action: step.action,
        targetDescription: step.targetDescription,
        value: step.value,
        confidence: step.confidence
      };

      const grounding = await this.ground(stepAction, request);
      finalGrounding = grounding;

      if (!grounding.elementId || grounding.confidence < CONFIDENCE_MEDIUM) {
        const clarified = { ...stepAction, clarifyingQuestion: grounding.clarifyingQuestion ?? "I could not find the control you mentioned." };
        const spokenText = await this.confirm(clarified, "needs_clarification", languageCode, request);
        return this.result("needs_clarification", request, clarified, grounding, spokenText, auditId, transcription.transcript, languageCode);
      }

      if (grounding.requiresConfirmation) {
        const spokenText = await this.confirm(stepAction, "needs_confirmation", languageCode, request);
        return this.result("needs_confirmation", request, stepAction, grounding, spokenText, auditId, transcription.transcript, languageCode);
      }
    }

    const lastStep = actionsToProcess[actionsToProcess.length - 1];
    const lastStepAction: VoiceControlAction = {
      action: lastStep.action,
      targetDescription: lastStep.targetDescription,
      value: lastStep.value,
      confidence: lastStep.confidence
    };

    if (lastStep.confidence >= CONFIDENCE_HIGH) {
      const spokenText = await this.confirm(lastStepAction, "executed", languageCode, request);
      return this.result("executed", request, intent, finalGrounding, spokenText, auditId, transcription.transcript, languageCode);
    } else {
      const spokenText = `I understood you want to ${lastStep.action} the ${lastStep.targetDescription}. Doing that now.`;
      return this.result("executed", request, intent, finalGrounding, spokenText, auditId, transcription.transcript, languageCode);
    }
  }

  listAudit(filter: { userId?: string; pageSessionId?: string; limit?: number } = {}): VoiceControlAuditRecord[] {
    return this.auditLog
      .filter((record) => !filter.userId || record.userId === filter.userId)
      .filter((record) => !filter.pageSessionId || record.pageSessionId === filter.pageSessionId)
      .slice(-(filter.limit ?? 50));
  }

  private async parseIntent(
    transcript: string,
    languageCode: string,
    request: VoiceControlRequest,
    history: Array<{ command: string; action: string; status: string }>
  ): Promise<VoiceControlAction> {
    const response = await this.runVoicePrompt("voice_control.intent", {
      transcript,
      detectedLanguage: languageCode,
      preferredLanguage: request.preferredLanguage,
      shortTermMemory: history
    }, request);
    return this.parseJson<VoiceControlAction>(response.formatted.content, this.unknownAction("I did not understand the command.", languageCode));
  }

  private async ground(action: VoiceControlAction, request: VoiceControlRequest): Promise<VoiceControlGrounding> {
    const response = await this.runVoicePrompt("voice_control.grounding", {
      intent: action,
      elementManifest: request.elementManifest
    }, request);
    return this.parseJson<VoiceControlGrounding>(response.formatted.content, {
      elementId: null,
      confidence: 0,
      requiresConfirmation: false,
      reason: "No confident element match."
    });
  }

  private async confirm(
    action: VoiceControlAction,
    outcome: VoiceControlResult["status"],
    languageCode: string,
    request: VoiceControlRequest
  ): Promise<string> {
    const response = await this.runVoicePrompt("voice_control.confirmation", { action, outcome, language: languageCode }, request);
    const parsed = this.parseJson<{ spokenText: string }>(response.formatted.content, { spokenText: action.clarifyingQuestion ?? "Done." });
    return this.sanitizeSpokenText(parsed.spokenText);
  }

  private runVoicePrompt(promptKey: string, payload: unknown, request: VoiceControlRequest) {
    const aiRequest: AIRequest = {
      task: "voice_control",
      promptKey,
      input: JSON.stringify(payload),
      outputFormat: "json",
      userId: request.userId,
      pageSessionId: request.pageSessionId,
      language: request.preferredLanguage,
      preferences: { language: request.preferredLanguage }
    };
    return this.aiService.run(aiRequest);
  }

  private allowCommand(sessionKey: string): boolean {
    const windowStart = this.now() - 60_000;
    const recent = (this.commandTimesBySession.get(sessionKey) ?? []).filter((timestamp) => timestamp >= windowStart);
    if (recent.length >= MAX_COMMANDS_PER_MINUTE) {
      this.commandTimesBySession.set(sessionKey, recent);
      return false;
    }
    recent.push(this.now());
    this.commandTimesBySession.set(sessionKey, recent);
    return true;
  }

  private result(
    status: VoiceControlResult["status"],
    request: VoiceControlRequest,
    action: VoiceControlAction,
    grounding: VoiceControlGrounding | undefined,
    spokenText: string,
    auditId: string,
    transcript?: string,
    languageCode = request.preferredLanguage ?? "und"
  ): VoiceControlResult {
    const sessionKey = request.pageSessionId ?? request.userId ?? "anonymous";
    const currentHistory = this.conversationHistoryBySession.get(sessionKey) ?? [];
    currentHistory.push({
      command: transcript || "",
      action: action.action,
      status
    });
    if (currentHistory.length > 5) {
      currentHistory.shift();
    }
    this.conversationHistoryBySession.set(sessionKey, currentHistory);

    this.auditLog.push({
      id: auditId,
      userId: request.userId,
      pageSessionId: request.pageSessionId,
      action: action.action,
      targetDescription: action.targetDescription,
      elementId: grounding?.elementId,
      status,
      languageCode,
      timestamp: new Date(this.now()).toISOString()
    });
    return { status, transcript, languageCode, action, grounding, spokenText: this.sanitizeSpokenText(spokenText), auditId };
  }

  private unknownAction(clarifyingQuestion: string, languageCode: string): VoiceControlAction {
    return { action: "unknown", targetDescription: "", confidence: 0, clarifyingQuestion: this.sanitizeSpokenText(clarifyingQuestion || languageCode) };
  }

  private parseJson<T>(text: string, fallback: T): T {
    try {
      const start = text.indexOf("{");
      const end = text.lastIndexOf("}");
      const json = start >= 0 && end >= start ? text.slice(start, end + 1) : text;
      return JSON.parse(json) as T;
    } catch {
      return fallback;
    }
  }

  private sanitizeSpokenText(text: string): string {
    return text.replace(/[<>`{}]/g, "").replace(/\s+/g, " ").trim().slice(0, 280);
  }
}
