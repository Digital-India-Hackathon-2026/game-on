import { Check, ShieldCheck } from "lucide-react";
import type { usePipeline } from "../../hooks/usePipeline";

type PipelinePanelProps = {
  pipeline: ReturnType<typeof usePipeline>;
};

export function PipelinePanel({ pipeline }: PipelinePanelProps) {
  return (
    <div className="pipeline-card" aria-live="polite">
      <div
        className="pipeline-progress"
        role="progressbar"
        aria-valuenow={pipeline.pipelineProgress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Pipeline progress ${pipeline.pipelineProgress}%`}
      >
        <span style={{ width: `${pipeline.pipelineProgress}%` }} />
      </div>

      <div className="pipeline-steps">
        {pipeline.stageView.map((step) => (
          <div
            className={`pipeline-step ${step.isActive ? "is-active" : ""} ${step.isComplete ? "is-complete" : ""}`}
            key={step.id}
          >
            <span>{step.isComplete ? <Check size={14} aria-hidden="true" /> : null}</span>
            <p>{step.isComplete ? step.complete : step.pending}</p>
          </div>
        ))}
      </div>

      {pipeline.errorMsg ? <p className="pipeline-error">{pipeline.errorMsg}</p> : null}

      {pipeline.validationState === "ready" ? (
        <div className="launch-preview">
          <ShieldCheck size={18} aria-hidden="true" />
          <span>Live adaptive preview ready for {pipeline.currentUrl}</span>
        </div>
      ) : null}
    </div>
  );
}
