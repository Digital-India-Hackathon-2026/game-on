# Saralo AI Engine Implementation

## Purpose

The `/ai` package implements Saralo's provider-independent AI gateway. It is headless, strongly typed, event driven, configuration first, and designed to be called by the backend API or workers. Client applications should call Saralo REST endpoints; they should never call Gemini or any future model provider directly.

## Architecture

The engine follows the frozen pipeline from `docs/AI.md`:

1. `AIRequestValidator` validates task, input, language, and token limits.
2. `AIContextBuilder` combines webpage context, accessibility preferences, voice preferences, conversation history, memory, language, security metadata, and current task.
3. `PromptRegistry` selects a versioned prompt module.
4. `AIRegistry` resolves a provider adapter and capability module.
5. A provider adapter, currently `GeminiAIProviderAdapter`, performs model invocation behind `AIProviderAdapter`.
6. `AIResponseFormatter` adds markdown, bullets, warnings, citations, reading difficulty, reading time, action items, and accessibility notes.
7. `AIHistoryManager` persists prompt, response, timestamp, website, accessibility mode, language, execution time, model, provider, token usage, status, and errors through a repository port.
8. `AIConversationManager` and `AIMemoryManager` update provider-independent memory.
9. `AIEvents` emits request, prompt, memory, history, and failure events.

## Prompt Registry

Prompts live under `/ai/PromptTemplates`, one module per prompt family. Services do not contain prompt task strings. Prompt metadata includes key, version, task, locale, schemas, safety policy, supported profiles, and status.

Included prompt modules:

- Simplify
- Summarize
- Explain
- Rewrite
- Translate
- Reading Guide
- Visual Explanation
- Form Assistant
- Checklist Generator
- Ask Questions
- Conversation
- Accessibility Support
- Website Explanation
- Navigation Guidance
- Security Explanation
- Predict Next Step
- Mistake Detection

## Provider Adapter

`AIProviderAdapter` is the stable provider port. `GeminiAIProviderAdapter` is the current production adapter, and `MockAIProvider` supports unit and pipeline testing. Future providers such as OpenAI, Claude, DeepSeek, Llama, Mistral, Azure OpenAI, and local models can be added without changing `AIService`.

## Memory

`AIMemoryManager` supports:

- Conversation memory
- Session memory
- User preference memory
- Context memory
- Future long-term memory

The default repository is in-memory for local development and tests. Production persistence should implement `AIMemoryRepository` with tenant and RLS-safe storage.

## Configuration

`AIConfiguration` owns provider routing, model, temperature, max tokens, timeout, retry rules, feature flags, safety rules, context token budget, default language, and trusted instructions. Runtime code accepts overrides through dependency injection.

## Testing

Tests live under `/tests/ai` and are dependency-light Node tests for this documentation-only repository. They verify:

- Prompt modules and prompt isolation.
- Pipeline stage order.
- Module registration.
- Context and memory coverage.
- Provider adapter contract.
- History fields.
- Error coverage.
- Configuration and event names.

Run:

```bash
npm.cmd test
```

Use `npm run typecheck` once dependencies are installed.
