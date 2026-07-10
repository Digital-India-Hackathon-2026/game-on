import { useCallback, useMemo, useState } from "react";

export type PipelineState = "idle" | "validating" | "scanning" | "extracting" | "adapting" | "ready" | "failed";

export type PipelineStep = {
  id: PipelineState;
  pending: string;
  complete: string;
  progress: number;
};

const urlPattern = /^https?:\/\/([\w-]+\.)+[\w-]{2,}(\/\S*)?$/i;

const pipelineSteps: PipelineStep[] = [
  { id: "validating", pending: "URL Validating", complete: "URL Validated", progress: 18 },
  { id: "scanning", pending: "Security Scan Active", complete: "Security Clean", progress: 42 },
  { id: "extracting", pending: "Extracting Structural Data", complete: "Semantic Tree Formed", progress: 68 },
  { id: "adapting", pending: "AI Cognitive Adaptation Mapping", complete: "Platform Transformation Complete", progress: 92 },
];

const delay = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

function isStepComplete(step: PipelineStep, state: PipelineState) {
  const currentIndex = pipelineSteps.findIndex((candidate) => candidate.id === state);
  const stepIndex = pipelineSteps.findIndex((candidate) => candidate.id === step.id);
  return state === "ready" || (currentIndex > -1 && stepIndex < currentIndex);
}

export function usePipeline(onReady?: (url: string) => void) {
  const [currentUrl, setCurrentUrl] = useState("");
  const [validationState, setValidationState] = useState<PipelineState>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [pipelineProgress, setPipelineProgress] = useState(0);

  const processUrl = useCallback(
    async (url: string) => {
      const normalizedUrl = url.trim();
      setCurrentUrl(normalizedUrl);
      setErrorMsg("");

      if (!urlPattern.test(normalizedUrl)) {
        setValidationState("failed");
        setPipelineProgress(0);
        setErrorMsg("Use a full secure URL, for example https://wikipedia.org.");
        return false;
      }

      for (const step of pipelineSteps) {
        setValidationState(step.id);
        setPipelineProgress(step.progress);
        await delay(620);
      }

      setValidationState("ready");
      setPipelineProgress(100);

      // Auto-transition after a brief pause to show the "ready" state
      if (onReady) {
        await delay(600);
        onReady(normalizedUrl);
      }

      return true;
    },
    [onReady]
  );

  const reset = useCallback(() => {
    setCurrentUrl("");
    setValidationState("idle");
    setErrorMsg("");
    setPipelineProgress(0);
  }, []);

  const stageView = useMemo(
    () =>
      pipelineSteps.map((step) => ({
        ...step,
        isActive: validationState === step.id,
        isComplete: isStepComplete(step, validationState),
      })),
    [validationState]
  );

  return {
    currentUrl,
    validationState,
    errorMsg,
    pipelineProgress,
    processUrl,
    reset,
    stageView,
  };
}
