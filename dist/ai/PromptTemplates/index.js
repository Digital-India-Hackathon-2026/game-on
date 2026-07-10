"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultPromptTemplates = void 0;
const accessibilitySupport_1 = require("./accessibilitySupport");
const askQuestions_1 = require("./askQuestions");
const checklistGenerator_1 = require("./checklistGenerator");
const conversation_1 = require("./conversation");
const explain_1 = require("./explain");
const formAssistant_1 = require("./formAssistant");
const mistakeDetection_1 = require("./mistakeDetection");
const navigationGuidance_1 = require("./navigationGuidance");
const predictNextStep_1 = require("./predictNextStep");
const readingGuide_1 = require("./readingGuide");
const rewrite_1 = require("./rewrite");
const securityExplanation_1 = require("./securityExplanation");
const simplify_1 = require("./simplify");
const summarize_1 = require("./summarize");
const translate_1 = require("./translate");
const visualExplanation_1 = require("./visualExplanation");
const websiteExplanation_1 = require("./websiteExplanation");
const voiceControl_1 = require("./voiceControl");
exports.defaultPromptTemplates = [
    simplify_1.simplifyPrompt,
    summarize_1.summarizePrompt,
    explain_1.explainPrompt,
    rewrite_1.rewritePrompt,
    translate_1.translatePrompt,
    readingGuide_1.readingGuidePrompt,
    visualExplanation_1.visualExplanationPrompt,
    formAssistant_1.formAssistantPrompt,
    checklistGenerator_1.checklistGeneratorPrompt,
    askQuestions_1.askQuestionsPrompt,
    conversation_1.conversationPrompt,
    accessibilitySupport_1.accessibilitySupportPrompt,
    websiteExplanation_1.websiteExplanationPrompt,
    navigationGuidance_1.navigationGuidancePrompt,
    securityExplanation_1.securityExplanationPrompt,
    predictNextStep_1.predictNextStepPrompt,
    mistakeDetection_1.mistakeDetectionPrompt,
    voiceControl_1.voiceControlIntentPrompt,
    voiceControl_1.voiceControlGroundingPrompt,
    voiceControl_1.voiceControlConfirmationPrompt
];
