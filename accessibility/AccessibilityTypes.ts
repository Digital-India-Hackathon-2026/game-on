export type AccessibilityProfileKey =
  | "ai_adaptive"
  | "adhd"
  | "dyslexia"
  | "binocular_vision"
  | "color_vision"
  | "presbyopia"
  | "visual_comfort"
  | "senior";

export interface AccessibilityPluginManifest {
  pluginKey: string;
  version: string;
  profileKey: AccessibilityProfileKey;
  displayName: string;
  description: string;
  supportedConditions: string[];
  metadata: Record<string, unknown>;
  configuration: Record<string, unknown>;
  promptOverrides: Record<string, string>;
  themeOverrides: Record<string, unknown>;
  readingBehaviour: Record<string, unknown>;
  transformationRules: AccessibilityRule[];
  voiceBehaviour: Record<string, unknown>;
}

export interface AccessibilityRule {
  id: string;
  description: string;
  apply(section: AccessibleSection): AccessibleSection;
}

export interface AccessibleSection {
  id: string;
  heading: string;
  text: string;
  readingOrder: number;
  warnings?: string[];
  metadata?: Record<string, unknown>;
}

export interface AccessibilityRequest {
  profileKey: AccessibilityProfileKey;
  sections: AccessibleSection[];
  securityWarnings?: string[];
  preferences?: Record<string, unknown>;
  language?: string;
}

export interface AccessibilityResult {
  profile: AccessibilityPluginManifest;
  sections: AccessibleSection[];
  theme: Record<string, unknown>;
  prompts: Record<string, string>;
  voice: Record<string, unknown>;
  validationWarnings: string[];
}

export interface AccessibilityPlugin {
  manifest: AccessibilityPluginManifest;
  transform(request: AccessibilityRequest): AccessibilityResult;
}
