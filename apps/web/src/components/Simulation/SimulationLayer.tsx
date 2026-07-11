import React, { useEffect, useRef, useState, useCallback } from "react";
import { useSimulationStore, type SimulationMode } from "../../state/simulationStore";
import { X, RefreshCw, AlertTriangle } from "lucide-react";

type SimulationLayerProps = {
  children: React.ReactNode;
};

export function SimulationLayer({ children }: SimulationLayerProps) {
  const {
    activeSimulation,
    colorblindType,
    adhdFocusRecovery,
    cognitiveFixed,
    setSimulation,
    setAdhdFocusRecovery,
    setCognitiveFixed,
    resetAll,
  } = useSimulationStore();

  const [targetError, setTargetError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const rafMouseWriteRef = useRef<number | null>(null);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      // Always update CSS vars (cheap), but throttle React state updates.
      const clientX = e.clientX;
      const clientY = e.clientY;

      if (rafMouseWriteRef.current == null) {
        rafMouseWriteRef.current = window.requestAnimationFrame(() => {
          rafMouseWriteRef.current = null;
          document.documentElement.style.setProperty("--mouse-x", `${clientX}px`);
          document.documentElement.style.setProperty("--mouse-y", `${clientY}px`);
          document.documentElement.style.setProperty(
            "--mouse-percent-x",
            `${(clientX / window.innerWidth) * 100}%`
          );
          document.documentElement.style.setProperty(
            "--mouse-percent-y",
            `${(clientY / window.innerHeight) * 100}%`
          );
        });
      }
    },
    []
  );

  // Dyslexia character-swapping loop
  // Perf: avoid heavy DOM queries too frequently.
  useEffect(() => {
    if (activeSimulation !== "dyslexia") return;

    let cancelled = false;

    const interval = window.setInterval(() => {
      if (cancelled) return;

      const elements = Array.from(
        document.querySelectorAll(
          "p, h1, h2, h3, li, a, span:not(.viewer-toolbar__mode-dot):not(.no-dyslexia)"
        )
      );

      if (elements.length === 0) return;

      // Swap a few random visible elements occasionally
      // Keep work bounded to avoid frame drops.
      const swapCount = Math.min(2, elements.length);
      for (let i = 0; i < swapCount; i++) {
        const el = elements[Math.floor(Math.random() * elements.length)] as HTMLElement;
        if (!el || el.children.length > 0 || el.closest(".sim-controls")) continue;

        const text = el.innerText || "";
        if (text.length < 8) continue;

        const idx = Math.floor(Math.random() * (text.length - 2));
        const arr = text.split("");
        const temp = arr[idx];
        arr[idx] = arr[idx + 1];
        arr[idx + 1] = temp;

        // Avoid Layout thrash: only mutate when value actually changes.
        const mutated = arr.join("");
        if (mutated === text) continue;

        el.innerText = mutated;

        window.setTimeout(() => {
          if (cancelled) return;
          el.innerText = text;
        }, 350);
      }
    }, 900);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [activeSimulation]);


  useEffect(() => {
    // Passive improves scroll/mouse smoothness.
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (rafMouseWriteRef.current != null) {
        window.cancelAnimationFrame(rafMouseWriteRef.current);
        rafMouseWriteRef.current = null;
      }
    };
  }, [handleMouseMove]);



  // CSS Class modifiers based on simulation mode
  const simulationClasses = [
    activeSimulation ? `simulation-active` : "",
    activeSimulation ? `simulation-active--${activeSimulation}` : "",
    activeSimulation === "colorblind" ? `colorblind--${colorblindType}` : "",
    adhdFocusRecovery ? "adhd-focus-recovery" : "",
    cognitiveFixed ? "cognitive-fixed-active" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={simulationClasses} ref={containerRef}>
      {children}

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

      {/* Small Target Warnings */}
      {targetError && (
        <div className="sim-toast sim-toast--error no-sim-intercept">
          <AlertTriangle size={18} />
          <span>{targetError}</span>
        </div>
      )}

      {/* Dynamic Simulation floating status & recovery controls */}
      {activeSimulation && (
        <div className="sim-controls no-sim-intercept">
          <div className="sim-controls__header">
            <strong>Accessibility Simulator Active</strong>
            <button onClick={() => setSimulation(null)} title="Close simulation" type="button" aria-label="Close simulation">
              <X size={16} />
            </button>
          </div>

          <div className="sim-controls__body">
            <p className="sim-controls__mode-desc">
              Currently simulating: <strong style={{ color: "#d9b6ff" }}>{activeSimulation.toUpperCase().replace("-", " ")}</strong>
            </p>

            {/* Sub-modes for Colorblind */}
            {activeSimulation === "colorblind" && (
              <div className="sim-controls__color-options">
                {(["protanopia", "deuteranopia", "tritanopia", "achromatopsia"] as const).map((type) => (
                  <button
                    key={type}
                    className={colorblindType === type ? "is-active" : ""}
                    onClick={() => useSimulationStore.getState().setColorblindType(type)}
                    type="button"
                    aria-pressed={colorblindType === type}
                  >
                    {type}
                  </button>
                ))}
              </div>
            )}

            {/* Recovery actions */}
            {activeSimulation === "adhd" && (
              <button
                className={`sim-recovery-btn ${adhdFocusRecovery ? "is-active" : ""}`}
                onClick={() => setAdhdFocusRecovery(!adhdFocusRecovery)}
                type="button"
                aria-pressed={adhdFocusRecovery}
              >
                {adhdFocusRecovery ? "Disable Focus Recovery" : "⚡ Enable Focus Recovery"}
              </button>
            )}

            {activeSimulation === "cognitive-overload" && (
              <button
                className={`sim-recovery-btn ${cognitiveFixed ? "is-active" : ""}`}
                onClick={() => setCognitiveFixed(!cognitiveFixed)}
                type="button"
                aria-pressed={cognitiveFixed}
              >
                {cognitiveFixed ? "Reset Overload View" : "🛠️ Fix This UI"}
              </button>
            )}
          </div>

          <div className="sim-controls__footer">
            <button className="sim-disable-btn" onClick={resetAll} type="button">
              <RefreshCw size={12} /> Turn Off Simulator
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
