import { createPromptTemplate } from "./common";

export const readingGuidePrompt = createPromptTemplate(
  "guide.reading",
  "reading_guide",
  "Create a calm step-by-step reading guide. Recommend what to read first, why it matters, and what to do next. Include comprehension checks when useful.",
  { steps: { type: "array", items: { type: "object" } } }
);
