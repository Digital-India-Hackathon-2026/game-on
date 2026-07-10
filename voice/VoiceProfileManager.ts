import type { VoicePreferences } from "./VoiceTypes";

export class VoiceProfileManager {
  adaptForAccessibility(profileKey: string, preferences: VoicePreferences): VoicePreferences {
    const profileOverrides: Record<string, Partial<VoicePreferences>> = {
      senior: { speechRate: 0.8, captionsEnabled: true },
      adhd: { continuousReading: false },
      dyslexia: { speechRate: 0.85 },
      visual_comfort: { volume: 0.85 }
    };
    return { ...preferences, ...(profileOverrides[profileKey] ?? {}) };
  }
}
