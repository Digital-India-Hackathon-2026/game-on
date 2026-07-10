"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrustScoreCalculator = void 0;
const SecurityUtilities_1 = require("./SecurityUtilities");
class TrustScoreCalculator {
    calculate(findings, https) {
        const base = https ? 90 : 70;
        const score = Math.max(0, base - findings.reduce((sum, finding) => sum + (0, SecurityUtilities_1.severityPenalty)(finding), 0));
        return {
            score,
            decision: findings.some((finding) => finding.severity === "critical") ? "block" : (0, SecurityUtilities_1.decisionFromScore)(score),
            reasons: findings.length ? findings.map((finding) => finding.title) : ["No high-risk signals found"]
        };
    }
}
exports.TrustScoreCalculator = TrustScoreCalculator;
