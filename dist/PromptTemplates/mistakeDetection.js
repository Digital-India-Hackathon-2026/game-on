"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mistakeDetectionPrompt = void 0;
const common_1 = require("./common");
exports.mistakeDetectionPrompt = (0, common_1.createPromptTemplate)("task.mistake_detection", "mistake_detection", "Detect possible user misunderstandings, missing prerequisites, skipped review steps, and risky actions from the context. Be gentle and specific.", { possible_mistakes: { type: "array", items: { type: "string" } } });
