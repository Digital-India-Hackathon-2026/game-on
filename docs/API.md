# Saralo REST API Design

## 1. Purpose

Saralo exposes a headless REST API used by the web app, future Chrome extension, future desktop app, future mobile app, and public API customers. The API is versioned, accessibility-aware, privacy-first, and designed for asynchronous page processing.

## 2. API Principles

- All endpoints are versioned under `/v1`.
- All request and response bodies use JSON unless uploading binary documents.
- Long-running work returns `202 Accepted` with a stable job or session ID.
- Progress is available through polling and streaming.
- Error responses use one shared error envelope.
- User-owned data requires authentication.
- Public API access uses scoped API keys or OAuth tokens.
- Pagination is cursor-based by default.
- Sensitive page content, raw HTML, transcripts, and uploaded files are never returned unless explicitly allowed by policy.

## 3. Authentication

### User Authentication

User-facing clients use Supabase JWTs.

Header:

```http
Authorization: Bearer <supabase_jwt>
```

### Public API Authentication

Partner and enterprise clients use scoped API keys or OAuth machine tokens.

Header:

```http
Authorization: Bearer <api_key_or_machine_token>
```

### Guest Mode

Guest mode is allowed for limited page sessions. Guest requests use an anonymous session token and stricter rate limits. Guest history is not persisted beyond session retention.

## 4. Versioning

Current version:

- `/v1`

Rules:

- Breaking changes require a new major version.
- Additive fields are allowed in the same version.
- Deprecated fields remain for at least one major release cycle.
- Public API responses include `api_version`.

## 5. Rate Limiting

Default user limits:

- URL submissions: 20 per hour.
- AI chat messages: 100 per hour.
- Voice generation: 30 per hour.
- Uploads: 10 per hour.

Default public API limits:

- Free or hackathon tier: 100 requests per day.
- Pilot tier: configured per tenant.
- Enterprise tier: contract-defined.

