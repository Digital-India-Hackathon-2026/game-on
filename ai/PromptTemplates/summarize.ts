import { createPromptTemplate } from "./common";

export const summarizePrompt = createPromptTemplate(
  "summary.short",
  "summarize",
  "Summarize the page in simple language. Include key points, important actions, warnings, and source section IDs. Keep the summary respectful and concise.",
  { key_points: { type: "array", items: { type: "string" } }, important_actions: { type: "array", items: { type: "string" } } }
);
