import { decisionFromScore, severityPenalty } from "./SecurityUtilities";
import type { SecurityDecision, SecurityFinding } from "./SecurityTypes";

export class TrustScoreCalculator {
  calculate(findings: SecurityFinding[], https: boolean): { score: number; decision: SecurityDecision; reasons: string[] } {
    const base = https ? 90 : 70;
    const score = Math.max(0, base - findings.reduce((sum, finding) => sum + severityPenalty(finding), 0));
    return {
      score,
      decision: findings.some((finding) => finding.severity === "critical") ? "block" : decisionFromScore(score),
      reasons: findings.length ? findings.map((finding) => finding.title) : ["No high-risk signals found"]
    };
  }
}
