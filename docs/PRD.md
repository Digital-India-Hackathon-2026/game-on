# Saralo Product Requirements Document

## 1. Vision

Saralo is an AI-powered Cognitive Accessibility Platform that helps people understand, navigate, and complete tasks on complex websites with less stress, confusion, and cognitive load.

The long-term vision is to make the web usable for people who are excluded by dense layouts, jargon-heavy content, multi-step forms, inaccessible interfaces, visual clutter, language barriers, and anxiety-inducing digital experiences.

Saralo should feel like a patient, adaptive browsing companion: it simplifies the page, explains what matters, guides the user through actions, and adjusts the experience to the user's abilities and preferences.

## 2. Mission

Saralo's mission is to make online information and services easier to understand for elderly users, neurodivergent users, people with cognitive disabilities, people with low vision, and anyone who needs a calmer, clearer way to browse the web.

We do this by securely fetching webpages, analyzing their structure and risks, extracting meaningful content, applying accessibility transformations, and presenting a simplified, personalized version inside Saralo.

## 3. Problem Statement

Many essential websites are too complex for users with cognitive or visual accessibility challenges. Healthcare portals, government forms, banking pages, insurance websites, school systems, job applications, and public service websites often contain dense text, confusing navigation, distracting layouts, small controls, unclear instructions, and multi-step processes.

For many users, the result is not minor inconvenience. It can mean missing appointments, abandoning applications, misunderstanding medical or financial information, relying on caregivers for private tasks, or losing access to essential services.

Current accessibility approaches often focus on technical compliance or assistive technology compatibility, but they do not meaningfully simplify the experience for users who struggle with comprehension, memory, attention, sequencing, or decision fatigue.

## 4. Existing Solutions

Existing solutions include:

- Screen readers such as NVDA, JAWS, VoiceOver, and TalkBack.
- Browser accessibility settings such as zoom, reader mode, font scaling, contrast settings, and text-to-speech.
- Accessibility overlays and widgets that add controls for contrast, font size, spacing, and reading aids.
- Read-it-later and reader-view tools that remove ads and simplify article pages.
- Translation tools such as browser-native translation and standalone translation services.
- Summarization tools and AI chatbots that can explain copied text.
- Form autofill and password managers that reduce some repetitive input.
- Website-specific accessibility improvements implemented by individual organizations.

## 5. Why Existing Solutions Fail

Existing solutions are valuable, but they often fail for Saralo's target users because they are fragmented, reactive, and not designed around cognitive accessibility.

Key gaps:

- They improve display but rarely improve understanding.
- They require users to know which tool to use and when.
- They do not reliably simplify workflows across arbitrary websites.
- They often preserve the original information architecture, even when it is confusing.
- They rarely explain consequences, next steps, warnings, or form requirements in plain language.
- They do not personalize the experience based on cognitive needs, reading level, language, attention span, or sensory sensitivity.
- They may help users read the page but not complete the task.
- Accessibility overlays can create a false sense of compliance without solving deeper usability problems.
- Reader modes work best on articles and often break down on forms, dashboards, portals, and transactional pages.
- AI chatbots require copying, pasting, prompting, and judging output quality, which adds cognitive burden.

## 6. Our Solution

Saralo provides an accessible browsing layer for complex websites.

Users paste a URL into Saralo. Saralo securely fetches the webpage, checks for security risks, extracts the meaningful content, analyzes layout and intent, and displays a simplified version inside the platform. The user can then read, listen, translate, ask questions, get step-by-step guidance, and interact with page content in a calmer interface.

Core capabilities:

- URL-based webpage ingestion.
- Secure fetch and risk detection.
- Content extraction and structure analysis.
- Plain-language simplification.
- Personalized accessibility transformations.
- Page summary and key actions.
- Conversational assistance.
- Guided form help.
- Translation support.
- Voice input and voice output.
- Adjustable layouts for reading comfort.
- Warnings for risky, misleading, or sensitive content.

Saralo is not just a reader mode. It is a cognitive accessibility assistant that helps users understand what they are seeing and what to do next.

