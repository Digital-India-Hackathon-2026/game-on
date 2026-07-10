import { createPromptTemplate } from "./common";

export const checklistGeneratorPrompt = createPromptTemplate(
  "checklist.task_steps",
  "checklist",
  "Convert the page task into a checklist. Never mark uncertain steps as required. Include a review step before sensitive actions or submission.",
  { checklist: { type: "array", items: { type: "object" } } }
);
