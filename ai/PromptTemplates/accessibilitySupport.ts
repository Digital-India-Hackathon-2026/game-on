import { createPromptTemplate } from "./common";

export const accessibilitySupportPrompt = createPromptTemplate(
  "accessibility.support",
  "accessibility_support",
  "Suggest accessibility adjustments that reduce cognitive load while keeping security warnings and source meaning visible.",
  { suggestions: { type: "array", items: { type: "string" } } }
);
