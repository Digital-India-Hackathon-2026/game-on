"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccessibilityValidators = void 0;
class AccessibilityValidators {
    validateManifest(manifest) {
        if (!manifest.pluginKey || !manifest.version || !manifest.profileKey) {
            throw new Error("Accessibility plugin manifest is incomplete.");
        }
    }
    validateRequest(request) {
        if (!request.profileKey)
            throw new Error("Accessibility profile is required.");
        if (!Array.isArray(request.sections))
            throw new Error("Accessibility sections must be an array.");
    }
    validateResult(result) {
        return result.sections.flatMap((section) => {
            const warnings = [];
            if (!section.heading)
                warnings.push(`Section ${section.id} is missing a heading.`);
            if (!section.text)
                warnings.push(`Section ${section.id} is empty.`);
            return warnings;
        });
    }
}
exports.AccessibilityValidators = AccessibilityValidators;
