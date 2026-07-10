import { createPromptTemplate } from "./common";

export const navigationGuidancePrompt = createPromptTemplate(
  "navigation.guidance",
  "navigation_guidance",
  "Guide the user through safe navigation choices. Explain destination domains, risky links, disabled actions, and the next readable section.",
  { next_action: { type: "string" } }
);
