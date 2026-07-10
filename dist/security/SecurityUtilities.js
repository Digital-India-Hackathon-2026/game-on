"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeUrl = normalizeUrl;
exports.isPrivateOrLocalHost = isPrivateOrLocalHost;
exports.decisionFromScore = decisionFromScore;
exports.severityPenalty = severityPenalty;
const SecurityConfiguration_1 = require("./SecurityConfiguration");
function normalizeUrl(input) {
    const url = new URL(input);
    url.hash = "";
    return url;
}
function isPrivateOrLocalHost(hostname) {
    return SecurityConfiguration_1.SecurityConfiguration.blockedHosts.includes(hostname.toLowerCase()) ||
        /^10\./.test(hostname) ||
        /^192\.168\./.test(hostname) ||
        /^172\.(1[6-9]|2\d|3[01])\./.test(hostname) ||
        /^169\.254\./.test(hostname);
}
function decisionFromScore(score) {
    if (score >= SecurityConfiguration_1.SecurityConfiguration.trustBands.allow)
        return "allow";
    if (score >= SecurityConfiguration_1.SecurityConfiguration.trustBands.warn)
        return "warn";
    if (score >= SecurityConfiguration_1.SecurityConfiguration.trustBands.restrict)
        return "restrict";
    return "block";
}
function severityPenalty(finding) {
    return { info: 0, low: 5, medium: 15, high: 35, critical: 80 }[finding.severity];
}
