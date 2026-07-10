import { useCallback, useMemo, useState } from "react";

export type AccessibilityModeId =
  | "adhd"
  | "dyslexia"
  | "low-vision"
  | "astigmatism"
  | "colorblind"
  | "cognitive-overload";

export type SessionPhase = "landing" | "mode-select" | "viewing";

export type ViewerSettings = {
  contrast: number;
  brightness: number;
  zoom: number;
  spacing: number;
  saturation: number;
  warmth: number;
  language: string;
  theme: "light" | "dark" | "auto";
  darkMode: boolean;
  readingGuide: boolean;
  focusMask: boolean;
  colorblindType?: "protanopia" | "deuteranopia" | "tritanopia" | "achromatopsia";
  cognitiveFixed?: boolean;
  hideSidebar?: boolean;
  hideImages?: boolean;
  reduceAnimations?: boolean;
  chunkParagraphs?: boolean;
  highlightActiveParagraph?: boolean;
  dyslexiaFont?: boolean;
  wordSpacing?: number;
  lineHeight?: number;
  readingRuler?: boolean;
  syllableHighlight?: boolean;
  readAlong?: boolean;
  warmReadingTheme?: "dark" | "light";
  fontThickness?: number;
  readingWidth?: number;
  antiGlare?: number;
  textSharpness?: number;
  reduceVisualNoise?: boolean;
  darkComfortMode?: boolean;
  textSize?: number;
  buttonSize?: number;
  iconSize?: number;
  cursorSize?: number;
  magnifier?: boolean;
  highContrast?: boolean;
  screenReader?: boolean;
  readSelectedText?: boolean;
  ocrImageReader?: boolean;
  simplifiedLayout?: boolean;
  darkHighContrastMode?: boolean;
  contrastBoost?: number;
  colorLabels?: boolean;
  patternOverlay?: boolean;
  simplifyLanguage?: boolean;
  aiSummary?: boolean;
  removeAds?: boolean;
  hidePopups?: boolean;
  oneTaskAtATime?: boolean;
  simplifyForms?: boolean;
  highlightImportant?: boolean;
  calmDarkTheme?: boolean;
  summaryMode?: "quick" | "standard" | "detailed" | "action";
  summaryLength?: number;
};

export type ModePreset = {
  id: AccessibilityModeId;
  title: string;
  subtitle?: string;
  problem?: string;
  resolution?: string;
  parameter?: string;
  description?: string;
  icon: string;
  glow: string;
  settings: ViewerSettings;
};