## 7. Target Audience

Primary users:

- Elderly users who struggle with complex digital services.
- Neurodivergent users, including users with ADHD, autism, dyslexia, or executive function challenges.
- People with cognitive disabilities or acquired cognitive challenges.
- People with low vision or visual processing challenges.
- Users with limited digital literacy.
- Users with limited English proficiency who need translation and simplified explanations.

Secondary users:

- Caregivers helping family members complete online tasks.
- Accessibility advocates and support workers.
- Healthcare, public sector, education, and nonprofit organizations.
- Product teams that want to understand how their websites appear through a cognitive accessibility lens.

## 8. User Personas

### Persona 1: Meera, Elderly Healthcare User

Meera is 72 and uses the internet mainly for healthcare, banking, and government services. She can read English but feels overwhelmed by portals with many buttons, small text, pop-ups, and unclear instructions.

Needs:

- Larger text and simple page structure.
- Clear explanation of what the page is asking.
- Step-by-step help for forms.
- Voice readout for long instructions.
- Reassurance before submitting sensitive information.

Success looks like:

- Meera books an appointment without calling her son for help.

### Persona 2: Alex, Neurodivergent College Student

Alex has ADHD and dyslexia. They can use digital tools but struggle with cluttered pages, long paragraphs, inconsistent layouts, and multi-step processes.

Needs:

- Reduced visual clutter.
- Short summaries.
- Focus mode.
- Dyslexia-friendly reading settings.
- Checklist-style guidance.
- Ability to ask "What do I need to do here?"

Success looks like:

- Alex completes a financial aid form without abandoning it halfway.

### Persona 3: Ravi, Caregiver

Ravi helps his father manage insurance, healthcare, and pension-related websites. He wants his father to be more independent but needs a safer, simpler interface.

Needs:

- Trustworthy summaries of complex information.
- Security warnings for suspicious pages.
- Clear indication of sensitive actions.
- Ability to configure preferences for his father.

Success looks like:

- Ravi sets up Saralo preferences once, and his father can browse essential sites more confidently.

### Persona 4: Lena, Low Vision User

Lena has low vision and visual processing fatigue. She uses browser zoom, but many websites break when zoomed or still feel visually chaotic.

Needs:

- High contrast options.
- Large controls.
- Consistent layout.
- Voice output.
- Reduced animation and distractions.
- Clear headings and navigation.

Success looks like:

- Lena reads and understands a benefits page without fighting the original layout.

## 9. User Stories

### Webpage Simplification

- As a user, I want to paste a URL so Saralo can show me a simpler version of the page.
- As a user, I want Saralo to remove unnecessary clutter so I can focus on the important information.
- As a user, I want dense paragraphs rewritten in plain language so I can understand them quickly.
- As a user, I want important actions highlighted so I know what I can do next.

### Personalization

- As a user, I want to choose larger text, high contrast, or a simpler layout so the page is easier to read.
- As a neurodivergent user, I want a focus mode so I can see one section at a time.
- As a dyslexic user, I want reading-friendly spacing and font options.
- As a caregiver, I want to save accessibility preferences for another user.

### AI Assistance

- As a user, I want to ask questions about a page so I can understand it without rereading everything.
- As a user, I want a short summary so I can decide whether the page matters to me.
- As a user, I want hard words explained simply.
- As a user, I want Saralo to tell me what information I need before starting a form.

### Forms and Tasks

- As a user, I want step-by-step form guidance so I do not feel lost.
- As a user, I want confusing form labels explained in plain language.
- As a user, I want warnings before entering sensitive information.
- As a user, I want a review step before submitting important forms.

### Voice and Language

- As a user, I want the page read aloud so I can listen instead of reading.
- As a user, I want to ask questions by voice.
- As a user, I want content translated into my preferred language.
- As a user, I want translated content to remain simple and clear.

### Safety and Trust

- As a user, I want Saralo to warn me if a page may be unsafe.
- As a user, I want to know when AI is summarizing or transforming content.
- As a user, I want links and actions clearly labeled before I click them.
- As a user, I want my browsing and personal data protected.

