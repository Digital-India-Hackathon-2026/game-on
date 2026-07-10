import type { VoicePreferences, VoiceSession } from "./VoiceTypes";
import { defaultVoicePreferences } from "./VoiceConfiguration";

export class VoiceSessionRepository {
  private readonly sessions = new Map<string, VoiceSession>();
  async save(session: VoiceSession): Promise<void> {
    this.sessions.set(session.id, session);
  }
  async list(userId?: string): Promise<VoiceSession[]> {
    return [...this.sessions.values()].filter((session) => !userId || session.userId === userId);
  }
}

export class VoicePreferenceRepository {
  private readonly preferences = new Map<string, VoicePreferences>();
  async get(userId = "guest"): Promise<VoicePreferences> {
    return this.preferences.get(userId) ?? defaultVoicePreferences;
  }
  async save(userId: string, preferences: VoicePreferences): Promise<void> {
    this.preferences.set(userId, preferences);
  }
}
