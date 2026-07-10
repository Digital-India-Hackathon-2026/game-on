"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readingGuidePrompt = void 0;
const common_1 = require("./common");
exports.readingGuidePrompt = (0, common_1.createPromptTemplate)("guide.reading", "reading_guide", "Create a calm step-by-step reading guide. Recommend what to read first, why it matters, and what to do next. Include comprehension checks when useful.", { steps: { type: "array", items: { type: "object" } } });
