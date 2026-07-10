import { createPromptTemplate } from "./common";

export const simplifyPrompt = createPromptTemplate(
  "simplify.plain_language",
  "simplify",
  "Rewrite the selected content in plain language. Preserve dates, amounts, names, eligibility terms, warnings, and legal or medical wording that changes meaning. Use short sections and source citations.",
  { simplified_text: { type: "string" } }
);
