// ---------------------------------------------------------------------------
// Low Vision Mode — Type Definitions
// ---------------------------------------------------------------------------

// ---- Display Config ----
export interface LowVisionDisplayConfig {
  zoomLevels: number[];
  defaultZoom: number;
  contrastPresets: ContrastPreset[];
  brightnessLevels: number[];
  glareReductionLevels: number[];
  boldText: boolean;
  singleColumnReflow: boolean;
  largerClickTargets: LargerClickTargetConfig;
  assistiveFeatures: LowVisionAssistiveFeatures;
}

export interface ContrastPreset {
  id: string;
  label: string;
  foreground: string;
  background: string;
  link: string;
  border: string;
  /** "normal" | "high" | "inverted" | "custom" */
  type: string;
}

export interface LargerClickTargetConfig {
  enabled: boolean;
  minSizePx: number;
  paddingMultiplier: number;
}

export interface LowVisionAssistiveFeatures {
  extraLargeTextScale: number;
  headingScale: number;
  iconScale: number;
  cursorScale: number;
  persistentZoom: number;
  smartMagnifier: boolean;
  readPageButton: boolean;
  imageOcrOnDemand: boolean;
  clutterReduction: boolean;
  focusMasks: false;
  spotlightEffects: false;
}

// ---- Alt Text ----
export interface AltTextRequest {
  imageUrl?: string;
  imageContext?: string;
}

export interface AltTextResponse {
  altText: string | null;
  cached: boolean;
  error?: string;
}

// ---- Preferences ----
export interface LowVisionPreferences {
  userId: string;
  zoomLevel: number;
  contrastPresetId: string;
  brightness: number;
  glareReduction: number;
  fontSize: number;
  boldText: boolean;
  singleColumnReflow: boolean;
  largerClickTargets: boolean;
  updatedAt: string;
}

export interface LowVisionPreferencesUpdate {
  zoomLevel?: number;
  contrastPresetId?: string;
  brightness?: number;
  glareReduction?: number;
  fontSize?: number;
  boldText?: boolean;
  singleColumnReflow?: boolean;
  largerClickTargets?: boolean;
}

// ---- Read Aloud Text ----
export interface ReadAloudTextRequest {
  pageText: string;
}

export interface ReadAloudTextResponse {
  cleanedText: string;
  originalLength: number;
  cleanedLength: number;
  reductionPercent: number;
}

// ---- Health ----
export interface LowVisionHealthResponse {
  status: string;
  mode: string;
  timestamp: string;
  version: string;
  endpoints: string[];
}

// ---- Error ----
export interface LowVisionErrorResponse {
  error: {
    code: string;
    message: string;
    request_id?: string;
  };
}
