export type AccessibilityEventName =
  | "AccessibilityProfileSelected"
  | "AccessibilityRulesResolved"
  | "AccessibilityTransformStarted"
  | "AccessibilityTransformCompleted"
  | "AccessibilityValidationFailed"
  | "AccessibilityProfileSuggested";

export interface AccessibilityEvent {
  name: AccessibilityEventName;
  timestamp: string;
  payload: Record<string, unknown>;
}

export class AccessibilityEventBus {
  readonly events: AccessibilityEvent[] = [];

  emit(name: AccessibilityEventName, payload: Record<string, unknown>): void {
    this.events.push({ name, timestamp: new Date().toISOString(), payload });
  }
}
