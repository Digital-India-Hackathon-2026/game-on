"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIResponseFormatter = void 0;
const AIUtilities_1 = require("./AIUtilities");
class AIResponseFormatter {
    format(raw, context) {
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
            table: (0, AIUtilities_1.parseMarkdownTable)(content),
            highlightedSteps: (0, AIUtilities_1.extractLinesWithPrefix)(content, "Step"),
            accessibilityNotes: (0, AIUtilities_1.extractLinesWithPrefix)(content, "Accessibility note"),
            readingDifficulty: (0, AIUtilities_1.readingDifficulty)(content),
            estimatedReadingTimeSeconds: (0, AIUtilities_1.estimateReadingTimeSeconds)(content),
            keyTakeaways: (0, AIUtilities_1.extractLinesWithPrefix)(content, "Key takeaway"),
            actionItems: (0, AIUtilities_1.extractLinesWithPrefix)(content, "Action"),
            warnings,
            citations
        };
    }
}
exports.AIResponseFormatter = AIResponseFormatter;
