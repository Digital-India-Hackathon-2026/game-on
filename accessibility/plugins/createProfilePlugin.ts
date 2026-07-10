import { AccessibilityConfiguration } from "../AccessibilityConfiguration";
import { applyRules, chunkText, withRule } from "../AccessibilityUtilities";
import type { AccessibilityPlugin, AccessibilityPluginManifest, AccessibilityProfileKey } from "../AccessibilityTypes";

export function createProfilePlugin(input: Omit<AccessibilityPluginManifest, "transformationRules" | "metadata"> & {
  metadata?: Record<string, unknown>;
  maxSentences?: number;
}): AccessibilityPlugin {
  const transformationRules = [
    withRule("chunk_dense_text", "Break dense content into readable chunks.", (section) => ({
      ...section,
      text: chunkText(section.text, input.maxSentences ?? AccessibilityConfiguration.maxParagraphSentences)
    })),
    withRule("preserve_warnings", "Keep warnings visible.", (section) => ({
      ...section,
      warnings: section.warnings ?? []
    }))
  ];
  const manifest: AccessibilityPluginManifest = {
    ...input,
    metadata: input.metadata ?? {},
    transformationRules
  };
  return {
    manifest,
    transform(request) {
      const sections = applyRules(request.sections, manifest.transformationRules);
      return {
        profile: manifest,
        sections,
        theme: manifest.themeOverrides,
        prompts: manifest.promptOverrides,
        voice: manifest.voiceBehaviour,
        validationWarnings: []
      };
    }
  };
}

export function pluginKey(profileKey: AccessibilityProfileKey): string {
  return `saralo.accessibility.${profileKey}`;
}
