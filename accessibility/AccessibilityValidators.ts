import type { AccessibilityPluginManifest, AccessibilityRequest, AccessibilityResult } from "./AccessibilityTypes";

export class AccessibilityValidators {
  validateManifest(manifest: AccessibilityPluginManifest): void {
    if (!manifest.pluginKey || !manifest.version || !manifest.profileKey) {
      throw new Error("Accessibility plugin manifest is incomplete.");
    }
  }

  validateRequest(request: AccessibilityRequest): void {
    if (!request.profileKey) throw new Error("Accessibility profile is required.");
    if (!Array.isArray(request.sections)) throw new Error("Accessibility sections must be an array.");
  }

  validateResult(result: AccessibilityResult): string[] {
    return result.sections.flatMap((section) => {
      const warnings: string[] = [];
      if (!section.heading) warnings.push(`Section ${section.id} is missing a heading.`);
      if (!section.text) warnings.push(`Section ${section.id} is empty.`);
      return warnings;
    });
  }
}
