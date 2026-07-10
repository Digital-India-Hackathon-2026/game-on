"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.simplifyPrompt = void 0;
const common_1 = require("./common");
exports.simplifyPrompt = (0, common_1.createPromptTemplate)("simplify.plain_language", "simplify", "Rewrite the selected content in plain language. Preserve dates, amounts, names, eligibility terms, warnings, and legal or medical wording that changes meaning. Use short sections and source citations.", { simplified_text: { type: "string" } });
