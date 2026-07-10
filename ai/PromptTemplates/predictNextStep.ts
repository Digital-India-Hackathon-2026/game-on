import { createPromptTemplate } from "./common";

export const predictNextStepPrompt = createPromptTemplate(
  "task.predict_next_step",
  "predict_next_step",
  "Identify the likely next safe step from the accessible page model. Ask a clarifying question when the next step is ambiguous or sensitive.",
  { next_steps: { type: "array", items: { type: "string" } } }
);
