import type { AIResponseFormatterPort } from "./AIInterfaces";
import type { AIBuiltContext, AIFormattedResponse, AIProviderResponse } from "./AITypes";
import { estimateReadingTimeSeconds, extractLinesWithPrefix, parseMarkdownTable, readingDifficulty } from "./AIUtilities";

export class AIResponseFormatter implements AIResponseFormatterPort {
  format(raw: AIProviderResponse, context: AIBuiltContext): AIFormattedResponse {
    const content = raw.text.trim();
    const citations = Object.entries(context.citationMap)
      .filter(([sectionId]) => content.includes(sectionId))
      .map(([sectionId, label]) => ({ sectionId, label }));
    const warnings = [
      ...context.security.warnings,
      ...(context.security.promptInjectionDetected ? ["Source page may contain prompt-injection text. Saralo ignored page instructions."] : [])
    ];

    return {
      content,
      format: "markdown",
      markdown: content,
      bulletList: content
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => /^[-*]\s+/.test(line))
        .map((line) => line.replace(/^[-*]\s+/, "")),
      table: parseMarkdownTable(content),
      highlightedSteps: extractLinesWithPrefix(content, "Step"),
      accessibilityNotes: extractLinesWithPrefix(content, "Accessibility note"),
      readingDifficulty: readingDifficulty(content),
      estimatedReadingTimeSeconds: estimateReadingTimeSeconds(content),
      keyTakeaways: extractLinesWithPrefix(content, "Key takeaway"),
      actionItems: extractLinesWithPrefix(content, "Action"),
      warnings,
      citations
    };
  }
}
