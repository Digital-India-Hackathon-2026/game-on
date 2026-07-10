import { defaultSecurityAnalyzers } from "./analyzers";
import { SecurityEvents } from "./SecurityEvents";
import { SecurityHistoryManager } from "./SecurityHistoryManager";
import { SecurityRegistry } from "./SecurityRegistry";
import { SecurityReportGenerator } from "./SecurityReportGenerator";
import { SecurityValidators } from "./SecurityValidators";
import { TrustScoreCalculator } from "./TrustScoreCalculator";
import type { SecurityScanRequest, SecurityScanResult } from "./SecurityTypes";

export class SecurityService {
  readonly events = new SecurityEvents();
  readonly registry = new SecurityRegistry();
  readonly history = new SecurityHistoryManager();
  readonly reports = new SecurityReportGenerator();
  private readonly validators = new SecurityValidators();
  private readonly trust = new TrustScoreCalculator();

  constructor() {
    defaultSecurityAnalyzers.forEach((analyzer) => this.registry.register(analyzer));
  }

  async scan(request: SecurityScanRequest): Promise<SecurityScanResult> {
    this.events.emit("UrlValidationStarted", { url: request.url });
    const url = this.validators.url.validate(request.url);
    const findings = (await Promise.all(this.registry.list().map((analyzer) => analyzer.analyze({ ...request, url: url.toString() })))).flat();
    const trust = this.trust.calculate(findings, url.protocol === "https:");
    const result: SecurityScanResult = {
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

  async trustScore(url: string): Promise<number> {
    return (await this.scan({ url })).trustScore;
  }

  async securityReport(url: string): Promise<string> {
    return this.reports.generate(await this.scan({ url }));
  }

  async safeNavigation(url: string): Promise<{ allowed: boolean; decision: string; warning?: string }> {
    const result = await this.scan({ url });
    return { allowed: result.decision === "allow" || result.decision === "warn", decision: result.decision, warning: result.reasons[0] };
  }
}
