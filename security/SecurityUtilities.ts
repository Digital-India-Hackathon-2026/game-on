import { SecurityConfiguration } from "./SecurityConfiguration";
import type { SecurityDecision, SecurityFinding } from "./SecurityTypes";

export function normalizeUrl(input: string): URL {
  const url = new URL(input);
  url.hash = "";
  return url;
}

export function isPrivateOrLocalHost(hostname: string): boolean {
  return SecurityConfiguration.blockedHosts.includes(hostname.toLowerCase()) ||
    /^10\./.test(hostname) ||
    /^192\.168\./.test(hostname) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(hostname) ||
    /^169\.254\./.test(hostname);
}

export function decisionFromScore(score: number): SecurityDecision {
  if (score >= SecurityConfiguration.trustBands.allow) return "allow";
  if (score >= SecurityConfiguration.trustBands.warn) return "warn";
  if (score >= SecurityConfiguration.trustBands.restrict) return "restrict";
  return "block";
}

export function severityPenalty(finding: SecurityFinding): number {
  return { info: 0, low: 5, medium: 15, high: 35, critical: 80 }[finding.severity];
}
