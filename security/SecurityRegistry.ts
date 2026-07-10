import type { SecurityAnalyzer } from "./SecurityTypes";

export class SecurityRegistry {
  private readonly analyzers = new Map<string, SecurityAnalyzer>();
  register(analyzer: SecurityAnalyzer): void {
    this.analyzers.set(analyzer.key, analyzer);
  }
  list(): SecurityAnalyzer[] {
    return [...this.analyzers.values()];
  }
}