## 10. User Journey

### Step 1: Arrival

The user opens Saralo and sees a clear URL input with accessible controls for text size, contrast, voice, language, and simplification level.

### Step 2: URL Entry

The user pastes a website URL. Saralo validates the URL and explains if the link cannot be opened.

### Step 3: Secure Fetch

Saralo fetches the webpage server-side or through an approved secure mechanism. It checks for protocol validity, redirects, suspicious patterns, malware indicators, phishing signals, mixed content, and unsupported page types.

### Step 4: Analysis

Saralo extracts page title, headings, main content, navigation, links, forms, calls to action, warnings, tables, and media descriptions where possible.

### Step 5: Transformation

Saralo generates an accessible version of the page using the user's saved preferences. It may simplify language, restructure content, create summaries, group related actions, and reduce clutter.

### Step 6: Interaction

The user reads, listens, asks questions, translates, changes layout settings, or requests more explanation.

### Step 7: Task Guidance

If the page contains a form or process, Saralo provides step-by-step guidance, explains required fields, and warns the user before sensitive actions.

### Step 8: Completion or Exit

The user completes the task, saves a summary, copies simplified information, returns to the original page, or enters a new URL.

## 11. Functional Requirements

### 11.1 URL Input and Validation

- Provide a clear URL input field.
- Accept standard HTTP and HTTPS URLs.
- Normalize URLs where appropriate.
- Reject unsupported schemes such as `file:`, `javascript:`, and unsafe internal network targets.
- Show plain-language error messages for invalid, blocked, unavailable, or unsupported URLs.
- Maintain a recent URL history only if the user opts in.

### 11.2 Secure Webpage Fetching

- Fetch webpage content through a controlled backend service.
- Follow redirects only within defined safety limits.
- Enforce request timeout limits.
- Enforce response size limits.
- Block access to private IP ranges and localhost targets from server-side fetches.
- Detect unsupported content types.
- Handle static HTML pages first, with future support for JavaScript-rendered pages.

### 11.3 Security Risk Detection

- Detect suspicious URLs, excessive redirects, deceptive domains, insecure protocols, and known risky patterns.
- Warn users before showing content from potentially unsafe pages.
- Identify forms requesting sensitive data such as passwords, payment details, government IDs, health information, or personal contact details.
- Clearly label external links and risky actions.

### 11.4 Content Extraction

- Extract meaningful page content from HTML.
- Preserve source attribution and original URL.
- Identify headings, paragraphs, lists, tables, links, images, buttons, forms, and navigation areas.
- Separate primary content from ads, cookie banners, footers, duplicate navigation, and unrelated sidebars where possible.
- Provide fallback extraction when semantic structure is poor.

### 11.5 Accessibility Transformation

- Generate a simplified page view with consistent layout.
- Provide adjustable text size.
- Provide high contrast and low contrast modes.
- Provide reduced motion mode.
- Provide dyslexia-friendly reading options.
- Provide focus mode for one section at a time.
- Provide plain-language summaries.
- Provide key action extraction.
- Provide glossary-style explanations for difficult terms.
- Provide section-by-section navigation.

### 11.6 AI Simplification and Explanation

- Summarize the full page.
- Summarize each section.
- Rewrite selected content in plain language.
- Explain technical, legal, medical, financial, or bureaucratic terms with appropriate caution.
- Answer user questions using the fetched page as primary context.
- Distinguish between content from the page and AI-generated explanation.
- Avoid inventing facts not present in the source page.
- Provide uncertainty messaging when the source is ambiguous.

### 11.7 Conversational Assistant

- Provide a chat interface for page-specific help.
- Support questions such as:
  - "What is this page about?"
  - "What do I need to do?"
  - "Is this asking for money?"
  - "What information do I need before filling this out?"
  - "Explain this in simpler words."
- Keep responses concise by default.
- Allow the user to request more detail.
- Preserve conversational context within the current page session.

### 11.8 Form Guidance

