import { useState, useEffect, useRef, useCallback, type CSSProperties, type ReactNode } from "react";
import {
  ArrowLeft,
  ChevronDown,
  Contrast,
  Eye,
  Focus,
  MousePointer2,
  PanelRightClose,
  RotateCcw,
  Ruler,
  ScanText,
  Settings,
  Sparkles,
  Sun,
  Type,
  Volume2,
  ZoomIn,
} from "lucide-react";
import {
  modePresets,
  type AccessibilityModeId,
  type ViewerSettings,
  type useAdaptiveSession,
} from "../../hooks/useAdaptiveSession";
import { logoUrl } from "../../data/content";

type ViewerToolbarProps = {
  session: ReturnType<typeof useAdaptiveSession>;
  simplifyState?: {
    loading: boolean;
    error: string | null;
    summary: string;
    primaryActions: string[];
  };
  onToggleCognitiveReader?: () => void;
};

type SliderKey = {
  [K in keyof ViewerSettings]-?: NonNullable<ViewerSettings[K]> extends number ? K : never;
}[keyof ViewerSettings];

type ToggleKey = {
  [K in keyof ViewerSettings]-?: NonNullable<ViewerSettings[K]> extends boolean ? K : never;
}[keyof ViewerSettings];

type SelectKey = {
  [K in keyof ViewerSettings]-?: NonNullable<ViewerSettings[K]> extends string ? K : never;
}[keyof ViewerSettings];

