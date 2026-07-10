import { createPromptTemplate } from "./common";

export const formAssistantPrompt = createPromptTemplate(
  "form.guidance",
  "form_assistant",
  "Explain form fields and requirements without collecting sensitive values or submitting anything. Highlight required information, sensitive fields, and review steps.",
  { guidance: { type: "array", items: { type: "string" } } }
);