- Detect forms and form fields.
- Identify required fields.
- Explain field labels and helper text.
- Provide step-by-step guidance.
- Warn before sensitive information entry.
- Support a review checklist before submission.
- Avoid storing sensitive form values unless explicitly required and consented to.
- For the MVP, Saralo may guide users through forms but should not automatically submit forms on behalf of users unless explicitly designed and secured.

### 11.9 Translation

- Translate page summaries and simplified content into supported languages.
- Preserve meaning while using simple language.
- Allow users to view original and translated content.
- Avoid translating proper names, URLs, legal identifiers, and critical labels incorrectly.
- Clearly label translated content as AI-assisted.

### 11.10 Voice Features

- Read summaries, sections, and assistant responses aloud.
- Support play, pause, resume, and stop.
- Support voice input for asking questions.
- Allow voice speed adjustment.
- Use accessible voice controls with large targets.
- Provide captions or text equivalents for all voice output.

### 11.11 User Preferences

- Allow users to configure:
  - Text size.
  - Contrast mode.
  - Reading level.
  - Language.
  - Voice settings.
  - Layout density.
  - Focus mode.
  - Simplification level.
- Store preferences securely.
- Allow guest mode with local or session-only preferences.

### 11.12 Session and History

- Provide an option to save simplified pages or summaries.
- Provide an option to disable history.
- Allow users to delete browsing history.
- Avoid collecting more data than needed.

### 11.13 Admin and Observability

- Track aggregate system health, latency, extraction success, transformation success, and error rates.
- Track product analytics without storing sensitive page content unnecessarily.
- Provide moderation and abuse monitoring for unsafe URL fetching behavior.

## 12. Non-functional Requirements

### Performance

- Initial URL validation should complete in under 1 second.
- Standard webpage fetch and extraction should complete within 5 seconds for typical pages.
- AI summary should begin streaming or display progress within 3 seconds after extraction.
- The simplified interface should remain responsive on low-end devices.

### Reliability

- Gracefully handle failed fetches, unsupported pages, timeouts, and AI failures.
- Provide useful fallback states.
- Ensure user preferences remain available across sessions when saved.

### Scalability

- Support independent scaling of fetching, extraction, AI transformation, and voice services.
- Queue or throttle expensive transformations.
- Protect against abuse through rate limits and usage controls.

### Privacy

- Minimize retention of fetched content.
- Avoid storing sensitive form inputs by default.
- Provide clear privacy controls for history and saved pages.
- Encrypt sensitive data in transit and at rest.

### Compliance Readiness

- Design toward WCAG 2.2 AA or higher.
- Prepare for privacy compliance requirements such as GDPR, CCPA, HIPAA-adjacent caution for health data, and sector-specific obligations where relevant.
- Maintain auditability for security decisions and AI output handling.

### Compatibility

- Support modern desktop and mobile browsers.
- Ensure keyboard-only navigation.
- Ensure screen reader compatibility.
- Support responsive layouts.

### Maintainability

- Keep extraction, risk detection, transformation, and presentation logic modular.
- Maintain clear system boundaries between source content, transformed content, and AI-generated explanations.
- Use test fixtures for representative complex webpages.

## 13. Accessibility Goals

Saralo should be accessible by default, not only configurable after setup.

Goals:

- Meet or exceed WCAG 2.2 AA for Saralo's own interface.
- Provide a simple, consistent, low-clutter layout.
- Use large touch targets.
- Support keyboard navigation across all core workflows.
- Support screen readers with semantic structure and labels.
- Provide high contrast themes.
- Provide reduced motion mode.
- Avoid time pressure where possible.
- Use plain language throughout the product.
- Provide visual, text, and voice alternatives.
- Support cognitive accessibility patterns such as chunking, summaries, step-by-step guidance, progress indicators, confirmation steps, and clear error recovery.

## 14. AI Goals

Saralo's AI should reduce cognitive burden while preserving user trust and source fidelity.

Goals:

