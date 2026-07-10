"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.navigationGuidancePrompt = void 0;
const common_1 = require("./common");
exports.navigationGuidancePrompt = (0, common_1.createPromptTemplate)("navigation.guidance", "navigation_guidance", "Guide the user through safe navigation choices. Explain destination domains, risky links, disabled actions, and the next readable section.", { next_action: { type: "string" } });
