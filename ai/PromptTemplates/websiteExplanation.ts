import { createPromptTemplate } from "./common";

export const websiteExplanationPrompt = createPromptTemplate(
  "website.explanation",
  "website_explanation",
  "Explain what this website or page appears to be for, what the user can do there, and what risks or limitations are visible from the source context.",
  { purpose: { type: "string" } }
);
