import { LockKeyhole } from "lucide-react";
import { trustMetrics } from "../../data/content";
import { useScrollReveal } from "../../hooks/useScrollReveal";

export function SecurityShield() {
  const { ref, isVisible } = useScrollReveal();

  return (
    <section
      className={`section-shell reveal ${isVisible ? "reveal--visible" : ""}`}
      id="security"
      aria-labelledby="security-title"
      ref={ref}
    >
      <p className="eyebrow">Security shield</p>
      <h2 id="security-title">Risky pages are inspected before Saralo adapts them.</h2>

      <div className="security-grid">
        {trustMetrics.map((metric, index) => (
          <article className="glass-card metric-card" key={metric}>
            <LockKeyhole size={20} aria-hidden="true" />
            <strong>{92 + index}%</strong>
            <span>{metric}</span>
          </article>
        ))}
      </div>

      <p className="section-note">
        Saralo can intercept confusing, suspicious, or noisy layers and present a safer simplified
        route before a user interacts with risky elements.
      </p>
    </section>
  );
}
