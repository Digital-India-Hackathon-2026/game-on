import { createPromptTemplate } from "./common";

export const explainPrompt = createPromptTemplate(
  "explain.plain",
  "explain",
  "Explain the selected concept or section clearly. Define difficult terms, label uncertainty, and avoid definitive high-stakes advice unless the source directly states it.",
  { explanation: { type: "string" } }
);
