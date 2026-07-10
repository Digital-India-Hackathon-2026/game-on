import { VoicePreferenceRepository } from "./VoiceRepositories";
import type { VoicePreferences } from "./VoiceTypes";
import { VoiceValidators } from "./VoiceValidators";

export class VoicePreferenceManager {
  constructor(private readonly repository = new VoicePreferenceRepository(), private readonly validators = new VoiceValidators()) {}
  get(userId?: string): Promise<VoicePreferences> {
    return this.repository.get(userId);
  }
  async save(userId: string, preferences: VoicePreferences): Promise<void> {
    this.validators.validatePreferences(preferences);
    await this.repository.save(userId, preferences);
  }
}
