"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.predictNextStepPrompt = void 0;
const common_1 = require("./common");
exports.predictNextStepPrompt = (0, common_1.createPromptTemplate)("task.predict_next_step", "predict_next_step", "Identify the likely next safe step from the accessible page model. Ask a clarifying question when the next step is ambiguous or sensitive.", { next_steps: { type: "array", items: { type: "string" } } });
