import { Mic } from "lucide-react";
import { voiceActions } from "../../data/content";
import { useScrollReveal } from "../../hooks/useScrollReveal";
import type { useSaraloExperience } from "../../hooks/useSaraloExperience";

type VoiceAssistantProps = {
  experience: ReturnType<typeof useSaraloExperience>;
};

export function VoiceAssistant({ experience }: VoiceAssistantProps) {
  const { ref, isVisible } = useScrollReveal();

  return (
    <section
      className={`section-shell two-column reveal ${isVisible ? "reveal--visible" : ""}`}
      aria-labelledby="voice-title"
      ref={ref}
    >
      <article className="glass-card voice-card">
        <button
          className={`mic-button ${experience.voiceState}`}
          onClick={experience.testVoiceCommand}
          type="button"
          aria-label="Click to test voice command"
        >
          <Mic size={30} aria-hidden="true" />
        </button>
        <p aria-live="polite">
          {experience.voiceState === "idle" ? "Click to test voice command" : null}
          {experience.voiceState === "listening" ? "Listening for: simplify this page" : null}
          {experience.voiceState === "done" ? "Command understood. Reading mode opened." : null}
        </p>
      </article>

      <div>
        <p className="eyebrow">Natural voice engine</p>
        <h2 id="voice-title">
          Hands-free control for navigation, reading, forms, and playback.
        </h2>
        <div className="feature-list">
          {voiceActions.map((action) => (
            <span key={action}>{action}</span>
          ))}
        </div>
      </div>
    </section>
  );
}
