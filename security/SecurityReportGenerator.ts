import type { SecurityScanResult } from "./SecurityTypes";

export class SecurityReportGenerator {
  generate(result: SecurityScanResult): string {
    return [
      `Security decision: ${result.decision}`,
      `Trust score: ${result.trustScore}`,
      `Reasons: ${result.reasons.join("; ")}`,
      `Findings: ${result.findings.map((finding) => `${finding.severity}: ${finding.title}`).join("; ") || "none"}`
    ].join("\n");
  }
}
