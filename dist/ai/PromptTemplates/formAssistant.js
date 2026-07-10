"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formAssistantPrompt = void 0;
const common_1 = require("./common");
exports.formAssistantPrompt = (0, common_1.createPromptTemplate)("form.guidance", "form_assistant", "Explain form fields and requirements without collecting sensitive values or submitting anything. Highlight required information, sensitive fields, and review steps.", { guidance: { type: "array", items: { type: "string" } } });
