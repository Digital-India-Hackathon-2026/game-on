export const AccessibilityConfiguration = {
  minTouchTargetPx: 44,
  defaultLineLengthChars: 70,
  maxParagraphSentences: 3,
  preserveOriginalText: true,
  showAiLabels: true,
  voiceReadyOutput: true,
  requiredProfiles: [
    "ai_adaptive",
    "adhd",
    "dyslexia",
    "binocular_vision",
    "color_vision",
    "presbyopia",
    "visual_comfort",
    "senior"
  ] as const
};
