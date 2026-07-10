import { createPromptTemplate } from "./common";

export const visualExplanationPrompt = createPromptTemplate(
  "visual.explain",
  "visual_explain",
  "Explain visual elements, tables, images, charts, and page layout only from extracted visual metadata. Mark low-confidence descriptions clearly.",
  { visual_explanation: { type: "string" } }
);
