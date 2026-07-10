"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chunkText = chunkText;
exports.withRule = withRule;
exports.applyRules = applyRules;
function chunkText(text, maxSentences) {
    const sentences = text.split(/(?<=[.!?])\s+/).filter(Boolean);
    const chunks = [];
    for (let index = 0; index < sentences.length; index += maxSentences) {
        chunks.push(sentences.slice(index, index + maxSentences).join(" "));
    }
    return chunks.join("\n\n");
}
function withRule(id, description, apply) {
    return { id, description, apply };
}
function applyRules(sections, rules) {
    return sections.map((section) => rules.reduce((current, rule) => rule.apply(current), section));
}