- Produce accurate summaries grounded in the fetched page.
- Rewrite content in plain language without changing meaning.
- Explain complex terms with appropriate caution.
- Identify key actions and important warnings.
- Provide page-specific Q&A.
- Adapt reading level and explanation depth to user preference.
- Support multilingual simplification.
- Flag uncertainty and ambiguous source material.
- Avoid hallucinations, unsupported claims, and overconfident advice.
- Distinguish original page content from AI-generated transformations.

AI guardrails:

- Use retrieved page content as the primary source.
- Avoid giving definitive medical, legal, financial, or safety advice.
- Encourage users to verify critical decisions with official sources or trusted professionals.
- Provide citations or references to source sections where feasible.
- Refuse or safely handle malicious pages, prompt injection attempts, and requests to reveal hidden system instructions.

## 15. Voice Goals

Voice should make Saralo easier to use for people who struggle with reading, typing, vision, motor control, or fatigue.

Goals:

- Allow users to hear page summaries and explanations.
- Allow users to ask questions by voice.
- Provide simple voice controls.
- Support slower speech and repeat options.
- Make all voice interactions available through text as well.
- Avoid voice-only critical flows.
- Handle speech recognition errors gracefully.
- Support multilingual voice experiences over time.

## 16. Security Goals

Saralo must be trustworthy because it handles arbitrary URLs, webpage content, and potentially sensitive user tasks.

Goals:

- Prevent server-side request forgery.
- Block private network and localhost fetch targets.
- Sanitize fetched HTML before display.
- Never execute untrusted scripts from fetched pages inside Saralo.
- Isolate transformed content from the application shell.
- Detect phishing and suspicious page patterns.
- Warn users before interacting with sensitive forms.
- Rate limit URL fetching and AI requests.
- Protect user data with encryption in transit and at rest.
- Provide clear privacy controls.
- Maintain logs for abuse prevention without over-collecting personal data.

Security principles:

- Treat all fetched pages as untrusted.
- Treat page text as potentially hostile prompt input.
- Keep original content, AI prompts, and system instructions separated.
- Use least privilege for services and storage.
- Prefer explicit user confirmation before sensitive actions.

## 17. Business Goals

### Short-term Goals

- Build a compelling MVP that demonstrates AI-powered cognitive accessibility.
- Validate that users can understand complex pages faster with Saralo.
- Win hackathon attention through a clear social impact story and functional demo.
- Recruit early testers from elderly users, neurodivergent communities, caregivers, and accessibility advocates.

### Medium-term Goals

- Develop partnerships with healthcare, public sector, education, and nonprofit organizations.
- Offer Saralo as a consumer web app and an enterprise accessibility companion.
- Build a browser extension or embedded accessibility layer.
- Establish credibility through accessibility research, user testing, and expert review.

### Long-term Goals

- Become the default cognitive accessibility layer for the web.
- Provide APIs for organizations to preview and improve cognitive accessibility.
- Support regulated sectors with privacy-first deployments.
- Build a trusted accessibility brand centered on dignity, independence, and comprehension.

## 18. Success Metrics

### User Outcome Metrics

- Task completion rate on complex websites.
- Reduction in time to understand a page.
- Reduction in task abandonment.
- User-reported confidence after using Saralo.
- User-reported cognitive load before and after transformation.
- Percentage of users who complete a task without caregiver assistance.

### Product Metrics

- URL fetch success rate.
- Content extraction success rate.
- AI summary acceptance rate.
- Question-answer helpfulness rating.
- Voice feature usage rate.
- Translation usage rate.
- Saved preference adoption.
- Repeat usage rate.

### Accessibility Metrics

- WCAG 2.2 AA audit score for Saralo interface.
- Keyboard navigation completion rate.
- Screen reader compatibility findings.
- Contrast compliance rate.
- User testing success across target personas.

### AI Quality Metrics

- Summary factuality score.
- Grounded answer rate.
- Hallucination rate.
- Plain-language readability score.
- User correction or confusion rate.
- Unsafe advice incident rate.

### Security Metrics

- Blocked unsafe URL attempts.
- SSRF prevention coverage.
- Sensitive form warning accuracy.
- Security incident count.
- Prompt injection detection rate.
- Data deletion request completion time.

