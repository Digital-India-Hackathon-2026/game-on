"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.explainPrompt = void 0;
const common_1 = require("./common");
exports.explainPrompt = (0, common_1.createPromptTemplate)("explain.plain", "explain", "Explain the selected concept or section clearly. Define difficult terms, label uncertainty, and avoid definitive high-stakes advice unless the source directly states it.", { explanation: { type: "string" } });
