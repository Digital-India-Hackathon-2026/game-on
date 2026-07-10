export type AstigmatismSeverity = "mild" | "moderate" | "severe";

export interface AstigmatismCorrectionValues {
  fontWeight: number;
  headingWeight: number;
  bodyFontScale: number;
  headingFontScale: number;
  letterSpacingEm: number;
  lineHeightMultiplier: number;
  sectionSpacingRem: number;
  readingColumnMaxWidthPx: number;
  textShadowOpacity: number;
  edgeBoost: number;
  brightElementDim: number;
  imageScale: number;
  secondaryOpacity: number;
  borderWidthPx: number;
}

export interface AstigmatismTransformRequest {
  url: string;
  enabled?: boolean;
  severity?: AstigmatismSeverity;
}

export interface AstigmatismToggleRequest {
  enabled: boolean;
  severity?: AstigmatismSeverity;
}

export interface AstigmatismToggleState {
  enabled: boolean;
  severity: AstigmatismSeverity;
  updatedAt: string;
}

export interface AstigmatismTransformResponse {
  ok: true;
  url: string;
  finalUrl: string;
  enabled: boolean;
  severity: AstigmatismSeverity;
  html: string;
  values: AstigmatismCorrectionValues;
}

export interface AstigmatismPreviewResponse {
  ok: true;
  url: string;
  finalUrl: string;
  severity: AstigmatismSeverity;
  html: string;
}

export interface AstigmatismConfigResponse {
  version: string;
  defaultSeverity: AstigmatismSeverity;
  severities: Record<AstigmatismSeverity, AstigmatismCorrectionValues>;
  reversibleRuntime: {
    global: string;
    messageType: string;
  };
}

export interface AstigmatismHealthResponse {
  status: "ok";
  mode: "astigmatism";
  version: string;
}
