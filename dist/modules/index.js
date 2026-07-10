"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultAIModules = void 0;
const BaseAIModule_1 = require("./BaseAIModule");
exports.defaultAIModules = [
    new BaseAIModule_1.BaseAIModule("simplify"),
    new BaseAIModule_1.BaseAIModule("summarize"),
    new BaseAIModule_1.BaseAIModule("translate"),
    new BaseAIModule_1.BaseAIModule("rewrite"),
    new BaseAIModule_1.BaseAIModule("explain"),
    new BaseAIModule_1.BaseAIModule("conversation"),
    new BaseAIModule_1.BaseAIModule("ask"),
    new BaseAIModule_1.BaseAIModule("checklist"),
    new BaseAIModule_1.BaseAIModule("reading_guide"),
    new BaseAIModule_1.BaseAIModule("visual_explain"),
    new BaseAIModule_1.BaseAIModule("form_assistant"),
    new BaseAIModule_1.BaseAIModule("website_explanation"),
    new BaseAIModule_1.BaseAIModule("navigation_guidance"),
    new BaseAIModule_1.BaseAIModule("security_explanation"),
    new BaseAIModule_1.BaseAIModule("predict_next_step"),
    new BaseAIModule_1.BaseAIModule("mistake_detection"),
    new BaseAIModule_1.BaseAIModule("accessibility_support")
];