### Business Metrics

- Weekly active users.
- Activation rate from first URL submission.
- Retention after first successful simplified page.
- Number of pilot partners.
- Conversion from free to paid plan, if monetized.
- Accessibility organization endorsements or partnerships.

## 19. MVP Scope

### In Scope

- URL input.
- Secure fetch for public HTTP and HTTPS pages.
- Basic risk detection.
- Main content extraction.
- Simplified page display.
- Plain-language summary.
- Section-based simplification.
- Chat-based page Q&A.
- Basic text size and contrast controls.
- Text-to-speech for summaries and assistant responses.
- User preference settings.
- Clear unsupported-page and error states.

### Out of Scope for MVP

- Automatic form submission.
- Full browser automation for logged-in websites.
- Payment or banking transaction execution.
- Storing sensitive form data.
- Guaranteed extraction from all JavaScript-heavy applications.
- Clinical, legal, or financial decision-making advice.
- Native mobile apps.
- Enterprise admin console.

## 20. Future Roadmap

### Phase 1: Hackathon MVP

- Build URL-to-simplified-page flow.
- Add secure fetch guardrails.
- Add content extraction and summary.
- Add AI Q&A grounded in page content.
- Add text size, contrast, and simplified layout controls.
- Add text-to-speech.
- Demo on healthcare, government, and dense informational pages.

### Phase 2: Guided Task Assistant

- Add form detection.
- Add step-by-step form guidance.
- Add sensitive field warnings.
- Add checklist mode.
- Improve support for tables and documents.
- Add user testing with target audiences.

### Phase 3: Personalization and Accounts

- Add saved user profiles.
- Add caregiver-managed preferences.
- Add reading level presets.
- Add multilingual translation.
- Add history controls and saved summaries.
- Add stronger privacy controls.

### Phase 4: Browser Extension and Partner Pilots

- Launch a browser extension.
- Support live page transformation.
- Build organization pilots with healthcare, education, nonprofit, and public sector partners.
- Add reporting for accessibility insights.

### Phase 5: Enterprise and Platform

- Provide APIs for cognitive accessibility testing.
- Provide site owner dashboards.
- Support private deployments.
- Add compliance reporting.
- Integrate with assistive technology ecosystems.

## 21. Hackathon Value Proposition

Saralo is a high-impact hackathon project because it combines AI, accessibility, security, and real-world social need into one clear product story.

### Why It Matters

The web is where people access healthcare, government services, banking, education, jobs, and community resources. When websites are too complex, people lose independence. Saralo gives that independence back by making the web easier to understand.

### Why AI Is Essential

Traditional accessibility tools can adjust presentation, but AI can help interpret meaning. Saralo uses AI to summarize, simplify, explain, translate, and guide users through complex information. The AI is not a gimmick; it is central to reducing cognitive load.

### Why It Is Differentiated

Saralo focuses on cognitive accessibility, not just visual styling or compliance checklists. It combines secure webpage fetching, risk detection, content extraction, accessibility transformation, conversational help, and voice support in one user-centered platform.

### Demo Story

A judge sees a dense healthcare, government, or insurance page. The page is hard to read, filled with jargon, and visually overwhelming. The user pastes the URL into Saralo. Saralo checks the page, extracts the main content, presents a calm simplified version, summarizes what matters, explains difficult terms, reads the content aloud, and answers "What do I need to do next?"

That moment makes the product immediately understandable: Saralo turns a stressful webpage into a guided, accessible experience.

### Hackathon Judging Strengths

- Clear social impact.
- Strong AI use case.
- Practical accessibility value.
- Security-aware architecture.
- Large addressable audience.
- Strong demo potential.
- Extensible product roadmap.
- Founder-friendly narrative around independence, dignity, and inclusion.

## 22. Key Risks and Mitigations

### Risk: AI Hallucination

Mitigation:

- Ground answers in extracted page content.
- Show source references where possible.
- Add uncertainty language.
- Avoid high-stakes advice.

### Risk: Unsafe URL Fetching

