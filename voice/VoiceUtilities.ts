export function createVoiceId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function normalizeSpeechText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

export function isSensitiveReadout(text: string): boolean {
  return /password|credit card|ssn|one-time code|otp|payment/i.test(text);
}
