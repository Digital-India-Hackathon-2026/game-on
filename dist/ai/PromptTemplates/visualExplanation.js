"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.visualExplanationPrompt = void 0;
const common_1 = require("./common");
exports.visualExplanationPrompt = (0, common_1.createPromptTemplate)("visual.explain", "visual_explain", "Explain visual elements, tables, images, charts, and page layout only from extracted visual metadata. Mark low-confidence descriptions clearly.", { visual_explanation: { type: "string" } });
