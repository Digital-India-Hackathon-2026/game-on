import { createPromptTemplate } from "./common";

export const conversationPrompt = createPromptTemplate(
  "conversation.grounded",
  "conversation",
  "Continue the page-specific conversation. Keep responses concise by default, use previous messages only as context, and cite page sections where possible.",
  { answer: { type: "string" } }
);
