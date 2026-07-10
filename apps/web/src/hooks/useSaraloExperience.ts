import { useMemo, useState } from "react";

const denseCopy =
  "Cognitive accessibility tools mediate interaction complexity by interpreting page structure, user intent, sensory load, and comprehension needs before rendering a personalized navigation and reading environment.";

const simpleCopy =
  "Saralo studies a page, understands what may feel confusing, and rebuilds it into a calmer, clearer version for each person.";

export function useSaraloExperience() {
  const [copilotOutput, setCopilotOutput] = useState(denseCopy);
  const [voiceState, setVoiceState] = useState<"idle" | "listening" | "done">("idle");
  const [openFaq, setOpenFaq] = useState(2);
  const [contrast, setContrast] = useState(72);
  const [spacing, setSpacing] = useState(64);
  const [pace, setPace] = useState(48);

  function simplifyContent() {
    setCopilotOutput(simpleCopy);
  }

  function resetContent() {
    setCopilotOutput(denseCopy);
  }

  function testVoiceCommand() {
    setVoiceState("listening");
    window.setTimeout(() => setVoiceState("done"), 1200);
  }

  return useMemo(
    () => ({
      copilotOutput,
      simplifyContent,
      resetContent,
      voiceState,
      testVoiceCommand,
      openFaq,
      setOpenFaq,
      contrast,
      setContrast,
      spacing,
      setSpacing,
      pace,
      setPace
    }),
    [contrast, copilotOutput, openFaq, pace, spacing, voiceState]
  );
}
