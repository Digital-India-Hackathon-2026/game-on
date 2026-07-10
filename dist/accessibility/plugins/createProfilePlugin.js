"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createProfilePlugin = createProfilePlugin;
exports.pluginKey = pluginKey;
const AccessibilityConfiguration_1 = require("../AccessibilityConfiguration");
const AccessibilityUtilities_1 = require("../AccessibilityUtilities");
function createProfilePlugin(input) {
    const transformationRules = [
        (0, AccessibilityUtilities_1.withRule)("chunk_dense_text", "Break dense content into readable chunks.", (section) => ({
            ...section,
            text: (0, AccessibilityUtilities_1.chunkText)(section.text, input.maxSentences ?? AccessibilityConfiguration_1.AccessibilityConfiguration.maxParagraphSentences)
        })),
        (0, AccessibilityUtilities_1.withRule)("preserve_warnings", "Keep warnings visible.", (section) => ({
            ...section,
            warnings: section.warnings ?? []
        }))
    ];
    const manifest = {
        ...input,
        metadata: input.metadata ?? {},
        transformationRules
    };
    return {
        manifest,
        transform(request) {
            const sections = (0, AccessibilityUtilities_1.applyRules)(request.sections, manifest.transformationRules);
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
function pluginKey(profileKey) {
    return `saralo.accessibility.${profileKey}`;
}
