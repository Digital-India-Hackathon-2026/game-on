"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityReportGenerator = void 0;
class SecurityReportGenerator {
    generate(result) {
        return [
            `Security decision: ${result.decision}`,
            `Trust score: ${result.trustScore}`,
            `Reasons: ${result.reasons.join("; ")}`,
            `Findings: ${result.findings.map((finding) => `${finding.severity}: ${finding.title}`).join("; ") || "none"}`
        ].join("\n");
    }
}
exports.SecurityReportGenerator = SecurityReportGenerator;