export const modePresets: ModePreset[] = [
  {
    id: "adhd",
    title: "ADHD Focus Mode",
    subtitle: "ISOLATION & FOCUS",
    description:
      "Dims distractions, reduces visual noise, and creates a spotlight window so you can focus on one section at a time.",
    icon: "https://polo-pecan-73837341.figma.site/_assets/v11/aa51718fb3af3637e6d666b6543fc27a175fada6.png",
    glow: "#A068FF",
    settings: {
      contrast: 100,
      brightness: 100,
      zoom: 100,
      spacing: 50,
      saturation: 85,
      warmth: 0,
      language: "auto",
      theme: "auto",
      darkMode: false,
      readingGuide: false,
      focusMask: true,
      hideSidebar: false,
      hideImages: false,
      reduceAnimations: true,
      chunkParagraphs: false,
      highlightActiveParagraph: true,
    },
  },
  {
    id: "dyslexia",
    title: "Dyslexia Adaptation",
    subtitle: "READABLE & WARM",
    description:
      "Applies a warm tint, increases letter spacing, and softens contrast to reduce letter crowding and visual stress.",
    icon: "https://polo-pecan-73837341.figma.site/_assets/v11/ca755f7f93c1126fb8bdbf99ab364a33aa9ab272.png",
    glow: "#ffd84a",
    settings: {
      contrast: 90,
      brightness: 100,
      zoom: 100,
      spacing: 80,
      saturation: 90,
      warmth: 20,
      language: "auto",
      theme: "auto",
      darkMode: false,
      readingGuide: false,
      focusMask: false,
      dyslexiaFont: true,
      wordSpacing: 110,
      lineHeight: 170,
      readingRuler: false,
      syllableHighlight: false,
      readAlong: false,
      warmReadingTheme: "light",
    },
  },
  {
    id: "low-vision",
    title: "Low Vision Suite",
    subtitle: "HIGH CONTRAST & ZOOM",
    resolution: "Large readable typography, high contrast, persistent zoom, and settings-driven reading assists.",
    parameter: "Responsive reflow, cleaner hit targets, on-demand image reading, and page-preserving magnification.",
    icon: "https://polo-pecan-73837341.figma.site/_assets/v11/018736aa5d0275c4ce56cfebaf2ae3007d81ca1e.png",
    glow: "#ff5bbd",
    settings: {
      contrast: 140,
      brightness: 115,
      zoom: 150,
      spacing: 50,
      saturation: 110,
      warmth: 0,
      language: "auto",
      theme: "auto",
      darkMode: false,
      readingGuide: false,
      focusMask: false,
      colorblindType: "protanopia",
      textSize: 190,
      buttonSize: 160,
      iconSize: 145,
      cursorSize: 180,
      magnifier: false,
      highContrast: true,
      screenReader: true,
      readSelectedText: false,
      ocrImageReader: false,
      simplifiedLayout: true,
      darkHighContrastMode: false,
    },
  },
  {
    id: "astigmatism",
    title: "Astigmatism Mode",
    subtitle: "SHARP EDGES & LOW GLARE",
    description:
      "Sharpens text, reduces glare, and adds gentle spacing to make blurred or streaked content easier to read.",
    icon: "https://polo-pecan-73837341.figma.site/_assets/v11/7b1b5f039de7b54cc9913e96c1923c3b15a157fa.png",
    glow: "#ff9f2f",
    settings: {
      contrast: 100,
      brightness: 100,
      zoom: 100,
      spacing: 65,
      saturation: 100,
      warmth: 0,
      language: "auto",
      theme: "auto",
      darkMode: false,
      readingGuide: false,
      focusMask: false,
      fontThickness: 650,
      readingWidth: 850,
      antiGlare: 60,
      textSharpness: 65,
      reduceVisualNoise: true,
      darkComfortMode: false,
    },
  },
  {
    id: "colorblind",
    title: "Color Blindness Mode",
    subtitle: "PROTAN/DEUTAN/TRITAN",
    resolution: "Applies professional real-time SVG color matrices for Protan/Deutan/Tritan.",
    parameter: "High-fidelity color matrices replacing basic CSS filters.",
    icon: "https://polo-pecan-73837341.figma.site/_assets/v11/c76d8a0b99676de31c014344bfaf75bad090758d.png",
    glow: "#7b4dff",
    settings: {
      contrast: 100,
      brightness: 100,
      zoom: 100,
      spacing: 50,
      saturation: 100,
      warmth: 0,
      language: "auto",
      theme: "auto",
      darkMode: false,
      readingGuide: false,
      focusMask: false,
      colorblindType: "protanopia",
      contrastBoost: 115,
      colorLabels: false,
      patternOverlay: false,
    },
  },
  {
    id: "cognitive-overload",
    title: "Cognitive Overload Mode",
    subtitle: "CLEAN & CALM READER",
    problem: "Sensory overload from too",
    resolution: "\"Fix This UI\" instantly wipes visual noise, replacing it with a clean reader view.",
    parameter: "Noise reduction, simplified reading layout, and plain-language next steps.",
    icon: "https://polo-pecan-73837341.figma.site/_assets/v11/926c9eb7b4bc1df846fa0e39f0b0dc3fefd80671.png",
    glow: "#A068FF",
    settings: {
      contrast: 100,
      brightness: 100,
      zoom: 100,
      spacing: 50,
      saturation: 100,
      warmth: 0,
      language: "auto",
      theme: "auto",
      darkMode: false,
      readingGuide: false,
      focusMask: false,
      cognitiveFixed: false,
      simplifyLanguage: false,
      removeAds: true,
      hidePopups: true,
      oneTaskAtATime: false,
      simplifyForms: false,
      highlightImportant: true,
      calmDarkTheme: false,
    },
  },
];

const defaultSettings: ViewerSettings = {
  contrast: 100,
  brightness: 100,
  zoom: 100,
  spacing: 50,
  saturation: 100,
  warmth: 0,
  language: "auto",
  theme: "auto",
  darkMode: false,
  readingGuide: false,
  focusMask: false,
  colorblindType: "protanopia",
  cognitiveFixed: false,
};

const SETTINGS_STORAGE_KEY = "saralo-viewer-settings-v2";
const removedStoredSettingKeys = new Set<keyof ViewerSettings>([
  "aiSummary",
]);

