"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.websiteExplanationPrompt = void 0;
const common_1 = require("./common");
exports.websiteExplanationPrompt = (0, common_1.createPromptTemplate)("website.explanation", "website_explanation", "Explain what this website or page appears to be for, what the user can do there, and what risks or limitations are visible from the source context.", { purpose: { type: "string" } });
