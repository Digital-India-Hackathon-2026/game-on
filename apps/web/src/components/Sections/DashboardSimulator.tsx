import { dashboardItems } from "../../data/content";
import { useScrollReveal } from "../../hooks/useScrollReveal";
import type { usePipeline } from "../../hooks/usePipeline";
import type { useSaraloExperience } from "../../hooks/useSaraloExperience";

type DashboardSimulatorProps = {
  pipeline: ReturnType<typeof usePipeline>;
  experience: ReturnType<typeof useSaraloExperience>;
};

export function DashboardSimulator({ pipeline, experience }: DashboardSimulatorProps) {
  const { ref, isVisible } = useScrollReveal();

  return (
    <section
      className={`section-shell dashboard-section reveal ${isVisible ? "reveal--visible" : ""}`}
      aria-labelledby="dashboard-title"
      ref={ref}
    >
      <div>
        <p className="eyebrow">Dashboard simulator</p>
        <h2 id="dashboard-title">A working preview of the adaptive workspace.</h2>
        <div className="dashboard-list">
          {dashboardItems.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      </div>

      <article className="dashboard-sim">
        <div className="dashboard-window">
          <div className="dashboard-window__bar">
            <span />
            <span />
            <span />
          </div>

          <div className="dashboard-widget dashboard-widget--wide">
            <strong>Active reading session</strong>
            <p>
              {pipeline.validationState === "ready" ? pipeline.currentUrl : "https://wikipedia.org"}
            </p>
          </div>

          <label>
            Contrast
            <input
              min="0"
              max="100"
              type="range"
              value={experience.contrast}
              onChange={(event) => experience.setContrast(Number(event.target.value))}
            />
          </label>
          <label>
            Spacing
            <input
              min="0"
              max="100"
              type="range"
              value={experience.spacing}
              onChange={(event) => experience.setSpacing(Number(event.target.value))}
            />
          </label>
          <label>
            Reading pace
            <input
              min="0"
              max="100"
              type="range"
              value={experience.pace}
              onChange={(event) => experience.setPace(Number(event.target.value))}
            />
          </label>
        </div>
      </article>
    </section>
  );
}
