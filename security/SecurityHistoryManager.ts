import { SecurityHistoryRepository } from "./SecurityRepositories";
import type { SecurityScanResult } from "./SecurityTypes";

export class SecurityHistoryManager {
  constructor(private readonly repository = new SecurityHistoryRepository()) {}
  async record(result: SecurityScanResult): Promise<void> {
    await this.repository.save(result);
  }
  list(): Promise<SecurityScanResult[]> {
    return this.repository.list();
  }
}
