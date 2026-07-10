import { VoiceSessionRepository } from "./VoiceRepositories";
import type { VoiceMode, VoiceSession } from "./VoiceTypes";
import { createVoiceId } from "./VoiceUtilities";

export class VoiceSessionManager {
  constructor(private readonly repository = new VoiceSessionRepository()) {}

  async create(input: { userId?: string; pageSessionId?: string; mode: VoiceMode; provider: string; inputText?: string; metadata?: Record<string, unknown> }): Promise<VoiceSession> {
    const session: VoiceSession = {
      id: createVoiceId("voice"),
      userId: input.userId,
      pageSessionId: input.pageSessionId,
      mode: input.mode,
      provider: input.provider,
      inputText: input.inputText,
      status: "processing",
      createdAt: new Date().toISOString(),
      metadata: input.metadata ?? {}
    };
    await this.repository.save(session);
    return session;
  }

  list(userId?: string): Promise<VoiceSession[]> {
    return this.repository.list(userId);
  }
}
