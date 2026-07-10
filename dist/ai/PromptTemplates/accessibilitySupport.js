"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.accessibilitySupportPrompt = void 0;
const common_1 = require("./common");
exports.accessibilitySupportPrompt = (0, common_1.createPromptTemplate)("accessibility.support", "accessibility_support", "Suggest accessibility adjustments that reduce cognitive load while keeping security warnings and source meaning visible.", { suggestions: { type: "array", items: { type: "string" } } });
