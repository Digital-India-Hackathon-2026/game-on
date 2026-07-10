"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VoiceControlService = void 0;
const CONFIDENCE_HIGH = 0.85;
const CONFIDENCE_MEDIUM = 0.58;
const MAX_COMMANDS_PER_MINUTE = 18;
class VoiceControlService {
    voiceAdapter;
    aiService;
    now;
    commandTimesBySession = new Map();
    auditLog = [];
    conversationHistoryBySession = new Map();
    constructor(voiceAdapter, aiService, now = () => Date.now()) {
        this.voiceAdapter = voiceAdapter;
        this.aiService = aiService;
        this.now = now;
    }
    async handleCommand(request) {
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
        let finalGrounding;
        for (const step of actionsToProcess) {
            const stepAction = {
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
        const lastStepAction = {
            action: lastStep.action,
            targetDescription: lastStep.targetDescription,
            value: lastStep.value,
            confidence: lastStep.confidence
        };
        if (lastStep.confidence >= CONFIDENCE_HIGH) {
            const spokenText = await this.confirm(lastStepAction, "executed", languageCode, request);
            return this.result("executed", request, intent, finalGrounding, spokenText, auditId, transcription.transcript, languageCode);
        }
        else {
            const spokenText = `I understood you want to ${lastStep.action} the ${lastStep.targetDescription}. Doing that now.`;
            return this.result("executed", request, intent, finalGrounding, spokenText, auditId, transcription.transcript, languageCode);
        }
    }
    listAudit(filter = {}) {
        return this.auditLog
            .filter((record) => !filter.userId || record.userId === filter.userId)
            .filter((record) => !filter.pageSessionId || record.pageSessionId === filter.pageSessionId)
            .slice(-(filter.limit ?? 50));
    }
    async parseIntent(transcript, languageCode, request, history) {
        const response = await this.runVoicePrompt("voice_control.intent", {
            transcript,
            detectedLanguage: languageCode,
            preferredLanguage: request.preferredLanguage,
            shortTermMemory: history
        }, request);
        return this.parseJson(response.formatted.content, this.unknownAction("I did not understand the command.", languageCode));
    }
    async ground(action, request) {
        const response = await this.runVoicePrompt("voice_control.grounding", {
            intent: action,
            elementManifest: request.elementManifest
        }, request);
        return this.parseJson(response.formatted.content, {
            elementId: null,
            confidence: 0,
            requiresConfirmation: false,
            reason: "No confident element match."
        });
    }
    async confirm(action, outcome, languageCode, request) {
        const response = await this.runVoicePrompt("voice_control.confirmation", { action, outcome, language: languageCode }, request);
        const parsed = this.parseJson(response.formatted.content, { spokenText: action.clarifyingQuestion ?? "Done." });
        return this.sanitizeSpokenText(parsed.spokenText);
    }
    runVoicePrompt(promptKey, payload, request) {
        const aiRequest = {
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
    allowCommand(sessionKey) {
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
    result(status, request, action, grounding, spokenText, auditId, transcript, languageCode = request.preferredLanguage ?? "und") {
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
    unknownAction(clarifyingQuestion, languageCode) {
        return { action: "unknown", targetDescription: "", confidence: 0, clarifyingQuestion: this.sanitizeSpokenText(clarifyingQuestion || languageCode) };
    }
    parseJson(text, fallback) {
        try {
            const start = text.indexOf("{");
            const end = text.lastIndexOf("}");
            const json = start >= 0 && end >= start ? text.slice(start, end + 1) : text;
            return JSON.parse(json);
        }
        catch {
            return fallback;
        }
    }
    sanitizeSpokenText(text) {
        return text.replace(/[<>`{}]/g, "").replace(/\s+/g, " ").trim().slice(0, 280);
    }
}
exports.VoiceControlService = VoiceControlService;
