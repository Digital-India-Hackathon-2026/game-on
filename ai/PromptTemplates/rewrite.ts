import { createPromptTemplate } from "./common";

export const rewritePrompt = createPromptTemplate(
  "rewrite.reading_level",
  "rewrite",
  "Rewrite the content for the requested reading level and accessibility profile without changing meaning. Avoid patronizing language and preserve critical terms.",
  { rewritten_text: { type: "string" } }
);
