import { HeroContent } from "./HeroContent";
import { OrbitEcosystem } from "./OrbitEcosystem";
import type { usePipeline } from "../../hooks/usePipeline";

type HeroSectionProps = {
  url: string;
  setUrl: (url: string) => void;
  pipeline: ReturnType<typeof usePipeline>;
};

export function HeroSection({ url, setUrl, pipeline }: HeroSectionProps) {
  return (
    <section className="hero-shell" aria-labelledby="hero-title">
      <HeroContent url={url} setUrl={setUrl} pipeline={pipeline} />
      <div className="hero-orbit-wrap">
        <OrbitEcosystem />
      </div>
    </section>
  );
}
