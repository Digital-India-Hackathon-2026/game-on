"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.securityExplanationPrompt = void 0;
const common_1 = require("./common");
exports.securityExplanationPrompt = (0, common_1.createPromptTemplate)("security.explanation", "security_explanation", "Explain Saralo security warnings in plain language. AI may explain risk but must not lower or override the security decision.", { risk_explanation: { type: "string" } });
