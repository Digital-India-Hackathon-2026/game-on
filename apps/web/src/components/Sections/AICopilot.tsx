import { Sparkles } from "lucide-react";
import { copilotTools } from "../../data/content";
import { useScrollReveal } from "../../hooks/useScrollReveal";
import type { useSaraloExperience } from "../../hooks/useSaraloExperience";

type AICopilotProps = {
  experience: ReturnType<typeof useSaraloExperience>;
};

export function AICopilot({ experience }: AICopilotProps) {
  const { ref, isVisible } = useScrollReveal();

  return (
    <section
      className={`section-shell two-column reveal ${isVisible ? "reveal--visible" : ""}`}
      id="ai"
      aria-labelledby="ai-title"
      ref={ref}
    >
      <div>
        <p className="eyebrow">AI cognitive copilot</p>
        <h2 id="ai-title">Tools that translate the web into plain, useful decisions.</h2>
        <div className="tool-chips">
          {copilotTools.map((tool) => (
            <span key={tool}>{tool}</span>
          ))}
        </div>
      </div>

      <article className="glass-card playground">
        <div className="playground__header">
          <Sparkles size={20} aria-hidden="true" />
          <h3>Content simplifier</h3>
        </div>
        <p>{experience.copilotOutput}</p>

      </article>
    </section>
  );
}
