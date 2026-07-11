const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "../..");

test("all visible viewer controls have production-safe effects", () => {
  const toolbar = fs.readFileSync(path.join(root, "apps", "web", "src", "components", "Viewer", "ViewerToolbar.tsx"), "utf8");
  const viewer = fs.readFileSync(path.join(root, "apps", "web", "src", "components", "Viewer", "AdaptiveViewer.tsx"), "utf8");
  const css = fs.readFileSync(path.join(root, "apps", "web", "src", "custom", "custom-ui.css"), "utf8");

  const settingKeys = [...toolbar.matchAll(/settingKey="([^"]+)"/g)].map((match) => match[1]);
  assert.ok(settingKeys.length > 35, "Toolbar should expose the full accessibility control set");

  const requiredViewerHooks = {
    brightness: ["buildViewerEffectStyle", "--saralo-brighten", "brightness("],
    theme: ["is-dark-theme", "isWarmTheme"],
    focusMask: ["focus-mask-overlay", "focus-mask-spotlight"],
    readingGuide: ["reading-guide-overlay", "reading-guide-bar"],
    hideSidebar: ["viewer-content-simplifier", "hide-sidebars"],
    hideImages: ["settings.hideImages", "saturate(0.72)"],
    reduceAnimations: ["viewer-assist-status", "Motion reduced"],
    chunkParagraphs: ["viewer-chunk-guides", "settings.chunkParagraphs"],
    highlightActiveParagraph: ["viewer-active-paragraph-band", "highlightActiveParagraph"],
    dyslexiaFont: ["Dyslexia reading aids active", "settings.dyslexiaFont"],
    spacing: ["--saralo-letter-guide", "buildModeVariableStyle"],
    wordSpacing: ["--saralo-word-guide", "buildModeVariableStyle"],
    lineHeight: ["--saralo-line-guide", "buildModeVariableStyle"],
    readingRuler: ["settings.readingRuler", "reading-guide-overlay"],
    syllableHighlight: ["has-syllables", "syllableHighlight"],
    readAlong: ["Read along is active", "is-read-along"],
    warmReadingTheme: ["isWarmTheme", "warmReadingTheme"],
    contrast: ["contrast(", "--saralo-contrast"],
    warmth: ["--saralo-warmth", "is-warm-theme"],
    fontThickness: ["--saralo-font-weight-boost", "fontThickness"],
    readingWidth: ["--saralo-reading-width", "readingWidth"],
    antiGlare: ["--saralo-antiglare", "antiGlare"],
    textSharpness: ["--saralo-sharpness", "textSharpness"],
    reduceVisualNoise: ["reduceVisualNoise", "saturate(0.88)"],
    textSize: ["--saralo-text-scale", "visualScale"],
    buttonSize: ["--saralo-button-scale", "visualScale"],
    iconSize: ["--saralo-icon-scale", "visualScale"],
    cursorSize: ["viewer-large-cursor", "--saralo-cursor-scale"],
    magnifier: ["viewer-magnifier-lens", "settings.magnifier"],
    highContrast: ["is-high-contrast", "contrast(1.4)"],
    screenReader: ["speechSynthesis", "Screen reader is active"],
    readSelectedText: ["selectionchange", "readSelectedText"],
    ocrImageReader: ["Image reader is armed", "ocrImageReader"],
    simplifiedLayout: ["simplified-layout", "settings.simplifiedLayout"],
    zoom: ["zoomScale", "visualScale"],
    colorblindType: ["url(#${settings.colorblindType})", "feColorMatrix"],
    contrastBoost: ["--saralo-color-contrast-boost", "contrastBoost"],
    colorLabels: ["viewer-color-label-strip", "has-color-labels"],
    patternOverlay: ["viewer-pattern-overlay", "has-pattern-overlay"],
    simplifyLanguage: ["has-simple-language", "simplifyLanguage"],
    removeAds: ["hide-ads", "settings.removeAds"],
    hidePopups: ["hide-popups", "settings.hidePopups"],
    oneTaskAtATime: ["viewer-active-paragraph-band", "oneTaskAtATime"],
    simplifyForms: ["Form focus enhanced", "simplifyForms"],
    highlightImportant: ["Important info highlighted", "highlightImportant"],
  };

  for (const key of settingKeys) {
    const expected = requiredViewerHooks[key];
    assert.ok(expected, `No audit mapping for visible setting ${key}`);
    for (const snippet of expected) {
      assert.ok(viewer.includes(snippet) || css.includes(snippet), `Visible setting ${key} is not wired to ${snippet}`);
    }
  }
});
