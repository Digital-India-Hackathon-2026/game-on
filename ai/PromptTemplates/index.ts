import { accessibilitySupportPrompt } from "./accessibilitySupport";
import { askQuestionsPrompt } from "./askQuestions";
import { checklistGeneratorPrompt } from "./checklistGenerator";
import { conversationPrompt } from "./conversation";
import { explainPrompt } from "./explain";
import { formAssistantPrompt } from "./formAssistant";
import { mistakeDetectionPrompt } from "./mistakeDetection";
import { navigationGuidancePrompt } from "./navigationGuidance";
import { predictNextStepPrompt } from "./predictNextStep";
import { readingGuidePrompt } from "./readingGuide";
import { rewritePrompt } from "./rewrite";
import { securityExplanationPrompt } from "./securityExplanation";
import { simplifyPrompt } from "./simplify";
import { summarizePrompt } from "./summarize";
import { translatePrompt } from "./translate";
import { visualExplanationPrompt } from "./visualExplanation";
import { websiteExplanationPrompt } from "./websiteExplanation";
import { voiceControlConfirmationPrompt, voiceControlGroundingPrompt, voiceControlIntentPrompt } from "./voiceControl";

export const defaultPromptTemplates = [
  simplifyPrompt,
  summarizePrompt,
  explainPrompt,
  rewritePrompt,
  translatePrompt,
  readingGuidePrompt,
  visualExplanationPrompt,
  formAssistantPrompt,
  checklistGeneratorPrompt,
  askQuestionsPrompt,
  conversationPrompt,
  accessibilitySupportPrompt,
  websiteExplanationPrompt,
  navigationGuidancePrompt,
  securityExplanationPrompt,
  predictNextStepPrompt,
  mistakeDetectionPrompt,
  voiceControlIntentPrompt,
  voiceControlGroundingPrompt,
  voiceControlConfirmationPrompt
];
