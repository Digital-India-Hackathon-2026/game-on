"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityService = void 0;
const analyzers_1 = require("./analyzers");
const SecurityEvents_1 = require("./SecurityEvents");
const SecurityHistoryManager_1 = require("./SecurityHistoryManager");
const SecurityRegistry_1 = require("./SecurityRegistry");
const SecurityReportGenerator_1 = require("./SecurityReportGenerator");
const SecurityValidators_1 = require("./SecurityValidators");
const TrustScoreCalculator_1 = require("./TrustScoreCalculator");
class SecurityService {
    events = new SecurityEvents_1.SecurityEvents();
    registry = new SecurityRegistry_1.SecurityRegistry();
    history = new SecurityHistoryManager_1.SecurityHistoryManager();
    reports = new SecurityReportGenerator_1.SecurityReportGenerator();
    validators = new SecurityValidators_1.SecurityValidators();
    trust = new TrustScoreCalculator_1.TrustScoreCalculator();
    constructor() {
        analyzers_1.defaultSecurityAnalyzers.forEach((analyzer) => this.registry.register(analyzer));
    }
    async scan(request) {
        this.events.emit("UrlValidationStarted", { url: request.url });
        const url = this.validators.url.validate(request.url);
        const findings = (await Promise.all(this.registry.list().map((analyzer) => analyzer.analyze({ ...request, url: url.toString() })))).flat();
        const trust = this.trust.calculate(findings, url.protocol === "https:");
        const result = {
            url: request.url,
            normalizedUrl: url.toString(),
            domain: url.hostname,
            trustScore: trust.score,
            decision: trust.decision,
            reasons: trust.reasons,
            findings,
            createdAt: new Date().toISOString()
        };
        this.events.emit("TrustScoreCalculated", { score: result.trustScore });
        this.events.emit("SecurityDecisionMade", { decision: result.decision });
        await this.history.record(result);
        this.events.emit("SecurityHistoryRecorded", { url: result.normalizedUrl });
        return result;
    }
    async trustScore(url) {
        return (await this.scan({ url })).trustScore;
    }
    async securityReport(url) {
        return this.reports.generate(await this.scan({ url }));
    }
    async safeNavigation(url) {
        const result = await this.scan({ url });
        return { allowed: result.decision === "allow" || result.decision === "warn", decision: result.decision, warning: result.reasons[0] };
    }
}
exports.SecurityService = SecurityService;
