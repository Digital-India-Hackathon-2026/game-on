export type VoiceEventName =
  | "VoiceSessionCreated"
  | "TextToSpeechRequested"
  | "TextToSpeechCompleted"
  | "SpeechToTextRequested"
  | "SpeechToTextCompleted"
  | "VoiceCommandDetected"
  | "VoiceCommandExecuted"
  | "VoiceSessionFailed";

export class VoiceEvents {
  readonly events: Array<{ name: VoiceEventName; timestamp: string; payload: Record<string, unknown> }> = [];
  emit(name: VoiceEventName, payload: Record<string, unknown>): void {
    this.events.push({ name, timestamp: new Date().toISOString(), payload });
  }
}
