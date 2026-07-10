import { timeline } from "../../data/content";
import { useScrollReveal } from "../../hooks/useScrollReveal";

export function SystemPipeline() {
  const { ref, isVisible } = useScrollReveal();

  return (
    <section
      className={`section-shell reveal ${isVisible ? "reveal--visible" : ""}`}
      id="pipeline"
      aria-labelledby="pipeline-title"
      ref={ref}
    >
      <p className="eyebrow">System pipeline</p>
      <h2 id="pipeline-title">From raw website to adaptive experience in five steps.</h2>

      <ol className="timeline">
        {timeline.map((step, index) => (
          <li key={step.title} style={{ animationDelay: `${index * 0.12}s` }}>
            <span>{index + 1}</span>
            <div>
              <strong>{step.title}</strong>
              <p className="timeline-desc">{step.description}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
