import type { FormEvent } from "react";
import { PipelinePanel } from "./PipelinePanel";
import { headline, headlineSplitIndex } from "../../data/content";
import { useTypewriter } from "../../hooks/useTypewriter";
import type { usePipeline } from "../../hooks/usePipeline";

type HeroContentProps = {
  url: string;
  setUrl: (url: string) => void;
  pipeline: ReturnType<typeof usePipeline>;
};

export function HeroContent({ url, setUrl, pipeline }: HeroContentProps) {
  const typewriter = useTypewriter(headline);
  const firstSlice = typewriter.visibleText.slice(0, headlineSplitIndex);
  const secondSlice = typewriter.visibleText.slice(headlineSplitIndex);

  function submitPipeline(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void pipeline.processUrl(url);
  }

  return (
    <div className="hero-copy">
      <h1 id="hero-title" className="type-heading">
        <span className="heading-dark">{firstSlice}</span>
        <span className="heading-light">{secondSlice}</span>
        {!typewriter.isComplete ? <span className="typing-cursor" aria-hidden="true" /> : null}
      </h1>

      <form className="url-analyzer" onSubmit={submitPipeline}>
        <label className="sr-only" htmlFor="website-url">
          Website URL to analyze
        </label>
        <input
          id="website-url"
          onChange={(event) => setUrl(event.target.value)}
          placeholder="Enter portal URL (e.g. stateportal.gov)"
          type="url"
          value={url}
          required
        />
        <button
          disabled={
            pipeline.validationState !== "idle" &&
            pipeline.validationState !== "ready" &&
            pipeline.validationState !== "failed"
          }
          id="website-analyze-submit"
          type="submit"
        >
          Analyze Website
        </button>
      </form>

      <PipelinePanel pipeline={pipeline} />
    </div>
  );
}
