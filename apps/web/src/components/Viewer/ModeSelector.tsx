import { ArrowLeft } from "lucide-react";
import { modePresets, type AccessibilityModeId } from "../../hooks/useAdaptiveSession";
import { logoUrl } from "../../data/content";
import ModeIcon from "../Icons/ModeIcons";

type ModeSelectorProps = {
  targetUrl: string;
  onSelect: (modeId: AccessibilityModeId) => void;
  onBack: () => void;
};

export function ModeSelector({ targetUrl, onSelect, onBack }: ModeSelectorProps) {
  return (
    <div className="mode-select-overlay" role="dialog" aria-label="Select accessibility mode">
      <div className="mode-select-container">
        {/* Header */}
        <header className="mode-select-header">
          <button
            className="mode-select-back"
            onClick={onBack}
            type="button"
            aria-label="Go back"
          >
            <ArrowLeft size={20} />
          </button>

          <a href="#home" className="brand" aria-label="Saralo home">
            <img
              src={logoUrl}
              alt="Saralo Logo"
              onError={(event) => {
                event.currentTarget.hidden = true;
              }}
            />
          </a>
        </header>

        {/* Title */}
        <div className="mode-select-intro" style={{ textAlign: "center" }}>
          <h2>Enhanced Modes for Cognitive and Visual Support</h2>

          <p className="mode-select-url">
            Adapting: <strong>{targetUrl}</strong>
          </p>
        </div>

        {/* Mode Cards */}
        <div className="mode-select-grid">
          {modePresets.map((mode, index) => (
            <button
              key={mode.id}
              className="mode-select-card"
              onClick={() => onSelect(mode.id)}
              type="button"
              style={
                {
                  animationDelay: `${index * 0.08}s`,
                  "--mode-glow": mode.glow,
                } as React.CSSProperties
              }
            >
              <div className="mode-select-card__icon" aria-hidden>
                <div className="mode-icon-tile">
                  <ModeIcon id={mode.id} />
                </div>
              </div>

              <div
                className="mode-select-card__body"
                style={{ textAlign: "left" }}
              >
                <h3>{mode.title}</h3>

                {mode.subtitle && (
                  <span className="mode-select-card__tag">
                    {mode.subtitle}
                  </span>
                )}

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

              <div className="mode-select-card__action">
                Select Mode &rarr;
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}