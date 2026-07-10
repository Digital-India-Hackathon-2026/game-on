export type SecurityEventName =
  | "UrlValidationStarted"
  | "UrlValidationFailed"
  | "SslVerificationCompleted"
  | "DomainReputationChecked"
  | "ScamSignalsDetected"
  | "PhishingSignalsDetected"
  | "TyposquattingChecked"
  | "DownloadScanCompleted"
  | "LinkAnalysisCompleted"
  | "PrivacyAnalysisCompleted"
  | "PermissionAnalysisCompleted"
  | "TrustScoreCalculated"
  | "SecurityDecisionMade"
  | "SecurityHistoryRecorded";

export class SecurityEvents {
  readonly events: Array<{ name: SecurityEventName; timestamp: string; payload: Record<string, unknown> }> = [];
  emit(name: SecurityEventName, payload: Record<string, unknown>): void {
    this.events.push({ name, timestamp: new Date().toISOString(), payload });
  }
}
