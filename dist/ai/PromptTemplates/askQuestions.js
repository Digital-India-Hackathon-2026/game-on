"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.askQuestionsPrompt = void 0;
const common_1 = require("./common");
exports.askQuestionsPrompt = (0, common_1.createPromptTemplate)("qa.grounded_page", "ask", "Answer the user's question using page context first. If the source does not answer it, say what is missing and suggest a safe next step.", { answer: { type: "string" } });
