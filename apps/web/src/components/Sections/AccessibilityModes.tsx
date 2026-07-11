import type { CSSProperties } from "react";
import { modes } from "../../data/content";
import { useScrollReveal } from "../../hooks/useScrollReveal";
import type { AccessibilityModeId } from "../../hooks/useAdaptiveSession";

type AccessibilityModesProps = {
  onSelectMode?: (modeId: AccessibilityModeId) => void;
};

export function AccessibilityModes({ onSelectMode }: AccessibilityModesProps) {
  const { ref, isVisible } = useScrollReveal();

  return (
    <section
      className={`section-shell reveal ${isVisible ? "reveal--visible" : ""}`}
      id="modes"
      aria-labelledby="modes-title"
      ref={ref}
    >
      <header className="modes-header">
        <h2 id="modes-title" className="modes-header__title">
          Enhanced Modes for Cognitive and Visual Support
        </h2>
      </header>

      <div className="mode-grid" aria-label="Available accessibility modes">
        {modes.map((mode, idx) => (
          <article
            key={mode.simId}
            className="glass-card mode-card"
            style={{ animationDelay: `${idx * 0.06}s` }}
          >
            {/* ── Icon + Title row ── */}
            <div className="mode-card__header">
              {/* Icon box — all sizing is inline so the browser cannot override it */}
              <div
                style={{
                  flexShrink: 0,
                  width: 52,
                  height: 52,
                  minWidth: 52,
                  minHeight: 52,
                  borderRadius: 12,
                  background: "rgba(255,255,255,0.07)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  overflow: "hidden",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: `0 0 14px -3px ${mode.glow}`,
                } as CSSProperties}
              >
                <img
                  src={mode.icon}
                  alt=""
                  aria-hidden="true"
                  style={{
                    display: "block",
                    width: 32,
                    height: 32,
                    minWidth: 32,
                    minHeight: 32,
                    maxWidth: 32,
                    maxHeight: 32,
                    objectFit: "contain",
                    flexShrink: 0,
                  } as CSSProperties}
                />
              </div>

              {/* Title — min-width:0 lets it shrink & wrap inside the flex container */}
              <h3 className="mode-card__title">{mode.title}</h3>
            </div>

            {/* ── Subtitle badge ── */}
            {mode.subtitle && (
              <span className="mode-card__badge">{mode.subtitle}</span>
            )}

            {/* ── Body text ── */}
            <div className="mode-card__body">
              {mode.description && <p>{mode.description}</p>}
              {mode.problem && (
                <p>
                  <strong>Problem:</strong> {mode.problem}
                </p>
              )}
              {mode.resolution && (
                <p>
                  <strong>Resolution:</strong> {mode.resolution}
                </p>
              )}
              {mode.parameter && (
                <p>
                  <strong>AI parameter:</strong> {mode.parameter}
                </p>
              )}
            </div>

            {/* ── CTA ── */}
            <button
              type="button"
              className="mode-card__cta"
              onClick={() => {
                if (!onSelectMode) return;
                onSelectMode(mode.simId as AccessibilityModeId);
              }}
              disabled={!onSelectMode}
            >
              Select Mode →
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
