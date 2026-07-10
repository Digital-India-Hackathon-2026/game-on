"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rewritePrompt = void 0;
const common_1 = require("./common");
exports.rewritePrompt = (0, common_1.createPromptTemplate)("rewrite.reading_level", "rewrite", "Rewrite the content for the requested reading level and accessibility profile without changing meaning. Avoid patronizing language and preserve critical terms.", { rewritten_text: { type: "string" } });