Mitigation:

- Block private networks and unsafe schemes.
- Use strict timeouts and response limits.
- Sanitize all fetched content.
- Never execute untrusted scripts.

### Risk: Poor Extraction Quality

Mitigation:

- Use semantic parsing and fallback extraction.
- Show original source link.
- Allow users to report unclear results.
- Test against representative websites.

### Risk: Over-simplification

Mitigation:

- Preserve access to original text.
- Label AI simplifications.
- Let users adjust simplification level.
- Avoid altering legal, medical, or financial meaning.

### Risk: Privacy Concerns

Mitigation:

- Minimize storage.
- Offer guest mode.
- Allow history deletion.
- Avoid storing sensitive form inputs.
- Be transparent about AI processing.

## 23. Product Principles

- Dignity first: The product should never make users feel incapable.
- Clarity over cleverness: Simple, direct communication wins.
- User control: Users decide how much simplification, voice, translation, and history they want.
- Safety by design: Arbitrary webpage fetching and AI transformation must be treated as security-sensitive.
- Accessibility is core: Saralo's own interface must model the accessibility it promises.
- AI should assist, not override: Saralo helps users understand and decide; it should not silently act on their behalf.

## 24. Frozen MVP Decisions

The following decisions resolve the open questions for the first build and hackathon demo.

- Primary first-test users: elderly users and neurodivergent users, with caregivers included as secondary observers.
- Demo website categories: healthcare, government benefits, insurance, and dense public information pages.
- First product surface: standalone web app backed by a headless API.
- Future product surfaces: Chrome extension, desktop app, mobile app, and public API.
- Default content retention: raw fetched content is not retained by default; sanitized artifacts and summaries expire unless the user saves them.
- First language: English.
- First multilingual support: Hindi and Spanish as early expansion candidates.
- Form support: guidance, explanation, sensitive-field warnings, and review checklists only; no automatic submission in MVP.
- AI evaluation before launch: factuality, source grounding, hallucination rate, readability, safety refusal quality, and accessibility usefulness.
- Security posture: all fetched content is untrusted, and security analysis runs before AI transformation.
- Accessibility posture: every accessibility profile is implemented as a plugin with rules, prompts, and theme tokens.
- Database posture: Supabase Auth and PostgreSQL are the MVP system of record.
- API posture: REST v1 is the frozen external contract for MVP.

## 25. Cross-Functional Review Improvements

### CTO Review

Saralo must stay headless, modular, and event-driven. The product should not embed core intelligence in the frontend because future clients must reuse the same backend capabilities.

### Senior Backend Engineer Review

The MVP should keep the pipeline simple but preserve clean boundaries: page session service, security service, extraction service, AI service, accessibility service, voice service, repositories, and provider adapters.

### AI Engineer Review

AI must be grounded in extracted page content, use prompt isolation, store prompt versions, and label uncertainty. High-stakes advice must be cautious and source-linked.

### Accessibility Engineer Review

Cognitive accessibility is the product center. Profiles must do more than change colors or font sizes; they must shape structure, reading order, wording, voice behavior, and task guidance.

### Security Engineer Review

URL fetching, uploaded documents, generated outputs, and AI prompts are all attack surfaces. SSRF protection, sanitization, prompt injection resistance, and sensitive action warnings are MVP requirements.

### UX Designer Review

The interface should be calm, predictable, and task-focused. The first screen should help users submit a URL and understand the transformed result without marketing clutter.

### Product Manager Review

The first release should optimize for a strong end-to-end demo and measurable user outcomes: comprehension, confidence, task completion, and reduced cognitive load.

### Hackathon Judge Review

The winning story is immediate: paste a difficult page, receive a safer and simpler version, hear it aloud, ask what to do next, and understand risks in plain language.

## 26. Conclusion

Saralo is designed to make the modern web more understandable, navigable, and humane for people who are often left behind by traditional accessibility approaches.

The product opportunity is not just making pages look cleaner. It is helping users comprehend information, make decisions, and complete essential digital tasks with more independence and confidence.
