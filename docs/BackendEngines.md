# Saralo Backend Engines

This implementation adds the backend systems requested after the AI Engine:

- `/accessibility`: plugin-based Accessibility Engine with auto-registered built-in profiles.
- `/voice`: adapter-backed Voice Engine with STT, TTS, sessions, preferences, profiles, commands, and history.
- `/security`: deterministic Security Engine with URL validation, analyzers, trust score, reports, safe navigation, and history.
- `/api`: headless REST v1 route layer with typed request/response models, middleware, route manifest, controllers, and OpenAPI generation.

The modules are deliberately framework-neutral so they can be used by the future API app, worker app, public API, Chrome extension backend flows, or tests without coupling business logic to HTTP handlers.

Run architecture tests:

```bash
npm.cmd test
```
