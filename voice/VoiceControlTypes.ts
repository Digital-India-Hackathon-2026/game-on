export type VoiceControlActionType = "click" | "type" | "scroll" | "navigate" | "unknown";

export interface VoiceControlAction {
  action: VoiceControlActionType;
  targetDescription: string;
  value?: string;
  confidence: number;
  clarifyingQuestion?: string;

  actions?: Array<{
    action: VoiceControlActionType;
    targetDescription: string;
    value?: string;
    confidence: number;
    clarifyingQuestion?: string;
  }>;
  language?: string;
  needsClarification?: boolean;
}

export interface VoiceControlElementManifest {
  id: string;
  tag: string;
  visibleText: string;
  ariaLabel: string;
  role?: string;
  inputType?: string;
  href?: string;
  position: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
  index?: number;
  color?: string;
  backgroundColor?: string;
  proximityText?: string;
}

export interface VoiceControlGrounding {
  elementId: string | null;
  confidence: number;
  requiresConfirmation: boolean;
  reason: string;
  clarifyingQuestion?: string;
}

export interface VoiceControlRequest {
  audio: Uint8Array;
  userId?: string;
  pageSessionId?: string;
  preferredLanguage?: string;
  elementManifest: VoiceControlElementManifest[];
}

export interface VoiceControlResult {
  status: "executed" | "needs_confirmation" | "needs_clarification" | "rate_limited" | "failed";
  transcript?: string;
  languageCode: string;
  action: VoiceControlAction;
  grounding?: VoiceControlGrounding;
  spokenText: string;
  auditId: string;
}

export interface VoiceControlAuditRecord {
  id: string;
  userId?: string;
  pageSessionId?: string;
  action: VoiceControlActionType;
  targetDescription: string;
  elementId?: string | null;
  status: VoiceControlResult["status"];
  languageCode: string;
  timestamp: string;
}