Headers:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 2026-07-06T16:00:00Z
```

## 6. Pagination

List endpoints use cursor pagination.

Request query:

```text
?limit=20&cursor=eyJjcmVhdGVkX2F0Ijoi... 
```

Response model:

```json
{
  "data": [],
  "pagination": {
    "limit": 20,
    "next_cursor": "string-or-null",
    "has_more": false
  }
}
```

Validation:

- `limit` defaults to `20`.
- Maximum `limit` is `100`.
- Invalid cursors return `400 invalid_cursor`.

## 7. Error Handling

Shared error envelope:

```json
{
  "error": {
    "code": "invalid_url",
    "message": "This link is not supported.",
    "details": {
      "field": "url"
    },
    "request_id": "req_123",
    "docs_url": "https://docs.saralo.example/errors/invalid_url"
  }
}
```

Common status codes:

| Status | Meaning |
| --- | --- |
| `400` | Invalid request |
| `401` | Missing or invalid authentication |
| `403` | Authenticated but not allowed |
| `404` | Resource not found |
| `409` | Conflict or duplicate request |
| `413` | Request too large |
| `415` | Unsupported content type |
| `422` | Valid JSON but invalid product state |
| `429` | Rate limited |
| `500` | Unexpected server error |
| `502` | Upstream provider failure |
| `503` | Service temporarily unavailable |

## 8. Core Models

### Page Session

```json
{
  "id": "uuid",
  "source_type": "url",
  "source_url": "https://example.com",
  "normalized_url": "https://example.com/",
  "title": "Example Page",
  "status": "ready",
  "security_status": "allow",
  "accessibility_profile": "senior",
  "summary": "Plain-language summary.",
  "created_at": "2026-07-06T10:00:00Z",
  "updated_at": "2026-07-06T10:00:05Z",
  "expires_at": "2026-07-07T10:00:00Z"
}
```

### Accessible Page Model

```json
{
  "metadata": {
    "title": "Page title",
    "source_url": "https://example.com",
    "language": "en"
  },
  "risk": {
    "decision": "allow",
    "trust_score": 92,
    "warnings": []
  },
  "summary": {
    "short": "One paragraph summary.",
    "key_points": ["Point 1", "Point 2"]
  },
  "key_actions": [
    {
      "label": "Apply online",
      "type": "link",
      "risk_level": "low",
      "source_href": "https://example.com/apply"
    }
  ],
  "sections": [
    {
      "id": "section_1",
      "heading": "Eligibility",
      "plain_text": "Simplified content.",
      "original_text_available": true,
      "reading_order": 1
    }
  ],
  "forms": [],
  "glossary": [],
  "voice": {
    "tts_available": true
  }
}
```

## 9. Health and Metadata

### `GET /v1/health`

Returns service health.

Response:

```json
{
  "status": "ok",
  "api_version": "v1",
  "timestamp": "2026-07-06T10:00:00Z"
}
```

### `GET /v1/capabilities`

Returns enabled platform capabilities.

Response:

```json
{
  "profiles": ["ai_adaptive", "adhd", "dyslexia", "senior"],
  "features": ["url_sessions", "ai_chat", "tts", "uploads"],
  "voice_providers": ["default"],
  "max_upload_bytes": 10485760
}
```

## 10. User and Profile APIs

### `GET /v1/me`

Returns current user, profile, and active preferences.

### `PATCH /v1/me/profile`

Request:

```json
{
  "display_name": "Meera",
  "preferred_language": "en",
  "timezone": "Asia/Calcutta",
  "caregiver_mode_enabled": false
}
```

Validation:

- `preferred_language` must be a supported BCP 47 language tag.
- `timezone` must be a valid IANA timezone.
- `display_name` maximum length is 100 characters.

### `DELETE /v1/me`

Soft-deletes the current user and schedules data deletion according to retention policy.

## 11. Accessibility Preferences APIs

### `GET /v1/accessibility/profiles`

Lists available accessibility profiles.

### `GET /v1/preferences`

Returns user preferences.

### `PATCH /v1/preferences`

Request:

```json
{
  "accessibility_profile_key": "senior",
  "text_size": "extra_large",
  "contrast_mode": "high",
  "simplification_level": "balanced",
  "reading_level": "plain",
  "focus_mode": true,
  "reduced_motion": true,
  "dyslexia_spacing": false,
  "language": "en",
  "history_enabled": false
}
```

Response:

```json
{
  "id": "uuid",
  "accessibility_profile_key": "senior",
  "updated_at": "2026-07-06T10:00:00Z"
}
```

## 12. Page Session APIs

### `POST /v1/page-sessions`

Creates a page session from a URL.

Request:

```json
{
  "source_type": "url",
  "url": "https://example.com/benefits",
  "accessibility_profile_key": "ai_adaptive",
  "options": {
    "generate_summary": true,
    "generate_accessible_page": true,
    "security_scan_level": "standard",
    "voice_ready": false
  }
}
```

Validation:

- `source_type` must be `url`.
- `url` must be HTTP or HTTPS.
- `url` cannot target localhost, private IP ranges, or unsupported schemes.
- `accessibility_profile_key` must exist and be active.
- Request body maximum is 32 KB.

Response `202`:

```json
{
  "id": "uuid",
  "status": "queued",
  "status_url": "/v1/page-sessions/uuid",
  "events_url": "/v1/page-sessions/uuid/events"
}
```

### `GET /v1/page-sessions`

Lists user page sessions.

Query:

- `status`
- `source_type`
- `limit`
- `cursor`

### `GET /v1/page-sessions/{session_id}`

Returns session metadata.

### `GET /v1/page-sessions/{session_id}/accessible-page`

Returns the accessible page model.

### `GET /v1/page-sessions/{session_id}/events`

Streams processing progress with Server-Sent Events.

Event example:

```json
{
  "event": "AccessibilityTransformCompleted",
  "session_id": "uuid",
  "progress": 90,
  "message": "Your simplified page is almost ready."
}
```

### `DELETE /v1/page-sessions/{session_id}`

Deletes a session and associated user-visible artifacts, subject to audit retention.

## 13. AI APIs

### `POST /v1/page-sessions/{session_id}/ai/summarize`

Generates or regenerates a page summary.

Request:

```json
{
  "length": "short",
  "reading_level": "plain",
  "language": "en"
}
```

### `POST /v1/page-sessions/{session_id}/ai/simplify`

Simplifies selected text or section content.

Request:

```json
{
  "section_id": "section_1",
  "simplification_level": "strong",
  "preserve_critical_terms": true
}
```

### `POST /v1/page-sessions/{session_id}/ai/chat`

Answers a grounded question about the page.

Request:

```json
{
  "message": "What do I need to do next?",
  "conversation_id": "uuid-or-null",
  "response_style": "concise"
}
```

Response:

```json
{
  "conversation_id": "uuid",
  "message_id": "uuid",
  "answer": "You need to gather your ID and click Apply.",
  "citations": [
    {
      "section_id": "section_2",
      "label": "Application requirements"
    }
  ],
  "safety_status": "passed"
}
```

### `GET /v1/ai/history`

Lists user AI history with pagination.

### `DELETE /v1/ai/history/{message_id}`

Deletes a user-visible AI history item.

## 14. Translation APIs

### `POST /v1/page-sessions/{session_id}/translate`

Request:

```json
{
  "target_language": "hi",
  "scope": "summary",
  "simplify": true
}
```

Validation:

- `target_language` must be supported.
- `scope` must be `summary`, `section`, or `full_page`.

## 15. Voice APIs

### `GET /v1/voice/preferences`

Returns voice preferences.

### `PATCH /v1/voice/preferences`

Request:

```json
{
  "tts_enabled": true,
  "stt_enabled": true,
  "voice_id": "default_calm",
  "speech_rate": 0.85,
  "language": "en",
  "captions_enabled": true
}
```

### `POST /v1/page-sessions/{session_id}/voice/tts`

Generates speech for a summary, section, or assistant response.

Request:

```json
{
  "target_type": "section",
  "target_id": "section_1",
  "voice_id": "default_calm",
  "speech_rate": 0.90
}
```

Response `202`:

```json
{
  "voice_session_id": "uuid",
  "status": "queued"
}
```

### `POST /v1/voice/stt`

Transcribes uploaded audio.

Request:

- `multipart/form-data`
- Field `audio`
- Optional field `language`

Response:

```json
{
  "voice_session_id": "uuid",
  "transcript": "What does this page mean?",
  "confidence": 0.94,
  "requires_confirmation": false
}
```

### `POST /v1/page-sessions/{session_id}/voice/command`

Executes a safe voice navigation command.

Request:

```json
{
  "command": "read next section"
}
```

Response:

```json
{
  "action": "read_section",
  "target_id": "section_2",
  "requires_confirmation": false
}
```

## 16. Bookmark and Notes APIs

### `POST /v1/bookmarks`

Request:

```json
{
  "page_session_id": "uuid",
  "title": "Benefits page",
  "tags": ["healthcare"]
}
```

### `GET /v1/bookmarks`

Lists bookmarks with pagination.

### `DELETE /v1/bookmarks/{bookmark_id}`

Deletes a bookmark.

### `POST /v1/notes`

Creates a saved note.

Request:

```json
{
  "page_session_id": "uuid",
  "note": "Ask doctor about eligibility."
}
```

### `GET /v1/notes`

Lists saved notes.

### `PATCH /v1/notes/{note_id}`

Updates note text.

### `DELETE /v1/notes/{note_id}`

Deletes a note.

## 17. Document Upload APIs

### `POST /v1/documents`

Uploads a document for simplification.

Request:

- `multipart/form-data`
- Field `file`
- Optional `accessibility_profile_key`

Validation:

- Allowed types: PDF, plain text, HTML, DOCX where supported.
- Maximum size defaults to 10 MB.
- File is malware scanned before processing.

Response:

```json
{
  "document_id": "uuid",
  "page_session_id": "uuid",
  "status": "uploaded"
}
```

### `GET /v1/documents`

Lists uploaded documents.

### `GET /v1/documents/{document_id}`

Returns document metadata.

### `DELETE /v1/documents/{document_id}`

Deletes the document and storage object, subject to retention policy.

## 18. Security APIs

### `POST /v1/security/analyze-url`

Performs a security analysis without creating a full page session.

Request:

```json
{
  "url": "https://example.com"
}
```

Response:

```json
{
  "decision": "allow",
  "trust_score": 92,
  "reasons": ["Valid HTTPS", "No known reputation issues"],
  "findings": []
}
```

### `GET /v1/security/history`

Lists user-visible security history.

### `GET /v1/security/history/{security_history_id}`

Returns a detailed security decision with redacted findings.

### `GET /v1/security/dashboard`

Returns aggregate security data for the current user or tenant.

## 19. Feedback APIs

### `POST /v1/feedback`

Request:

```json
{
  "page_session_id": "uuid",
  "category": "ai",
  "rating": 4,
  "message": "The summary helped, but missed one deadline."
}
```

Validation:

- `category` must be one of `product`, `ai`, `accessibility`, `security`, `voice`, `bug`.
- `rating` must be between 1 and 5.
- `message` maximum length is 4000 characters.

## 20. Analytics APIs

### `POST /v1/analytics/events`

Client telemetry endpoint.

Request:

```json
{
  "event_name": "summary_generated",
  "properties": {
    "source_type": "url",
    "profile": "senior"
  }
}
```

Rules:

- Raw page content is forbidden.
- Form values are forbidden.
- Audio transcripts are forbidden unless explicitly categorized as feedback and consented.

## 21. Public API Endpoints

Public API customers use the same core endpoints with API-key authentication, plus tenant-oriented usage endpoints.

### `GET /v1/public/usage`

Returns API usage and quota.

### `POST /v1/public/page-sessions`

Creates a page session for partner integration.

### `POST /v1/public/webhooks`

Registers a completion webhook.

Request:

```json
{
  "url": "https://partner.example.com/saralo-webhook",
  "events": ["page_session.ready", "page_session.failed"]
}
```

## 22. Validation Rules

Global validation:

- Unknown fields are rejected for write endpoints.
- Empty strings are rejected unless explicitly allowed.
- URLs must be normalized before persistence.
- Language tags must be supported.
- Enum values must match documented options.
- User-owned resource IDs must belong to the caller.
- Request IDs and idempotency keys must be logged.

## 23. Idempotency

Write endpoints that create jobs support:

```http
Idempotency-Key: client-generated-key
```

Applies to:

- `POST /v1/page-sessions`
- `POST /v1/documents`
- `POST /v1/page-sessions/{id}/voice/tts`
- `POST /v1/page-sessions/{id}/ai/summarize`
- `POST /v1/public/page-sessions`

## 24. Freeze Decisions

- REST is the primary public contract for MVP.
- Server-Sent Events are used for progress streaming.
- WebSockets may be added later for richer real-time collaboration.
- Accessible page model is the canonical transformed output.
- Page session creation is asynchronous.
- All public endpoints are versioned.
- Supabase JWT is the user auth mechanism.
- API keys are supported for public API and enterprise use.
- Cursor pagination is required for list endpoints.
- All errors use the shared error envelope.

## 25. Review Hardening

- CTO: all future clients use the same headless API contracts.
- Senior Backend Engineer: long-running workflows are asynchronous and idempotent.
- AI Engineer: AI endpoints are page-session scoped and grounded by design.
- Accessibility Engineer: accessible page model is the central response, not generated presentation markup.
- Security Engineer: URL analysis, auth, rate limits, validation, and shared error handling are explicit.
- UX Designer: progress streaming supports reassuring user feedback during slow processing.
- Product Manager: endpoints map directly to MVP workflows and future public API packaging.
- Hackathon Judge: the API supports the complete demo path from URL submission to simplified page, Q&A, and voice.