function loadStoredModeSettings(): Partial<Record<AccessibilityModeId, ViewerSettings>> {
  if (typeof window === "undefined") return {};
  try {
    const parsed = JSON.parse(window.localStorage.getItem(SETTINGS_STORAGE_KEY) || "{}") as Partial<Record<AccessibilityModeId, ViewerSettings>>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function saveStoredModeSettings(modeId: AccessibilityModeId, nextSettings: ViewerSettings) {
  if (typeof window === "undefined") return;
  const stored = loadStoredModeSettings();
  window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify({ ...stored, [modeId]: nextSettings }));
}

function getSettingsForMode(modeId: AccessibilityModeId) {
  const preset = modePresets.find((m) => m.id === modeId);
  const stored = loadStoredModeSettings()[modeId];
  const base = preset?.settings ?? defaultSettings;
  const cleanStored = Object.fromEntries(
    Object.entries(stored ?? {}).filter(([key]) => key in base && !removedStoredSettingKeys.has(key as keyof ViewerSettings))
  ) as Partial<ViewerSettings>;
  return { ...base, ...cleanStored };
}

export function useAdaptiveSession() {
  const [sessionPhase, setSessionPhase] = useState<SessionPhase>("landing");
  const [activeMode, setActiveMode] = useState<AccessibilityModeId | null>(null);
  const [targetUrl, setTargetUrl] = useState("");
  const [settings, setSettings] = useState<ViewerSettings>(defaultSettings);

  const openModeSelect = useCallback((url: string) => {
    setTargetUrl(url);
    setSessionPhase("mode-select");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const selectMode = useCallback((modeId: AccessibilityModeId) => {
    const preset = modePresets.find((m) => m.id === modeId);
    if (preset) {
      setActiveMode(modeId);
      setSettings(getSettingsForMode(modeId));
      setSessionPhase("viewing");
    }
  }, []);

  const switchMode = useCallback((modeId: AccessibilityModeId) => {
    const preset = modePresets.find((m) => m.id === modeId);
    if (preset) {
      setActiveMode(modeId);
      setSettings(getSettingsForMode(modeId));
    }
  }, []);

  const updateSettings = useCallback((patch: Partial<ViewerSettings>) => {
    setSettings((prev) => {
      const cleanPatch = Object.fromEntries(
        Object.entries(patch).filter(([key]) => !removedStoredSettingKeys.has(key as keyof ViewerSettings))
      ) as Partial<ViewerSettings>;
      const next = { ...prev, ...cleanPatch };
      if (activeMode) saveStoredModeSettings(activeMode, next);
      return next;
    });
  }, [activeMode]);

  const resetModeSettings = useCallback(() => {
    if (!activeMode) return;
    const preset = modePresets.find((m) => m.id === activeMode);
    const presetSettings = { ...(preset?.settings ?? defaultSettings) };
    saveStoredModeSettings(activeMode, presetSettings);
    setSettings(presetSettings);
  }, [activeMode]);

  const exitViewer = useCallback(() => {
    if (targetUrl) {
      setSessionPhase("mode-select");
      return;
    }
    setSessionPhase("landing");
  }, [targetUrl]);

  const exitModeSelect = useCallback(() => {
    setSessionPhase("landing");
    setActiveMode(null);
    setSettings(defaultSettings);
  }, []);

  const activePreset = useMemo(
    () => modePresets.find((m) => m.id === activeMode) ?? null,
    [activeMode]
  );

  const cssFilter = useMemo(() => {
    const parts: string[] = [];
    if (settings.contrast !== 100) parts.push(`contrast(${settings.contrast}%)`);
    if (settings.brightness !== 100) parts.push(`brightness(${settings.brightness}%)`);
    if (settings.saturation !== 100) parts.push(`saturate(${settings.saturation}%)`);
    if (settings.warmth > 0) parts.push(`sepia(${settings.warmth}%)`);
    
    if (activeMode === "colorblind" && settings.colorblindType) {
      parts.push(`url(#${settings.colorblindType})`);
    }
    return parts.length > 0 ? parts.join(" ") : "none";
  }, [settings, activeMode]);

  return useMemo(
    () => ({
      sessionPhase,
      activeMode,
      activePreset,
      targetUrl,
      settings,
      cssFilter,
      openModeSelect,
      selectMode,
      switchMode,
      updateSettings,
      resetModeSettings,
      exitModeSelect,
      exitViewer,
    }),
    [
      sessionPhase,
      activeMode,
      activePreset,
      targetUrl,
      settings,
      cssFilter,
      openModeSelect,
      selectMode,
      switchMode,
      updateSettings,
      resetModeSettings,
      exitModeSelect,
      exitViewer,
    ]
  );
}
