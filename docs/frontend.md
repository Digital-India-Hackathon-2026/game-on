Act as an expert frontend engineer. Read the full system specifications and custom UI architectural parameters detailed below to build a complete, beautiful, production-ready React (Vite) single-page application for "Saralo". 

Strict Constraint: Ensure that presentation elements contain zero hardcoded logic. You must decouple state management using the requested hooks, implement global CSS tokens, and ensure the entire app functions correctly.

---

1. SYSTEM ENVIRONMENT & DESIGN TOKENS
Fonts: 
- Primary Text & UI: 'Inter', sans-serif (Weights: 400, 500, 600, 700)
- Headings & Accents: 'Urbanist', sans-serif (Weights: 600, 700)

Global Theme Tokens (Implement via CSS custom properties on :root):
- --color-accent-primary: #A068FF
- --color-bg-dark-900: #060218
- --color-bg-dark-800: #070319
- --color-bg-fallback: #0a0a0a
- --color-text-dark: #000000
- --color-text-light: #ffffff
- --color-border-glow-purple: rgba(217, 161, 255, 1)

Viewport Canvas Background:
Set background: url('https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260624_111401_56af5012-2263-45d3-849a-8688084d7c2a.png&w=1280&q=85') center center / cover no-repeat on the root app container wrapper.

---

2. DECOUPLED CUSTOM HOOKS (BUSINESS LOGIC)

A. Auth Management Layer (useAuth)
- State: user (null | object), isAuthenticated, authLoading, authMethod ('google' | 'email' | 'guest' | null)
- Methods: loginWithGoogle(), loginWithEmail(email, password), loginAsGuest(), logout()
- Behavior: Emulate network simulation delays with state updates. Persist state safely to simulate active sessions.

B. Pipeline Extraction Engine (usePipeline)
- State: currentUrl, validationState ('idle' | 'validating' | 'scanning' | 'extracting' | 'adapting' | 'ready' | 'failed'), errorMsg, pipelineProgress (0 to 100)
- Methods: processUrl(url)
- Behavior: Execute simulated multi-stage timeline orchestration sequence:
  1. URL Validation -> 2. Security Scan -> 3. Firecrawl Extraction -> 4. Accessibility Engine -> 5. AI Cognitive Adaptation Engine -> 6. Complete state transition to live preview dashboard.

C. Numerical Interpolator (useCountUp)
- Signature: useCountUp(targetValue, durationMs, delayMs)
- Behavior: Interpolate values from 0 to target using an easeOutCubic curve exactly after a 1200ms delay.

---

3. CORE APPARATUS & VIEWPORT REGIONS

A. Header Navigation
- Layout: Flexbox row, justify-content: space-between, padding 24px 64px, centered.
- Entrance: Fade-down transition (translateY(-20px) to 0, 0.8s, cubic-bezier(0.22, 1, 0.36, 1)).
- Left Side: 
  * Logo: <img src="https://polo-pecan-73837341.figma.site/_assets/v11/17ae538989a509947a8de3892c644664895e69b1.png" style="height:32px;" alt="Saralo Logo" />
  * Links: "Home", "Accessibility Modes", "AI Features", "How It Works", "Security". Color #000000, 15px, weight 400. Hover animation: Underline expands via scaleX from 0 to 1, transform-origin: left, 0.3s ease.
