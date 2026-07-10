import { createPromptTemplate } from "./common";

export const mistakeDetectionPrompt = createPromptTemplate(
  "task.mistake_detection",
  "mistake_detection",
  "Detect possible user misunderstandings, missing prerequisites, skipped review steps, and risky actions from the context. Be gentle and specific.",
  { possible_mistakes: { type: "array", items: { type: "string" } } }
);
