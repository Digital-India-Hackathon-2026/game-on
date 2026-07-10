import { createPromptTemplate } from "./common";

export const translatePrompt = createPromptTemplate(
  "translate.simple",
  "translate",
  "Translate the content into the requested language using simple sentences. Preserve names, URLs, document IDs, amounts, dates, obligations, and eligibility criteria.",
  { translated_text: { type: "string" } }
);
