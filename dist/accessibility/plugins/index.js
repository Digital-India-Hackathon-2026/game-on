"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.builtInAccessibilityPlugins = void 0;
const createProfilePlugin_1 = require("./createProfilePlugin");
exports.builtInAccessibilityPlugins = [
    (0, createProfilePlugin_1.createProfilePlugin)({
        pluginKey: (0, createProfilePlugin_1.pluginKey)("ai_adaptive"),
        version: "1.0.0",
        profileKey: "ai_adaptive",
        displayName: "AI Adaptive",
        description: "Conservative adaptive accessibility that suggests changes without silently switching profiles.",
        supportedConditions: ["mixed", "unknown"],
        configuration: { adaptationMode: "conservative", suggestProfileChanges: true },
        promptOverrides: { simplify: "Simplify using active user preferences while preserving warnings and meaning." },
        themeOverrides: { spacing: "comfortable", motion: "reduced" },
        readingBehaviour: { sectionChunking: true },
        voiceBehaviour: { voiceReady: true },
        maxSentences: 3
    }),
    (0, createProfilePlugin_1.createProfilePlugin)({
        pluginKey: (0, createProfilePlugin_1.pluginKey)("adhd"),
        version: "1.0.0",
        profileKey: "adhd",
        displayName: "ADHD",
        description: "Focused sections, visible progress, and concise next actions.",
        supportedConditions: ["adhd", "executive_function"],
        configuration: { focusMode: true, maxVisibleActions: 3 },
        promptOverrides: { checklist: "Create short direct steps with one next action." },
        themeOverrides: { layoutDensity: "focused", animations: "none" },
        readingBehaviour: { oneSectionAtATime: true },
        voiceBehaviour: { conciseReadout: true },
        maxSentences: 2
    }),
    (0, createProfilePlugin_1.createProfilePlugin)({
        pluginKey: (0, createProfilePlugin_1.pluginKey)("dyslexia"),
        version: "1.0.0",
        profileKey: "dyslexia",
        displayName: "Dyslexia",
        description: "Readable spacing, simple sentences, and glossary support.",
        supportedConditions: ["dyslexia"],
        configuration: { dyslexiaSpacing: true, lineHeight: 1.7 },
        promptOverrides: { glossary: "Explain difficult words in a short glossary." },
        themeOverrides: { lineHeight: 1.7, textAlign: "left" },
        readingBehaviour: { glossarySupport: true },
        voiceBehaviour: { repeatEasy: true },
        maxSentences: 2
    }),
    (0, createProfilePlugin_1.createProfilePlugin)({
        pluginKey: (0, createProfilePlugin_1.pluginKey)("binocular_vision"),
        version: "1.0.0",
        profileKey: "binocular_vision",
        displayName: "Binocular Vision Support",
        description: "Narrow reading columns, stable layout, and reduced horizontal scanning.",
        supportedConditions: ["binocular_vision"],
        configuration: { maxLineLengthChars: 55, stableLayout: true },
        promptOverrides: { split: "Split content into shorter sections with clear headings." },
        themeOverrides: { contentWidth: "narrow", sectionSpacing: "large" },
        readingBehaviour: { reduceHorizontalScanning: true },
        voiceBehaviour: { sectionNavigation: true }
    }),
    (0, createProfilePlugin_1.createProfilePlugin)({
        pluginKey: (0, createProfilePlugin_1.pluginKey)("color_vision"),
        version: "1.0.0",
        profileKey: "color_vision",
        displayName: "Color Vision Support",
        description: "Text labels, icons, and non-color-only status meaning.",
        supportedConditions: ["color_vision"],
        configuration: { avoidColorOnlyMeaning: true },
        promptOverrides: { visual: "Explain color-coded meaning using text labels." },
        themeOverrides: { statusLabels: true, linkDecoration: "underline" },
        readingBehaviour: { statusTextLabels: true },
        voiceBehaviour: { readStatusLabels: true }
    }),
    (0, createProfilePlugin_1.createProfilePlugin)({
        pluginKey: (0, createProfilePlugin_1.pluginKey)("presbyopia"),
        version: "1.0.0",
        profileKey: "presbyopia",
        displayName: "Presbyopia",
        description: "Extra-large text, larger controls, and strong comfortable contrast.",
        supportedConditions: ["presbyopia", "low_vision"],
        configuration: { defaultTextSize: "extra_large" },
        promptOverrides: { summary: "Create a short summary first, then larger step-by-step sections." },
        themeOverrides: { fontSize: "extra_large", controlSize: "large" },
        readingBehaviour: { largeTextFirst: true },
        voiceBehaviour: { readAloudAvailable: true }
    }),
    (0, createProfilePlugin_1.createProfilePlugin)({
        pluginKey: (0, createProfilePlugin_1.pluginKey)("visual_comfort"),
        version: "1.0.0",
        profileKey: "visual_comfort",
        displayName: "Visual Comfort",
        description: "Low glare, reduced motion, and reduced visual noise.",
        supportedConditions: ["visual_fatigue", "sensory_sensitivity"],
        configuration: { lowGlare: true, reducedMotion: true },
        promptOverrides: { calm: "Summarize calmly and remove non-essential distractions." },
        themeOverrides: { contrast: "low_glare", motion: "none" },
        readingBehaviour: { calmFlow: true },
        voiceBehaviour: { calmVoice: true }
    }),
    (0, createProfilePlugin_1.createProfilePlugin)({
        pluginKey: (0, createProfilePlugin_1.pluginKey)("senior"),
        version: "1.0.0",
        profileKey: "senior",
        displayName: "Senior Mode",
        description: "Plain language, large controls, guided steps, and respectful reassurance.",
        supportedConditions: ["senior", "low_digital_literacy"],
        configuration: { textSize: "extra_large", confirmSensitiveActions: true },
        promptOverrides: { form: "List what the user needs before starting this form." },
        themeOverrides: { fontSize: "extra_large", voiceControls: "prominent" },
        readingBehaviour: { stepByStep: true },
        voiceBehaviour: { slowerSpeech: true, captions: true },
        maxSentences: 2
    })
];
