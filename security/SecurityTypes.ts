export type SecurityDecision = "allow" | "warn" | "restrict" | "block";
export type SecuritySeverity = "info" | "low" | "medium" | "high" | "critical";

export interface SecurityFinding {
  type: string;
  severity: SecuritySeverity;
  title: string;
  description: string;
  evidence?: Record<string, unknown>;
}

export interface SecurityScanRequest {
  url: string;
  html?: string;
  links?: string[];
  forms?: Array<Record<string, unknown>>;
  redirects?: string[];
}

export interface SecurityScanResult {
  url: string;
  normalizedUrl: string;
  domain: string;
  trustScore: number;
  decision: SecurityDecision;
  reasons: string[];
  findings: SecurityFinding[];
  createdAt: string;
}

export interface SecurityAnalyzer {
  readonly key: string;
  analyze(request: SecurityScanRequest): Promise<SecurityFinding[]>;
}
