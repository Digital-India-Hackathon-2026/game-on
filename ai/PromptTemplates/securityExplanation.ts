import { createPromptTemplate } from "./common";

export const securityExplanationPrompt = createPromptTemplate(
  "security.explanation",
  "security_explanation",
  "Explain Saralo security warnings in plain language. AI may explain risk but must not lower or override the security decision.",
  { risk_explanation: { type: "string" } }
);
