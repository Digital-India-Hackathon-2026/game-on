import { trustLogos } from "../../data/content";

export function TrustTicker() {
  return (
    <section className="trust-ticker" aria-label="Security and trust partners">
      <div className="ticker-track">
        {Array.from({ length: 4 }).flatMap((_, repeatIndex) =>
          trustLogos.map((logo, index) => (
            <img alt="" key={`${repeatIndex}-${index}`} src={logo} loading="lazy" />
          ))
        )}
      </div>
    </section>
  );
}
