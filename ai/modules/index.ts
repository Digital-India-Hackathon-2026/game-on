import type { AIModule } from "../AIInterfaces";
import { BaseAIModule } from "./BaseAIModule";

export const defaultAIModules: AIModule[] = [
  new BaseAIModule("simplify"),
  new BaseAIModule("summarize"),
  new BaseAIModule("translate"),
  new BaseAIModule("rewrite"),
  new BaseAIModule("explain"),
  new BaseAIModule("conversation"),
  new BaseAIModule("ask"),
  new BaseAIModule("checklist"),
  new BaseAIModule("reading_guide"),
  new BaseAIModule("visual_explain"),
  new BaseAIModule("form_assistant"),
  new BaseAIModule("website_explanation"),
  new BaseAIModule("navigation_guidance"),
  new BaseAIModule("security_explanation"),
  new BaseAIModule("predict_next_step"),
  new BaseAIModule("mistake_detection"),
  new BaseAIModule("accessibility_support")
];
