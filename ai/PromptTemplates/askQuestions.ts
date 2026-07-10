import { createPromptTemplate } from "./common";

export const askQuestionsPrompt = createPromptTemplate(
  "qa.grounded_page",
  "ask",
  "Answer the user's question using page context first. If the source does not answer it, say what is missing and suggest a safe next step.",
  { answer: { type: "string" } }
);
