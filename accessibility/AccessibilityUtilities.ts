import type { AccessibleSection, AccessibilityRule } from "./AccessibilityTypes";

export function chunkText(text: string, maxSentences: number): string {
  const sentences = text.split(/(?<=[.!?])\s+/).filter(Boolean);
  const chunks: string[] = [];
  for (let index = 0; index < sentences.length; index += maxSentences) {
    chunks.push(sentences.slice(index, index + maxSentences).join(" "));
  }
  return chunks.join("\n\n");
}

export function withRule(id: string, description: string, apply: (section: AccessibleSection) => AccessibleSection): AccessibilityRule {
  return { id, description, apply };
}

export function applyRules(sections: AccessibleSection[], rules: AccessibilityRule[]): AccessibleSection[] {
  return sections.map((section) => rules.reduce((current, rule) => rule.apply(current), section));
}
