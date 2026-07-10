"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.summarizePrompt = void 0;
const common_1 = require("./common");
exports.summarizePrompt = (0, common_1.createPromptTemplate)("summary.short", "summarize", "Summarize the page in simple language. Include key points, important actions, warnings, and source section IDs. Keep the summary respectful and concise.", { key_points: { type: "array", items: { type: "string" } }, important_actions: { type: "array", items: { type: "string" } } });
