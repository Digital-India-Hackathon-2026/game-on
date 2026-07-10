"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checklistGeneratorPrompt = void 0;
const common_1 = require("./common");
exports.checklistGeneratorPrompt = (0, common_1.createPromptTemplate)("checklist.task_steps", "checklist", "Convert the page task into a checklist. Never mark uncertain steps as required. Include a review step before sensitive actions or submission.", { checklist: { type: "array", items: { type: "object" } } });
