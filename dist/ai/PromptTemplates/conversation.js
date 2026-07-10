"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.conversationPrompt = void 0;
const common_1 = require("./common");
exports.conversationPrompt = (0, common_1.createPromptTemplate)("conversation.grounded", "conversation", "Continue the page-specific conversation. Keep responses concise by default, use previous messages only as context, and cite page sections where possible.", { answer: { type: "string" } });
