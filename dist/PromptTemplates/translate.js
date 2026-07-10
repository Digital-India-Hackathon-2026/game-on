"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.translatePrompt = void 0;
const common_1 = require("./common");
exports.translatePrompt = (0, common_1.createPromptTemplate)("translate.simple", "translate", "Translate the content into the requested language using simple sentences. Preserve names, URLs, document IDs, amounts, dates, obligations, and eligibility criteria.", { translated_text: { type: "string" } });
