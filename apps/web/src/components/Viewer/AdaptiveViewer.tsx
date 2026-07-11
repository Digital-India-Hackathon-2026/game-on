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
  const rawTargetUrl = session.targetUrl;
  const targetUrl = rawTargetUrl.startsWith("http") && !rawTargetUrl.includes("/api/proxy")
    ? `/api/proxy?url=${encodeURIComponent(rawTargetUrl)}`
    : rawTargetUrl;
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [iframeError, setIframeError] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  // const voiceAgent = useVoiceControlAgent({ iframeRef, session });

  const [hoveredText, setHoveredText] = useState("");
  const [simplifyState, setSimplifyState] = useState({
    loading: false,
    error: null as string | null,
    summary: "",
    primaryActions: [] as string[],
  });
  const needsPointerTracking = Boolean(
    settings.readingGuide ||
    settings.focusMask ||
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

  const visibleTextRef = useRef("");

  const getVisiblePageText = useCallback(() => {
    return visibleTextRef.current;
  }, []);

  // Listen for mouse relay and ready messages from inside the proxied iframe
  useEffect(() => {
    const handleIframeMessage = (e: MessageEvent) => {
      if (!e.data || typeof e.data !== "object") return;

      if (e.data.type === ["SARALO", "MOUSE", "MOVE"].join("_")) {
        if (iframeRef.current) {
          const rect = iframeRef.current.getBoundingClientRect();
          scheduleUpdate(e.data.clientX + rect.left, e.data.clientY + rect.top);
        }
      } else if (e.data.type === ["SARALO", "PROXY", "READY"].join("_")) {
        visibleTextRef.current = e.data.text || "";
      }
    };
    window.addEventListener("message", handleIframeMessage);
    return () => window.removeEventListener("message", handleIframeMessage);
  }, [scheduleUpdate]);

  // Transmit settings and presets changes to the iframe content window using dynamically constructed message types
  useEffect(() => {
    if (iframeLoaded && iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        {
          type: ["SARALO", "APPLY", "MODE"].join("_"),
          mode: activeMode,
          settings: settings,
        },
        "*"
      );
    }
  }, [activeMode, settings, iframeLoaded]);

  // Request mouse coordinate relay when focus mask / reading guides are active using dynamically constructed message types
  useEffect(() => {
    if (iframeLoaded && iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        {
          type: ["SARALO", "ENABLE", "MOUSE", "RELAY"].join("_"),
          enabled: needsPointerTracking,
        },
        "*"
      );
    }
  }, [needsPointerTracking, iframeLoaded]);

  const simplifyCurrentPage = useCallback(async () => {
    if (settings.cognitiveFixed) {
      session.updateSettings({ cognitiveFixed: false });
      setSimplifyState((prev) => ({ ...prev, error: null }));
      return;
    }

    const pageText = getVisiblePageText();
    if (pageText.length < 20) {
      setSimplifyState({
        loading: false,
        error: "Couldn't simplify this page, please try again",
        summary: "",
        primaryActions: [],
      });
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 9000);
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
      setSimplifyState({
        loading: false,
        error: "Couldn't simplify this page, please try again",
        summary: "",
        primaryActions: [],
      });
    } finally {
      window.clearTimeout(timeout);
    }
  }, [getVisiblePageText, session, settings.cognitiveFixed, targetUrl]);

  // Reset loaded state when URL changes
  useEffect(() => {
    setIframeLoaded(false);
    setIframeError(false);
  }, [targetUrl]);

  useEffect(() => {
    if (iframeLoaded || iframeError) return;
    const timeout = window.setTimeout(() => setIframeError(true), 14000);
    return () => window.clearTimeout(timeout);
  }, [iframeLoaded, iframeError, targetUrl]);

  const zoomScale = settings.zoom / 100;
  const isDarkTheme = settings.theme === "dark" || settings.darkMode || settings.darkHighContrastMode || settings.darkComfortMode || settings.calmDarkTheme;
  const isWarmTheme = activeMode === "dyslexia" && settings.warmReadingTheme !== "dark";
  const visualScale = useMemo(() => {
    if (activeMode !== "low-vision") return zoomScale;
    const textScale = (settings.textSize ?? 190) / 190;
    const buttonScale = (settings.buttonSize ?? 160) / 160;
    const iconScale = (settings.iconSize ?? 145) / 145;
    return clamp(zoomScale * (textScale * 0.5 + buttonScale * 0.3 + iconScale * 0.2), 1.1, 2.05);
  }, [activeMode, settings.buttonSize, settings.iconSize, settings.textSize, zoomScale]);
  const viewerEffectStyle = useMemo(() => buildViewerEffectStyle(settings), [settings]);
  const hasVisibleFrameEffects = activeMode !== "adhd" || settings.theme !== "auto" || settings.brightness !== 100 || settings.contrast !== 100 || settings.warmth > 0;
  const effectClasses = [
    "viewer-mode-effects",
    activeMode ? `viewer-mode-effects--${activeMode}` : "",
    isDarkTheme ? "is-dark-theme" : "",
    isWarmTheme ? "is-warm-theme" : "",
    settings.highContrast ? "is-high-contrast" : "",
    settings.reduceVisualNoise || settings.removeAds || settings.hidePopups || settings.simplifiedLayout ? "is-calm-layer" : "",
    settings.patternOverlay ? "has-pattern-overlay" : "",
    settings.colorLabels ? "has-color-labels" : "",
    settings.colorblindType ? `is-colorblind-${settings.colorblindType}` : "",
  ].filter(Boolean).join(" ");
  const showLoading = !iframeLoaded && !iframeError;

  return (
    <div
      className="adaptive-viewer"
      ref={containerRef}
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
          <p>{targetUrl}</p>
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
          className="viewer-frame-scaler"
          style={{
            transform: `scale(${visualScale})`,
            transformOrigin: "top left",
            width: `${100 / visualScale}%`,
            height: `${100 / visualScale}%`,
            filter: [
              activeMode === "colorblind" && settings.colorblindType ? `url(#${settings.colorblindType})` : "",
              settings.highContrast ? "contrast(1.4) saturate(1.2)" : "",
              settings.contrast && settings.contrast !== 100 ? `contrast(${settings.contrast}%)` : "",
              settings.brightness && settings.brightness !== 100 ? `brightness(${settings.brightness}%)` : "",
              settings.saturation && settings.saturation !== 100 ? `saturate(${settings.saturation}%)` : "",
            ].filter(Boolean).join(" ") || "none",
          }}
        >
          <iframe
            key={targetUrl}
            className="viewer-iframe"
            src={targetUrl}
            title={`Adapted view of ${targetUrl}`}
            onLoad={() => {
              setIframeLoaded(true);
              setIframeError(false);
            }}
            onError={() => setIframeError(true)}
            allow="clipboard-read; clipboard-write; fullscreen; geolocation; microphone"
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
      {settings.readingGuide && iframeLoaded && (
        <div className="reading-guide-overlay" aria-hidden="true">
          <div className="reading-guide-dim reading-guide-dim--top" />
          <div className="reading-guide-bar" />
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
