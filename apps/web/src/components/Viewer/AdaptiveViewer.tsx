import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import type { useAdaptiveSession } from "../../hooks/useAdaptiveSession";
import { ViewerToolbar } from "./ViewerToolbar";
import { VoiceControlPanel } from "./VoiceControlPanel";
import { useVoiceControlAgent } from "../../voice/useVoiceControlAgent";

type AdaptiveViewerProps = {
  session: ReturnType<typeof useAdaptiveSession>;
};

export function AdaptiveViewer({ session }: AdaptiveViewerProps) {
  const { targetUrl, settings, cssFilter, activePreset, activeMode } = session;
  const [iframeLoaded, setIframeLoaded] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const voiceAgent = useVoiceControlAgent(iframeRef);

  const [hoveredText, setHoveredText] = useState("");
  const [proxiedPageText, setProxiedPageText] = useState("");
  const [simplifyState, setSimplifyState] = useState({
    loading: false,
    error: null as string | null,
    summary: "",
    primaryActions: [] as string[],
  });
  const settingsPayload = useMemo(() => JSON.stringify(settings), [settings]);
  const applyModeToIframe = useCallback(() => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    win.postMessage(
      {
        type: "SARALO_APPLY_MODE",
        mode: activeMode,
        settings,
        colorblindType: settings.colorblindType,
        cognitiveFixed: settings.cognitiveFixed,
      },
      "*"
    );
  }, [activeMode, settings]);

  useEffect(() => {
    const handleProxyReady = (event: MessageEvent) => {
      if (event.data?.type === "SARALO_PROXY_READY") {
        setProxiedPageText(String(event.data.text || "").slice(0, 30000));
        window.setTimeout(applyModeToIframe, 0);
        window.setTimeout(applyModeToIframe, 120);
        window.setTimeout(applyModeToIframe, 420);
      }
    };
    window.addEventListener("message", handleProxyReady);
    return () => window.removeEventListener("message", handleProxyReady);
  }, [applyModeToIframe]);

  useEffect(() => {
    if (!iframeLoaded) return;
    applyModeToIframe();
    const timers = [80, 260, 700].map((delay) => window.setTimeout(applyModeToIframe, delay));
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [iframeLoaded, activeMode, settingsPayload, applyModeToIframe]);

  // ---------------------------------------------------------------------
  // Mouse tracking for the spotlight / reading guide overlays.
  //
  // IMPORTANT: the readable content lives inside an <iframe> (a separate
  // document/window). A `mousemove` listener on the parent `window` will
  // NOT fire while the cursor is over the iframe — that was the bug
  // causing the spotlight to "freeze" as soon as the mouse entered the
  // page content (looked like a stuck duplicate spotlight).
  //
  // Fix: track parent-window mouse movement AND listen for mouse
  // coordinates relayed from inside the iframe via postMessage
  // (see the SARALO_MOUSE_MOVE handler below). Both sources funnel into
  // the same RAF-throttled CSS-var update so there is only ever one
  // spotlight position being applied.
  // ---------------------------------------------------------------------
  useEffect(() => {
    let rafId: number | null = null;
    let lastX = 0;
    let lastY = 0;

    const applyPosition = () => {
      rafId = null;
      // Writing to CSS vars is cheap and GPU-friendly (no layout thrash).
      document.documentElement.style.setProperty("--mouse-x", `${lastX}px`);
      document.documentElement.style.setProperty("--mouse-y", `${lastY}px`);
      document.documentElement.style.setProperty("--focus-x", `${lastX}px`);
      document.documentElement.style.setProperty("--focus-y", `${lastY}px`);
      document.documentElement.style.setProperty("--guide-top", `${lastY}px`);
    };

    const scheduleUpdate = (x: number, y: number) => {
      lastX = x;
      lastY = y;
      if (rafId == null) {
        rafId = window.requestAnimationFrame(applyPosition);
      }
    };

    // Mouse movement over the parent chrome (toolbar, margins outside the iframe).
    const handleWindowMouseMove = (e: MouseEvent) => {
      scheduleUpdate(e.clientX, e.clientY);
    };

    // Mouse movement relayed from inside the proxied iframe document.
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type !== "SARALO_MOUSE_MOVE") return;

      const rect = iframeRef.current?.getBoundingClientRect();
      if (!rect) return;

      const scale = settings.zoom / 100;

      // event.data.x / .y are coordinates inside the iframe's own document.
      // Convert to parent-page viewport coordinates, accounting for the
      // iframe's CSS zoom/scale transform.
      const x = rect.left + event.data.x * scale;
      const y = rect.top + event.data.y * scale;

      scheduleUpdate(x, y);
    };

    window.addEventListener("mousemove", handleWindowMouseMove, { passive: true });
    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("mousemove", handleWindowMouseMove);
      window.removeEventListener("message", handleMessage);
      if (rafId != null) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, [settings.zoom]);

  // Inject a small mousemove relay script into the proxied iframe so the
  // parent can track cursor position inside it. Runs once the iframe loads.
  useEffect(() => {
    if (!iframeLoaded) return;
    const win = iframeRef.current?.contentWindow;
    if (!win) return;

    win.postMessage({ type: "SARALO_ENABLE_MOUSE_RELAY" }, "*");
  }, [iframeLoaded]);

  const getVisiblePageText = useCallback(() => {
    return proxiedPageText.slice(0, 30000);
  }, [proxiedPageText]);

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
    setProxiedPageText("");
  }, [targetUrl]);

  const zoomScale = settings.zoom / 100;

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
      {!iframeLoaded && (
        <div className="viewer-loading">
          <div className="viewer-loading__spinner" />
          <p>Loading {targetUrl}...</p>
          <p className="viewer-loading__mode">
            Applying <strong>{activePreset?.title}</strong>
          </p>
        </div>
      )}

      {/* iframe with CSS filters */}
      <div
        className="viewer-frame-container"
        style={{
          filter: cssFilter,
          opacity: iframeLoaded ? 1 : 0,
        }}
      >
        <div
          className="viewer-frame-scaler"
          style={{
            transform: `scale(${zoomScale})`,
            transformOrigin: "top left",
            width: `${100 / zoomScale}%`,
            height: `${100 / zoomScale}%`,
            filter: "none",
          }}
        >
          <iframe
            key={targetUrl}
            className="viewer-iframe"
            src={`/api/proxy?url=${encodeURIComponent(targetUrl)}`}
            title={`Adapted view of ${targetUrl}`}
            onLoad={() => setIframeLoaded(true)}
            sandbox="allow-scripts allow-forms"
            referrerPolicy="no-referrer"
            ref={iframeRef}
          />
        </div>
      </div>

      {iframeLoaded && <VoiceControlPanel agent={voiceAgent} />}

      {(voiceAgent.transcriptState.visible || voiceAgent.status === "listening") && (
        <div
          className={`voice-transcript-bar ${voiceAgent.transcriptState.isFinal ? "is-final" : "is-interim"}`}
          dir={["ar", "he", "ur", "fa", "ps", "yi"].includes((voiceAgent.detectedLanguage || voiceAgent.settings.language).split("-")[0].toLowerCase()) ? "rtl" : "ltr"}
          aria-live="polite"
        >
          {voiceAgent.transcriptState.text || (
            <span className="listening-placeholder">
              Listening<span className="dot-pulse">...</span>
            </span>
          )}
        </div>
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
