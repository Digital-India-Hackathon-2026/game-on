import type { VoiceSession } from "./VoiceTypes";

export class VoiceHistory {
  private readonly records: VoiceSession[] = [];
  record(session: VoiceSession): void {
    this.records.push(session);
  }
  list(userId?: string): VoiceSession[] {
    return this.records.filter((session) => !userId || session.userId === userId);
  }
}
