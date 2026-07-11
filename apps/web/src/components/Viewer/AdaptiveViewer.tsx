import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import type { CSSProperties } from "react";
import type { useAdaptiveSession } from "../../hooks/useAdaptiveSession";
import { ViewerToolbar } from "./ViewerToolbar";
// import { VoiceControlPanel } from "./VoiceControlPanel";
// import { useVoiceControlAgent } from "../../voice/useVoiceControlAgent";

type AdaptiveViewerProps = {
  session: ReturnType<typeof useAdaptiveSession>;
};

export function AdaptiveViewer({ session }: AdaptiveViewerProps) {
  const { settings, activeMode, activePreset } = session;
  const targetUrl = useMemo(() => normalizeViewerUrl(session.targetUrl), [session.targetUrl]);
  const iframeUrl = useMemo(() => buildIframeUrl(targetUrl), [targetUrl]);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [iframeError, setIframeError] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const speechNoticeRef = useRef("");
  // const voiceAgent = useVoiceControlAgent({ iframeRef, session });

  const [simplifyState, setSimplifyState] = useState({
    loading: false,
    error: null as string | null,
    summary: "",
    primaryActions: [] as string[],
  });
  const needsPointerTracking = Boolean(
    settings.readingGuide ||
    settings.readingRuler ||
    settings.readAlong ||
    settings.focusMask ||
    settings.highlightActiveParagraph ||
    settings.magnifier ||
    (settings.cursorSize ?? 100) > 120
  );

  const lastMousePos = useRef({ x: 0, y: 0 });
  const targetMousePos = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const smoothedMousePos = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const rafIdRef = useRef<number | null>(null);

  const writePointerVars = useCallback((x: number, y: number) => {
    document.documentElement.style.setProperty("--mouse-x", `${x}px`);
    document.documentElement.style.setProperty("--mouse-y", `${y}px`);
    document.documentElement.style.setProperty("--focus-x", `${x}px`);
    document.documentElement.style.setProperty("--focus-y", `${y}px`);
    document.documentElement.style.setProperty("--mouse-transform", `translate3d(${x}px, ${y}px, 0)`);
    document.documentElement.style.setProperty("--lens-transform", `translate3d(${x}px, ${y}px, 0) translate3d(-50%, -50%, 0)`);
    document.documentElement.style.setProperty("--cursor-transform", `translate3d(${x}px, ${y}px, 0) translate3d(4px, 4px, 0)`);
    document.documentElement.style.setProperty("--focus-transform", `translate3d(${x}px, ${y}px, 0) translate3d(-50%, -50%, 0)`);
    document.documentElement.style.setProperty("--guide-top", `${y}px`);
  }, []);

  const scheduleUpdate = useCallback((x: number, y: number) => {
    targetMousePos.current = { x, y };
    if (rafIdRef.current === null) {
      const animate = () => {
        const current = smoothedMousePos.current;
        const target = targetMousePos.current;
        const nextX = current.x + (target.x - current.x) * 0.44;
        const nextY = current.y + (target.y - current.y) * 0.44;
        smoothedMousePos.current = { x: nextX, y: nextY };
        lastMousePos.current = { x: nextX, y: nextY };
        writePointerVars(nextX, nextY);

        if (Math.abs(target.x - nextX) < 0.35 && Math.abs(target.y - nextY) < 0.35) {
          smoothedMousePos.current = target;
          lastMousePos.current = target;
          writePointerVars(target.x, target.y);
          rafIdRef.current = null;
          return;
        }

        rafIdRef.current = window.requestAnimationFrame(animate);
      };
      rafIdRef.current = window.requestAnimationFrame(animate);
    }
  }, [writePointerVars]);

  // Mouse tracking for the spotlight / reading guide overlays.
  useEffect(() => {
    const handleWindowMouseMove = (e: MouseEvent) => {
      scheduleUpdate(e.clientX, e.clientY);
    };

    if (needsPointerTracking) {
      window.addEventListener("mousemove", handleWindowMouseMove, { passive: true });
    }

    return () => {
      window.removeEventListener("mousemove", handleWindowMouseMove);
      if (rafIdRef.current !== null) {
        window.cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [needsPointerTracking, scheduleUpdate]);

  const getVisiblePageText = useCallback(() => {
    try {
      const text = iframeRef.current?.contentDocument?.body?.innerText || "";
      return text.trim().slice(0, 12000);
    } catch {
      return "";
    }
  }, []);

  const simplifyCurrentPage = useCallback(async () => {
    if (settings.cognitiveFixed) {
      session.updateSettings({ cognitiveFixed: false });
      setSimplifyState((prev) => ({ ...prev, error: null }));
      return;
    }

    const pageText = getVisiblePageText();
    if (pageText.length < 20) {
      setSimplifyState(buildClientSideSimplifyFallback(targetUrl));
      session.updateSettings({ cognitiveFixed: true });
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 3500);
    setSimplifyState({ loading: true, error: null, summary: "", primaryActions: [] });

    try {
      const response = await fetch("/api/simplify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Saralo-Session": window.sessionStorage.getItem("saralo-session-id") || "browser-session",
        },
        signal: controller.signal,
        body: JSON.stringify({ url: targetUrl, pageText }),
      });
      const contentType = response.headers.get("content-type") || "";
      if (!response.ok || !contentType.includes("application/json")) {
        throw new Error("simplify_unavailable");
      }
      const data = await response.json() as {
        ok?: boolean;
        summary?: string;
        primaryActions?: string[];
        error?: string;
      };
      if (!response.ok || data.ok === false || data.error) {
        throw new Error(data.error || "simplify_failed");
      }
      setSimplifyState({
        loading: false,
        error: null,
        summary: data.summary || "",
        primaryActions: Array.isArray(data.primaryActions) ? data.primaryActions : [],
      });
      session.updateSettings({ cognitiveFixed: true });
    } catch {
      setSimplifyState(buildClientSideSimplifyFallback(targetUrl));
      session.updateSettings({ cognitiveFixed: true });
    } finally {
      window.clearTimeout(timeout);
    }
  }, [getVisiblePageText, session, settings.cognitiveFixed, targetUrl]);

  // Reset loaded state when URL changes
  useEffect(() => {
    setIframeLoaded(false);
    setIframeError(false);
  }, [iframeUrl]);

  useEffect(() => {
    if (iframeLoaded || iframeError) return;
    const timeout = window.setTimeout(() => setIframeError(true), 14000);
    return () => window.clearTimeout(timeout);
  }, [iframeLoaded, iframeError, iframeUrl]);

  useEffect(() => {
    if (!iframeLoaded || typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const notices = [
      settings.screenReader ? "Screen reader is active." : "",
      settings.readAlong ? "Read along is active." : "",
      settings.ocrImageReader ? "Image reader is armed for on demand use." : "",
    ].filter(Boolean);
    const nextNotice = notices.join(" ");
    if (!nextNotice || speechNoticeRef.current === nextNotice) return;
    speechNoticeRef.current = nextNotice;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(`${nextNotice} ${activePreset?.title ?? "Saralo mode"} is applied to ${hostLabel(targetUrl)}.`));
  }, [activePreset?.title, iframeLoaded, settings.ocrImageReader, settings.readAlong, settings.screenReader, targetUrl]);

  useEffect(() => {
    if (!settings.readSelectedText || typeof window === "undefined" || !("speechSynthesis" in window)) return;
    let timeout: number | undefined;
    let lastSelection = "";
    const speakSelection = () => {
      window.clearTimeout(timeout);
      timeout = window.setTimeout(() => {
        const selection = window.getSelection()?.toString().trim() || "";
        if (selection.length < 2 || selection === lastSelection) return;
        lastSelection = selection;
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(new SpeechSynthesisUtterance(selection.slice(0, 600)));
      }, 220);
    };
    document.addEventListener("selectionchange", speakSelection);
    return () => {
      window.clearTimeout(timeout);
      document.removeEventListener("selectionchange", speakSelection);
    };
  }, [settings.readSelectedText]);

  const zoomScale = settings.zoom / 100;
  const isDarkTheme = settings.theme === "dark" || settings.darkMode || settings.darkHighContrastMode || settings.darkComfortMode || settings.calmDarkTheme;
  const isWarmTheme = activeMode === "dyslexia" && settings.warmReadingTheme !== "dark";
  const isLowVision = activeMode === "low-vision";
  const isAstigmatism = activeMode === "astigmatism";
  const hasReadingGuide = Boolean(settings.readingGuide || settings.readingRuler || settings.readAlong);
  const hasContentSimplifier = Boolean(settings.hideSidebar || settings.removeAds || settings.hidePopups || settings.simplifiedLayout);
  const hasChunkGuides = Boolean(settings.chunkParagraphs || settings.syllableHighlight || settings.simplifyLanguage);
  const hasFocusBand = Boolean(settings.highlightActiveParagraph || settings.oneTaskAtATime);
  const showAssistStatus = Boolean(
    settings.screenReader ||
    settings.readSelectedText ||
    settings.ocrImageReader ||
    settings.reduceAnimations ||
    settings.simplifyForms ||
    settings.highlightImportant ||
    settings.dyslexiaFont
  );
  const visualScale = useMemo(() => {
    if (!isLowVision) return zoomScale;
    const textScale = (settings.textSize ?? 190) / 190;
    const buttonScale = (settings.buttonSize ?? 160) / 160;
    const iconScale = (settings.iconSize ?? 145) / 145;
    return clamp(zoomScale * (textScale * 0.5 + buttonScale * 0.3 + iconScale * 0.2), 1.1, 2.05);
  }, [isLowVision, settings.buttonSize, settings.iconSize, settings.textSize, zoomScale]);
  const viewerEffectStyle = useMemo(() => buildViewerEffectStyle(settings), [settings]);
  const modeVariableStyle = useMemo(() => buildModeVariableStyle(settings), [settings]);
  const hasVisibleFrameEffects = activeMode !== "adhd" || settings.theme !== "auto" || settings.brightness !== 100 || settings.contrast !== 100 || settings.warmth > 0;
  const frameFilter = useMemo(() => [
    activeMode === "colorblind" && settings.colorblindType ? `url(#${settings.colorblindType})` : "",
    settings.highContrast ? "contrast(1.4) saturate(1.2)" : "",
    settings.reduceVisualNoise ? "saturate(0.88)" : "",
    settings.hideImages ? "saturate(0.72) contrast(0.96)" : "",
    isAstigmatism && settings.textSharpness ? `contrast(${100 + Math.round((settings.textSharpness ?? 0) * 0.18)}%)` : "",
    settings.contrast && settings.contrast !== 100 ? `contrast(${settings.contrast}%)` : "",
    settings.brightness && settings.brightness !== 100 ? `brightness(${settings.brightness}%)` : "",
    settings.saturation && settings.saturation !== 100 ? `saturate(${settings.saturation}%)` : "",
  ].filter(Boolean).join(" ") || "none", [
    activeMode,
    settings.brightness,
    settings.colorblindType,
    settings.contrast,
    settings.hideImages,
    settings.highContrast,
    settings.reduceVisualNoise,
    settings.saturation,
    settings.textSharpness,
    isAstigmatism,
  ]);
  const frameScalerClassName = useMemo(() => [
    "viewer-frame-scaler",
    Math.abs(visualScale - 1) > 0.01 ? "is-scaled" : "",
    frameFilter !== "none" ? "is-filtered" : "",
  ].filter(Boolean).join(" "), [frameFilter, visualScale]);
  const frameScalerStyle = useMemo(() => ({
    transform: `scale(${visualScale})`,
    transformOrigin: "top left",
    width: `${100 / visualScale}%`,
    height: `${100 / visualScale}%`,
    filter: frameFilter,
  }) as CSSProperties, [frameFilter, visualScale]);
  const effectClasses = useMemo(() => [
    "viewer-mode-effects",
    activeMode ? `viewer-mode-effects--${activeMode}` : "",
    isDarkTheme ? "is-dark-theme" : "",
    isWarmTheme ? "is-warm-theme" : "",
    settings.highContrast ? "is-high-contrast" : "",
    settings.reduceVisualNoise || settings.removeAds || settings.hidePopups || settings.simplifiedLayout ? "is-calm-layer" : "",
    settings.patternOverlay ? "has-pattern-overlay" : "",
    settings.colorLabels ? "has-color-labels" : "",
    settings.colorblindType ? `is-colorblind-${settings.colorblindType}` : "",
  ].filter(Boolean).join(" "), [
    activeMode,
    isDarkTheme,
    isWarmTheme,
    settings.colorLabels,
    settings.colorblindType,
    settings.dyslexiaFont,
    settings.highContrast,
    settings.hidePopups,
    settings.patternOverlay,
    settings.reduceVisualNoise,
    settings.removeAds,
    settings.simplifiedLayout,
    settings.simplifyForms,
    settings.highlightImportant,
  ]);
  const showLoading = !iframeLoaded && !iframeError;

  return (
    <div
      className="adaptive-viewer"
      ref={containerRef}
      style={modeVariableStyle}
    >
      {/* Toolbar */}
      <ViewerToolbar
        session={session}
        simplifyState={simplifyState}
        onToggleCognitiveReader={simplifyCurrentPage}
      />

      {/* Loading state */}
      {showLoading && (
        <div className="viewer-loading">
          <div className="viewer-loading__spinner" />
          <p>Loading website...</p>
          <p className="viewer-loading__mode">
            Applying <strong>{activePreset?.title}</strong>
          </p>
        </div>
      )}

      {iframeError && (
        <div className="viewer-error" role="alert">
          <h2>Website could not be loaded</h2>
          <p>
            This website may block embedded viewing. Saralo kept the viewer stable instead of showing a broken
            production API page.
          </p>
          <a href={targetUrl} target="_blank" rel="noreferrer">
            Open original site in new tab
          </a>
        </div>
      )}

      {/* Direct external iframe. Mode effects stay outside the cross-origin page. */}
      <div
        className="viewer-frame-container"
        style={{
          opacity: iframeError ? 0.35 : 1,
        }}
      >
        <div
          className={frameScalerClassName}
          style={frameScalerStyle}
        >
          <iframe
            key={iframeUrl}
            className="viewer-iframe"
            src={iframeUrl}
            title={`Adapted view of ${targetUrl}`}
            onLoad={() => {
              setIframeLoaded(true);
              setIframeError(false);
            }}
            onError={() => setIframeError(true)}
            allow="clipboard-read; clipboard-write; fullscreen; geolocation; microphone"
            loading="eager"
            referrerPolicy="strict-origin-when-cross-origin"
            ref={iframeRef}
          />
        </div>
      </div>

      {iframeLoaded && hasVisibleFrameEffects && (
        <div
          className={effectClasses}
          style={viewerEffectStyle}
          aria-hidden="true"
        />
      )}

      {hasContentSimplifier && iframeLoaded && (
        <div
          className={[
            "viewer-content-simplifier",
            settings.hideSidebar ? "hide-sidebars" : "",
            settings.removeAds ? "hide-ads" : "",
            settings.hidePopups ? "hide-popups" : "",
            settings.simplifiedLayout ? "simplified-layout" : "",
          ].filter(Boolean).join(" ")}
          aria-hidden="true"
        />
      )}

      {hasChunkGuides && iframeLoaded && (
        <div
          className={[
            "viewer-chunk-guides",
            settings.syllableHighlight ? "has-syllables" : "",
            settings.simplifyLanguage ? "has-simple-language" : "",
          ].filter(Boolean).join(" ")}
          aria-hidden="true"
        />
      )}

      {hasFocusBand && iframeLoaded && (
        <div className="viewer-active-paragraph-band" aria-hidden="true" />
      )}

      {settings.patternOverlay && iframeLoaded && (
        <div className="viewer-pattern-overlay" aria-hidden="true" />
      )}

      {settings.colorLabels && iframeLoaded && (
        <div className="viewer-color-label-strip" aria-hidden="true">
          <span>Red</span>
          <span>Green</span>
          <span>Blue</span>
          <span>Yellow</span>
        </div>
      )}

      {showAssistStatus && iframeLoaded && (
        <div className="viewer-assist-status" aria-live="polite">
          {settings.screenReader && <span>Screen reader ready</span>}
          {settings.readSelectedText && <span>Selected text reader armed</span>}
          {settings.ocrImageReader && <span>Image reader on demand</span>}
          {settings.reduceAnimations && <span>Motion reduced</span>}
          {settings.dyslexiaFont && <span>Dyslexia reading aids active</span>}
          {settings.simplifyForms && <span>Form focus enhanced</span>}
          {settings.highlightImportant && <span>Important info highlighted</span>}
        </div>
      )}

      {settings.magnifier && iframeLoaded && (
        <div className="viewer-magnifier-lens" aria-hidden="true" />
      )}

      {(settings.cursorSize ?? 100) > 120 && iframeLoaded && (
        <div
          className="viewer-large-cursor"
          style={{ "--saralo-cursor-scale": String((settings.cursorSize ?? 160) / 160) } as CSSProperties}
          aria-hidden="true"
        />
      )}

      {/* Reading Guide Overlay — uses CSS custom property --guide-top for GPU-friendly positioning */}
      {hasReadingGuide && iframeLoaded && (
        <div className="reading-guide-overlay" aria-hidden="true">
          <div className="reading-guide-dim reading-guide-dim--top" />
          <div className={settings.readAlong ? "reading-guide-bar is-read-along" : "reading-guide-bar"} />
          <div className="reading-guide-dim reading-guide-dim--bottom" />
        </div>
      )}

      {/* ADHD Focus Mask — uses CSS custom properties --focus-x / --focus-y for GPU-accelerated transform */}
      {settings.focusMask && iframeLoaded && (
        <div className="focus-mask-overlay" aria-hidden="true">
          <div className="focus-mask-spotlight" />
        </div>
      )}

      {/* SVG Color Blindness Matrices */}
      <svg style={{ position: "absolute", width: 0, height: 0 }} aria-hidden="true">
        <defs>
          <filter id="protanopia">
            <feColorMatrix
              type="matrix"
              values="0.567, 0.433, 0,     0, 0
                      0.558, 0.442, 0,     0, 0
                      0,     0.242, 0.758, 0, 0
                      0,     0,     0,     1, 0"
            />
          </filter>
          <filter id="deuteranopia">
            <feColorMatrix
              type="matrix"
              values="0.625, 0.375, 0,     0, 0
                      0.7,   0.3,   0,     0, 0
                      0,     0.3,   0.7,   0, 0
                      0,     0,     0,     1, 0"
            />
          </filter>
          <filter id="tritanopia">
            <feColorMatrix
              type="matrix"
              values="0.95,  0.05,  0,     0, 0
                      0,     0.433, 0.567, 0, 0
                      0,     0.475, 0.525, 0, 0
                      0,     0,     0,     1, 0"
            />
          </filter>
          <filter id="achromatopsia">
            <feColorMatrix
              type="matrix"
              values="0.299, 0.587, 0.114, 0, 0
                      0.299, 0.587, 0.114, 0, 0
                      0.299, 0.587, 0.114, 0, 0
                      0,     0,     0,     1, 0"
            />
          </filter>
        </defs>
      </svg>
    </div>
  );
}

function normalizeViewerUrl(value: string) {
  if (!value) return value;
  try {
    const base = globalThis.location?.origin || "https://saralo.local";
    const parsed = new URL(value, base);
    if (parsed.pathname === "/api/proxy") {
      const originalUrl = parsed.searchParams.get("url");
      if (originalUrl) return originalUrl;
    }
  } catch {
    return value;
  }
  return value;
}

function buildIframeUrl(normalizedOriginalUrl: string) {
  return normalizedOriginalUrl;
}

function buildClientSideSimplifyFallback(targetUrl: string) {
  const siteLabel = hostLabel(targetUrl);

  return {
    loading: false,
    error: null,
    summary: `Saralo is using production-safe accessibility effects for ${siteLabel}. API simplification is unavailable here, so the page stays visible with local clarity, contrast, focus and reading supports.`,
    primaryActions: [
      "Use Settings to adjust text size, brightness, contrast and focus aids.",
      "Switch modes from the top dropdown without reloading the website.",
      "Open the original site if the browser blocks embedded viewing.",
    ],
  };
}

function hostLabel(targetUrl: string) {
  try {
    return new URL(targetUrl).hostname.replace(/^www\./, "");
  } catch {
    return "this website";
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function buildViewerEffectStyle(settings: AdaptiveViewerProps["session"]["settings"]): CSSProperties {
  const brightness = settings.brightness ?? 100;
  const contrast = settings.highContrast
    ? Math.max(settings.contrast ?? 100, 135)
    : Math.max(settings.contrast ?? 100, settings.contrastBoost ?? 100);
  const warmth = settings.warmth ?? 0;
  const saturation = settings.saturation ?? 100;
  const antiGlare = settings.antiGlare ?? 0;
  const sharpness = settings.textSharpness ?? 0;

  return {
    "--saralo-brighten": String(clamp((brightness - 100) / 120, 0, 0.34)),
    "--saralo-dim": String(clamp((100 - brightness) / 140, 0, 0.42)),
    "--saralo-contrast": String(clamp((contrast - 100) / 140, 0, 0.44)),
    "--saralo-contrast-light": String(clamp((contrast - 100) / 900, 0, 0.08)),
    "--saralo-contrast-edge": String(clamp((contrast - 100) / 320, 0, 0.42)),
    "--saralo-desaturate": String(clamp((100 - saturation) / 160, 0, 0.32)),
    "--saralo-warmth": String(clamp(warmth / 140, 0, 0.36)),
    "--saralo-antiglare": String(clamp(antiGlare / 180, 0, 0.48)),
    "--saralo-sharpness": String(clamp(sharpness / 160, 0, 0.36)),
  } as CSSProperties;
}

function buildModeVariableStyle(settings: AdaptiveViewerProps["session"]["settings"]): CSSProperties {
  const textSize = settings.textSize ?? 160;
  const buttonSize = settings.buttonSize ?? 140;
  const iconSize = settings.iconSize ?? 135;
  const letterSpacing = settings.spacing ?? 50;
  const wordSpacing = settings.wordSpacing ?? 110;
  const lineHeight = settings.lineHeight ?? 160;
  const readingWidth = settings.readingWidth ?? 850;
  const fontThickness = settings.fontThickness ?? 650;
  const contrastBoost = settings.contrastBoost ?? 115;

  return {
    "--saralo-text-scale": String(clamp(textSize / 160, 0.9, 1.45)),
    "--saralo-button-scale": String(clamp(buttonSize / 150, 0.8, 1.45)),
    "--saralo-icon-scale": String(clamp(iconSize / 140, 0.8, 1.5)),
    "--saralo-letter-guide": `${clamp((letterSpacing - 50) / 120, 0, 0.92)}`,
    "--saralo-word-guide": `${clamp((wordSpacing - 100) / 130, 0, 0.75)}`,
    "--saralo-line-guide": `${clamp(lineHeight / 100, 1.2, 2.2)}`,
    "--saralo-reading-width": `${readingWidth}px`,
    "--saralo-font-weight-boost": String(clamp((fontThickness - 500) / 300, 0, 1)),
    "--saralo-color-contrast-boost": String(clamp((contrastBoost - 100) / 80, 0, 0.75)),
  } as CSSProperties;
}