export function ViewerToolbar({ session, simplifyState, onToggleCognitiveReader }: ViewerToolbarProps) {
  const {
    activePreset,
    targetUrl,
    settings,
    updateSettings,
    resetModeSettings,
    switchMode,
    exitViewer,
  } = session;

  const [showSettings, setShowSettings] = useState(false);
  const [showModeSwitch, setShowModeSwitch] = useState(false);
  const activeMode = session.activeMode;
  const toolbarRef = useRef<HTMLDivElement>(null);

  const resetMode = useCallback(() => {
    resetModeSettings();
  }, [resetModeSettings]);

  // Close all dropdowns on click outside
  useEffect(() => {
    if (!showSettings && !showModeSwitch) return;
    const handlePointerDown = (e: PointerEvent) => {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target as Node)) {
        setShowSettings(false);
        setShowModeSwitch(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowSettings(false);
        setShowModeSwitch(false);
      }
    };
    window.addEventListener("pointerdown", handlePointerDown, { passive: true });
    window.addEventListener("keydown", handleKeyDown, { passive: true });
    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [showSettings, showModeSwitch]);

  return (
    <div className="viewer-toolbar" ref={toolbarRef}>
      <div className="viewer-toolbar__inner">
        <div className="viewer-toolbar__left">
          <button
            className="viewer-toolbar__exit"
            onClick={exitViewer}
            type="button"
            aria-label="Exit viewer and return to Saralo"
          >
            <ArrowLeft size={18} />
            <span>Exit</span>
          </button>
          <img className="viewer-toolbar__logo" src={logoUrl} alt="Saralo" />
        </div>

        <div className="viewer-toolbar__center">
          <span className="viewer-toolbar__url" title={targetUrl}>
            {targetUrl}
          </span>

          <div className="viewer-toolbar__mode-wrap">
            <button
              className="viewer-toolbar__mode-btn"
              onClick={() => {
                setShowModeSwitch(!showModeSwitch);
                setShowSettings(false);
              }}
              type="button"
              aria-label="Switch accessibility mode"
              aria-haspopup="menu"
              aria-expanded={showModeSwitch}
              style={{ "--mode-glow": activePreset?.glow } as CSSProperties}
            >
              <span
                className="viewer-toolbar__mode-dot"
                style={{ background: activePreset?.glow }}
              />
              {activePreset?.title}
              <ChevronDown size={14} />
            </button>

            {showModeSwitch && (
              <div className="viewer-toolbar__dropdown" role="menu" aria-label="Accessibility modes">
                {modePresets.map((mode) => (
                  <button
                    key={mode.id}
                    className={`viewer-toolbar__dropdown-item ${
                      mode.id === session.activeMode ? "is-active" : ""
                    }`}
                    onClick={() => {
                      switchMode(mode.id as AccessibilityModeId);
                      setShowModeSwitch(false);
                    }}
                    type="button"
                    role="menuitem"
                    aria-current={mode.id === session.activeMode ? "true" : undefined}
                  >
                    <span
                      className="viewer-toolbar__mode-dot"
                      style={{ background: mode.glow }}
                    />
                    {mode.title}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="viewer-toolbar__right">
          <button
            className={`viewer-toolbar__settings-btn ${showSettings ? "is-active" : ""}`}
            onClick={() => {
              setShowSettings(!showSettings);
              setShowModeSwitch(false);
            }}
            type="button"
            aria-label="Adjust viewer settings"
            aria-expanded={showSettings}
          >
            <Settings size={16} />
            Settings
          </button>
        </div>
      </div>

      {showSettings && (
        <div className="viewer-settings-panel" data-mode={activeMode ?? "none"}>
          <SettingsSection title="General">
            <SliderControl
              icon={<Sun size={16} />}
              label="Brightness"
              settingKey="brightness"
              min={50}
              max={150}
              value={settings.brightness}
              unit="%"
              updateSettings={updateSettings}
            />
            <SelectControl
              icon={<Eye size={16} />}
              label="Theme"
              settingKey="theme"
              value={settings.theme}
              options={[
                ["light", "Light"],
                ["dark", "Dark"],
                ["auto", "Auto"],
              ]}
              updateSettings={updateSettings}
            />
            <button className="viewer-reset-mode" type="button" onClick={resetMode}>
              <RotateCcw size={16} />
              Reset Mode
            </button>
          </SettingsSection>

          <div className="viewer-mode-settings" key={activeMode}>
            {activeMode === "adhd" && (
              <SettingsSection title="ADHD">
                <ToggleControl icon={<Focus size={16} />} label="Focus Mask" settingKey="focusMask" value={settings.focusMask} updateSettings={updateSettings} />
                <ToggleControl icon={<Ruler size={16} />} label="Reading Guide" settingKey="readingGuide" value={settings.readingGuide} updateSettings={updateSettings} />
                <ToggleControl icon={<PanelRightClose size={16} />} label="Hide Sidebar" settingKey="hideSidebar" value={settings.hideSidebar} updateSettings={updateSettings} />
                <ToggleControl icon={<Eye size={16} />} label="Hide Images" settingKey="hideImages" value={settings.hideImages} updateSettings={updateSettings} />
                <ToggleControl icon={<Sparkles size={16} />} label="Reduce Animations" settingKey="reduceAnimations" value={settings.reduceAnimations} updateSettings={updateSettings} />
                <ToggleControl icon={<ScanText size={16} />} label="Chunk Paragraphs" settingKey="chunkParagraphs" value={settings.chunkParagraphs} updateSettings={updateSettings} />
                <ToggleControl icon={<Type size={16} />} label="Highlight Active Paragraph" settingKey="highlightActiveParagraph" value={settings.highlightActiveParagraph} updateSettings={updateSettings} />
              </SettingsSection>
            )}

            {activeMode === "dyslexia" && (
              <SettingsSection title="Dyslexia">
                <ToggleControl icon={<Type size={16} />} label="Dyslexia Font" settingKey="dyslexiaFont" value={settings.dyslexiaFont} updateSettings={updateSettings} />
                <SliderControl icon={<Ruler size={16} />} label="Letter Spacing" settingKey="spacing" min={50} max={160} value={settings.spacing} unit="%" updateSettings={updateSettings} />
                <SliderControl icon={<Ruler size={16} />} label="Word Spacing" settingKey="wordSpacing" min={80} max={180} value={settings.wordSpacing ?? 110} unit="%" updateSettings={updateSettings} />
                <SliderControl icon={<Ruler size={16} />} label="Line Height" settingKey="lineHeight" min={120} max={220} value={settings.lineHeight ?? 170} unit="%" updateSettings={updateSettings} />
                <ToggleControl icon={<Ruler size={16} />} label="Reading Ruler" settingKey="readingRuler" value={settings.readingRuler} updateSettings={updateSettings} />
                <ToggleControl icon={<ScanText size={16} />} label="Syllable Highlight" settingKey="syllableHighlight" value={settings.syllableHighlight} updateSettings={updateSettings} />
                <ToggleControl icon={<Volume2 size={16} />} label="Read Along" settingKey="readAlong" value={settings.readAlong} updateSettings={updateSettings} />
                <SelectControl icon={<Sun size={16} />} label="Warm Reading Theme" settingKey="warmReadingTheme" value={settings.warmReadingTheme ?? "light"} options={[["dark", "Dark"], ["light", "Light"]]} updateSettings={updateSettings} />
              </SettingsSection>
            )}

            {activeMode === "astigmatism" && (
              <SettingsSection title="Astigmatism">
                <SliderControl icon={<Contrast size={16} />} label="Contrast" settingKey="contrast" min={70} max={140} value={settings.contrast} unit="%" updateSettings={updateSettings} />
                <SliderControl icon={<Sun size={16} />} label="Warmth" settingKey="warmth" min={0} max={80} value={settings.warmth} unit="%" updateSettings={updateSettings} />
                <SliderControl icon={<Type size={16} />} label="Font Thickness" settingKey="fontThickness" min={500} max={800} value={settings.fontThickness ?? 650} updateSettings={updateSettings} />
                <SliderControl icon={<Ruler size={16} />} label="Reading Width" settingKey="readingWidth" min={720} max={1100} value={settings.readingWidth ?? 850} unit="px" updateSettings={updateSettings} />
                <SliderControl icon={<Eye size={16} />} label="Anti-Glare" settingKey="antiGlare" min={0} max={100} value={settings.antiGlare ?? 60} unit="%" updateSettings={updateSettings} />
                <SliderControl icon={<Sparkles size={16} />} label="Text Sharpness" settingKey="textSharpness" min={0} max={100} value={settings.textSharpness ?? 65} unit="%" updateSettings={updateSettings} />
                <ToggleControl icon={<Eye size={16} />} label="Reduce Visual Noise" settingKey="reduceVisualNoise" value={settings.reduceVisualNoise} updateSettings={updateSettings} />
              </SettingsSection>
            )}

            {activeMode === "low-vision" && (
              <SettingsSection title="Low Vision">
                <SliderControl icon={<Type size={16} />} label="Text Size" settingKey="textSize" min={180} max={220} value={settings.textSize ?? 190} unit="%" updateSettings={updateSettings} />
                <SliderControl icon={<MousePointer2 size={16} />} label="Button Size" settingKey="buttonSize" min={120} max={220} value={settings.buttonSize ?? 160} unit="%" updateSettings={updateSettings} />
                <SliderControl icon={<Eye size={16} />} label="Icon Size" settingKey="iconSize" min={120} max={220} value={settings.iconSize ?? 145} unit="%" updateSettings={updateSettings} />
                <SliderControl icon={<MousePointer2 size={16} />} label="Cursor Size" settingKey="cursorSize" min={120} max={220} value={settings.cursorSize ?? 180} unit="%" updateSettings={updateSettings} />
                <ToggleControl icon={<ZoomIn size={16} />} label="Magnifier" settingKey="magnifier" value={settings.magnifier} updateSettings={updateSettings} />
                <ToggleControl icon={<Contrast size={16} />} label="High Contrast" settingKey="highContrast" value={settings.highContrast} updateSettings={updateSettings} />
                <ToggleControl icon={<Volume2 size={16} />} label="Screen Reader" settingKey="screenReader" value={settings.screenReader} updateSettings={updateSettings} />
                <ToggleControl icon={<ScanText size={16} />} label="Read Selected Text" settingKey="readSelectedText" value={settings.readSelectedText} updateSettings={updateSettings} />
                <ToggleControl icon={<Eye size={16} />} label="OCR Image Reader (On Demand)" settingKey="ocrImageReader" value={settings.ocrImageReader} updateSettings={updateSettings} />
                <ToggleControl icon={<PanelRightClose size={16} />} label="Simplified Layout" settingKey="simplifiedLayout" value={settings.simplifiedLayout} updateSettings={updateSettings} />
                <SliderControl icon={<ZoomIn size={16} />} label="Zoom" settingKey="zoom" min={120} max={180} value={settings.zoom} unit="%" updateSettings={updateSettings} />
              </SettingsSection>
            )}

            {activeMode === "colorblind" && (
              <SettingsSection title="Color Blindness">
                <SelectControl icon={<Eye size={16} />} label="Color Blind Type" settingKey="colorblindType" value={settings.colorblindType ?? "protanopia"} options={[["protanopia", "Protan"], ["deuteranopia", "Deutan"], ["tritanopia", "Tritan"]]} updateSettings={updateSettings} />
                <SliderControl icon={<Contrast size={16} />} label="Contrast Boost" settingKey="contrastBoost" min={100} max={160} value={settings.contrastBoost ?? 115} unit="%" updateSettings={updateSettings} />
                <ToggleControl icon={<Type size={16} />} label="Color Labels" settingKey="colorLabels" value={settings.colorLabels} updateSettings={updateSettings} />
                <ToggleControl icon={<Sparkles size={16} />} label="Pattern Overlay" settingKey="patternOverlay" value={settings.patternOverlay} updateSettings={updateSettings} />
              </SettingsSection>
            )}

            {activeMode === "cognitive-overload" && (
              <SettingsSection title="Cognitive Overload">
                <ToggleControl icon={<ScanText size={16} />} label="Simplify Language" settingKey="simplifyLanguage" value={settings.simplifyLanguage} updateSettings={updateSettings} />
                <ToggleControl icon={<PanelRightClose size={16} />} label="Remove Ads" settingKey="removeAds" value={settings.removeAds} updateSettings={updateSettings} />
                <ToggleControl icon={<Eye size={16} />} label="Hide Popups" settingKey="hidePopups" value={settings.hidePopups} updateSettings={updateSettings} />
                <ToggleControl icon={<Focus size={16} />} label="One Task at a Time" settingKey="oneTaskAtATime" value={settings.oneTaskAtATime} updateSettings={updateSettings} />
                <ToggleControl icon={<Type size={16} />} label="Simplify Forms" settingKey="simplifyForms" value={settings.simplifyForms} updateSettings={updateSettings} />
                <ToggleControl icon={<Contrast size={16} />} label="Highlight Important Information" settingKey="highlightImportant" value={settings.highlightImportant} updateSettings={updateSettings} />
                {simplifyState?.error && (
                  <p className="viewer-simplify-status" role="alert">
                    {simplifyState.error}
                  </p>
                )}
                {settings.cognitiveFixed && simplifyState?.summary && (
                  <div className="viewer-simplify-summary" aria-live="polite">
                    <strong>Simple summary</strong>
                    <p>{simplifyState.summary}</p>
                    {simplifyState.primaryActions.length > 0 && (
                      <ul>
                        {simplifyState.primaryActions.map((action) => (
                          <li key={action}>{action}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </SettingsSection>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function SettingsSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="viewer-settings-section" aria-label={`${title} settings`}>
      <h3>{title}</h3>
      <div className="viewer-settings-grid">{children}</div>
    </section>
  );
}

function SliderControl({
  icon,
  label,
  settingKey,
  min,
  max,
  value,
  unit = "",
  updateSettings,
}: {
  icon: ReactNode;
  label: string;
  settingKey: SliderKey;
  min: number;
  max: number;
  value: number;
  unit?: string;
  updateSettings: (patch: Partial<ViewerSettings>) => void;
}) {
  return (
    <label className="viewer-setting">
      <span>{icon}{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(event) => updateSettings({ [settingKey]: Number(event.target.value) } as Partial<ViewerSettings>)}
      />
      <span className="viewer-setting__val">{value}{unit}</span>
    </label>
  );
}

function SelectControl({
  icon,
  label,
  settingKey,
  value,
  options,
  updateSettings,
}: {
  icon: ReactNode;
  label: string;
  settingKey: SelectKey;
  value: string;
  options: Array<readonly [string, string]>;
  updateSettings: (patch: Partial<ViewerSettings>) => void;
}) {
  return (
    <label className="viewer-setting viewer-setting--select">
      <span>{icon}{label}</span>
      <select
        value={value}
        onChange={(event) => updateSettings({ [settingKey]: event.target.value } as Partial<ViewerSettings>)}
      >
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>{optionLabel}</option>
        ))}
      </select>
    </label>
  );
}

function ToggleControl({
  icon,
  label,
  settingKey,
  value,
  updateSettings,
}: {
  icon: ReactNode;
  label: string;
  settingKey: ToggleKey;
  value?: boolean;
  updateSettings: (patch: Partial<ViewerSettings>) => void;
}) {
  return (
    <button
      className={`viewer-toggle ${value ? "is-on" : ""}`}
      onClick={() => updateSettings({ [settingKey]: !value } as Partial<ViewerSettings>)}
      type="button"
      aria-pressed={Boolean(value)}
    >
      {icon}
      {label}
      <span>{value ? "ON" : "OFF"}</span>
    </button>
  );
}