- Right Side:
  * "Log In" Link: Color #ffffff, 15px, weight 500, white hover underline animation.
  * "Get Started Free" Pill Button: border-radius 50px, background #000000, text #ffffff, padding 12px 26px, 15px, weight 500, overflow hidden, wrapped inside .btn-border-wrap.
  * Rotating Conic Border: Wrapper utilizes a CSS @property --border-angle animating from 0deg to 360deg over 3s linear infinite. Gradient: conic-gradient(from var(--border-angle), #A068FF, #070319, #A068FF, #070319, #A068FF) via inset: -3px padding mask technique.
  * Fill Interaction: Hover slides in accent fill (#A068FF) from left edge (translateX(-100%) to 0) over 0.4s using cubic-bezier(0.22, 1, 0.36, 1).

B. Hero Left Column (Content & Input Pipeline)
- Layout: flex: 0 1 600px, padding-top: 40px.
- Entrance: Fade-up transition (translateY(40px) to 0, 1s, cubic-bezier(0.22, 1, 0.36, 1)).
- Typewriter Heading: Font Urbanist, size 64px, weight 600, line-height 64px, letter-spacing -1.5px. Text: "The Web Was Never Built for Everyone. Saralo Makes It Accessible." First 36 characters are pure #000000, remaining characters are pure #ffffff. Types character-by-character at 35ms intervals after a 400ms delay with a blinking cursor (#A068FF).
- Premium URL Extraction Bar: Placed under text. Input displaying placeholder "Paste any website URL (e.g., https://wikipedia.org)..." with functional inline button "Analyze Website" linked to usePipeline.
- Live Preview Card: Displays real-time validation steps with micro-animations connected to usePipeline.
- Action Row: Appears after typing finishes (delay 3.2s). Contains Primary "Analyze Website" button with rotating conic border wrapper and a right-facing chevron SVG, plus an adjacent Secondary "Try Guest Mode" button.
- Floating User Cursor: Positioned at margin-left 290px, margin-top 40px with an animation delay of 3.6s. Features an arrow cursor filled with #A068FF and a label badge reading "David".

C. Hero Right Column (Concentric Cognitive Ecosystem Visualization)
- Container: Dimensions 720x720px, centered.
- Entrance: Scale-in overlay + opacity fade (scale(0.85) to 1, 1.2s, delay 0.3s).
- Concentric Orbit Rings: 4 structural concentric rings with 1px gradient borders via mask technique using linear-gradient(180deg, rgba(217,161,255,0) 0%, rgba(217,161,255,1) 43%, rgba(217,161,255,0) 100%).
  1. Orbit 1 (Innermost): Diameter 353px, rotates Counter-Clockwise over 30s.
  2. Orbit 2: Diameter 501px, rotates Clockwise over 40s.
  3. Orbit 3: Diameter 649px, rotates Clockwise over 50s.
  4. Orbit 4 (Outermost): Diameter 797px, rotates Counter-Clockwise over 60s.
- Core Hub (Center): Stays perfectly upright via counter-rotation. Displays the useCountUp output rendering text "20k+" (Urbanist, 64px, weight 500) above structural platform text "AI Models".
- Ecosystem Node Placements: Position absolute nodes cleanly on perimeters using standard transform polar rotation to avoid node warping: transform: translate(-50%, -50%) rotate(Xdeg) translate(RadiusPx) rotate(-Xdeg).
  * Node 1 (Orbit 1 @ 270deg): Radius 177px. Asset: 'https://polo-pecan-73837341.figma.site/_assets/v11/aa51718fb3af3637e6d666b6543fc27a175fada6.png'. Glow: Purple shadow. Label: "ADHD Mode".
  * Node 2 (Orbit 2 @ 60deg): Radius 251px. Asset: 'https://polo-pecan-73837341.figma.site/_assets/v11/ca755f7f93c1126fb8bdbf99ab364a33aa9ab272.png'. Glow: Yellow shadow. Label: "Dyslexia Mode".
  * Node 3 (Orbit 2 @ 180deg): Radius 251px. Size: 78px layer. Asset: 'https://polo-pecan-73837341.figma.site/_assets/v11/dc01064c7093dcc32674876ee3cf5e41c4a485c6.png'. Glow: Pink shadow. Label: "Voice Assistant".
  * Node 4 (Orbit 2 @ 300deg): Radius 251px. Asset: 'https://polo-pecan-73837341.figma.site/_assets/v11/d5470a58b02388336141575048720f19a50de832.png'. Glow: Blue shadow. Label: "Security Shield".
  * Node 5 (Orbit 3 @ 130deg): Radius 325px. Size: 88px layer. Asset: 'https://polo-pecan-73837341.figma.site/_assets/v11/018736aa5d0275c4ce56cfebaf2ae3007d81ca1e.png'. Glow: Pink shadow. Label: "Visual Comfort".
  * Node 6 (Orbit 4 @ 30deg): Radius 399px. Asset: 'https://polo-pecan-73837341.figma.site/_assets/v11/c76d8a0b99676de31c014344bfaf75bad090758d.png'. Glow: Purple shadow. Label: "Color Vision".
  * Node 7 (Orbit 4 @ 95deg): Radius 399px. Size: 88px layer. Asset: 'https://polo-pecan-73837341.figma.site/_assets/v11/7b1b5f039de7b54cc9913e96c1923c3b15a157fa.png'. Glow: Orange shadow. Label: "Senior Mode".
  * Node 8 (Orbit 4 @ 220deg): Radius 399px. Size: 88px layer. Asset: 'https://polo-pecan-73837341.figma.site/_assets/v11/9ae171d8895199349755c43fbff00e122221a027.png'. Glow: Hot pink shadow. Label: "Reading Guide".
  * Node 9 (Orbit 4 @ 320deg): Radius 399px. Asset: 'https://polo-pecan-73837341.figma.site/_assets/v11/926c9eb7b4bc1df846fa0e39f0b0dc3fefd80671.png'. Glow: Purple shadow. Label: "AI Chat Engine".
- Arrival Stagger: Every node must trigger a spring entry animation sequence scaling from 0.3 with rotation (-180deg) and blur (10px) to normal sizes, staggered across 0.6s to 2.3s delays. Ensure nodes counter-rotate to stay upright.

D. Infinite Security & Trust Ticker Ribbon
- Layout: Attached at bottom base edge. Infinite horizontal marquee scroll row with loop duration of 20s. Set a linear-gradient transparent alpha mask on left and right bounding container edges.
- Assets: Consists of these 5 unique SVG items repeated exactly 4 times for seamless looping:
  1. 'https://polo-pecan-73837341.figma.site/_assets/v11/1e7b0e6fcc016cd28aec5c68990118b8c54c35a5.svg'
  2. 'https://polo-pecan-73837341.figma.site/_assets/v11/3eac03c183db2ae080d910159211c14843398b61.svg'
  3. 'https://polo-pecan-73837341.figma.site/_assets/v11/17705a4c0023a0e5a99154dfb10582adbbf4260b.svg'
  4. 'https://polo-pecan-73837341.figma.site/_assets/v11/0e5f442b09dc5c248e3e60d40a65505fb1887228.svg'
  5. 'https://polo-pecan-73837341.figma.site/_assets/v11/63f99030ceb459e3c9ab9e429cfa2353491d3816.svg'
- Metrics: Dimensions 137px width, 40px height, object-fit contain. Entrance fade-up animation set to 0.6s delay.

---

4. DEEP PRESENTATION SECTIONS
Build the following downstream structural grid layers styled with modern premium glassmorphism surfaces (background: rgba(255,255,255,0.03), backdrop-filter: blur(12px), border: 1px solid rgba(255,255,255,0.08)):
- Section 1 (Accessibility Modes Grid): Interactive card configurations details for ADHD Focus Mode, Dyslexia Font Adaptation, Visual Comfort Suite, Senior Cognitive Mode, and Reading Guide Bars.
- Section 2 (AI Cognitive Copilot Toolkit): Tabbed layout demonstrating Summarize Context, Explain Complex Terms, Rewrite to Simple Language, Instant Translation, and Visual Concept Explainer tools with interactive transform play area.
- Section 3 (Natural Voice Assistant Engine): Audio-visual panel outlining Voice UI Navigation, Page Audio Transcription, Granular Playback Controls, and Voice Form Filling options.
- Section 4 (Security Shield & Phishing Mitigation Vault): Data panel showing Site Integrity Scoring, Scam Vulnerability Inspection, Phishing Surface Isolation, and Malicious Pattern Detection profiles.
- Section 5 (The System Pipeline Timeline): Complete functional interactive visual multi-step map showing the transition from input submission through structure extraction down to accessibility layout injection.
- Section 6 (Interactive Dashboard Simulator Preview): Functional UI app wireframe mocking tracking widgets for Active Reading Sessions, Notes, Saved Bookmarks, and Profile Tuning Controls.
- Section 7 (FAQ Accordion Hub): Clean, responsive accessibility accordions answers platform behaviors.

---

5. COMPLIANCE & RESPONSIVE BREAKPOINTS
- Accessibility Requirements: Enable keyboard tab navigation focus loops outline (3px solid #A068FF), full semantic markup validation via ARIA labels, and explicit reduced motion rules via media condition tag (@media (prefers-reduced-motion: reduce)) disabling orbits, marquee tracks, and type updates.
- Responsive Rules:
  * @media (max-width: 1280px): Scale circles asset down to 0.85 via transform.
  * @media (max-width: 1024px): Turn layout into column-flex block layout. Set heading to 48px. Scale orbits down to 0.7.
  * @media (max-width: 768px): Hide core header links, scale layout heading to 36px, visualization scale down to 0.5.
  * @media (max-width: 480px): Scale text parameters to 28px, visualization scale to 0.4.

Generate code for the complete web application using clean component patterns. Ensure all files run without issues.