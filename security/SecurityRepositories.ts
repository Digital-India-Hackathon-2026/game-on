import type { SecurityScanResult } from "./SecurityTypes";

export class SecurityHistoryRepository {
  private readonly records: SecurityScanResult[] = [];
  async save(record: SecurityScanResult): Promise<void> {
    this.records.push(record);
  }
  async list(): Promise<SecurityScanResult[]> {
    return [...this.records];
  }
}
