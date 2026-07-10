import type { CSSProperties } from "react";
import logoImg from "../custom/logo.png";

/* ── Orbit Node Data ── */
export type OrbitNode = {
  label: string;
  asset: string;
  angle: number;
  radius: number;
  size: number;
  delay: string;
  glow: string;
  shape: "soft" | "round";
};

export const orbitNodes: OrbitNode[] = [
  {
    label: "ADHD Mode",
    asset: "https://polo-pecan-73837341.figma.site/_assets/v11/aa51718fb3af3637e6d666b6543fc27a175fada6.png",
    angle: 270, radius: 177, size: 78, delay: "0.6s", glow: "#A068FF", shape: "soft",
  },
  {
    label: "Dyslexia Mode",
    asset: "https://polo-pecan-73837341.figma.site/_assets/v11/ca755f7f93c1126fb8bdbf99ab364a33aa9ab272.png",
    angle: 60, radius: 251, size: 78, delay: "0.8s", glow: "#ffd84a", shape: "round",
  },
  {
    label: "Voice Assistant",
    asset: "https://polo-pecan-73837341.figma.site/_assets/v11/dc01064c7093dcc32674876ee3cf5e41c4a485c6.png",
    angle: 180, radius: 251, size: 78, delay: "1s", glow: "#ff9cbe", shape: "round",
  },
  {
    label: "Security Shield",
    asset: "https://polo-pecan-73837341.figma.site/_assets/v11/d5470a58b02388336141575048720f19a50de832.png",
    angle: 300, radius: 251, size: 78, delay: "1.15s", glow: "#246dff", shape: "soft",
  },
  {
    label: "Visual Comfort",
    asset: "https://polo-pecan-73837341.figma.site/_assets/v11/018736aa5d0275c4ce56cfebaf2ae3007d81ca1e.png",
    angle: 130, radius: 325, size: 88, delay: "1.35s", glow: "#ff5bbd", shape: "round",
  },
  {
    label: "Color Vision",
    asset: "https://polo-pecan-73837341.figma.site/_assets/v11/c76d8a0b99676de31c014344bfaf75bad090758d.png",
    angle: 30, radius: 399, size: 82, delay: "1.55s", glow: "#7b4dff", shape: "round",
  },
  {
    label: "Astigmatism Mode",
    asset: "https://polo-pecan-73837341.figma.site/_assets/v11/7b1b5f039de7b54cc9913e96c1923c3b15a157fa.png",
    angle: 95, radius: 399, size: 88, delay: "1.75s", glow: "#ff9f2f", shape: "soft",
  },
  {
    label: "Reading Guide",
    asset: "https://polo-pecan-73837341.figma.site/_assets/v11/9ae171d8895199349755c43fbff00e122221a027.png",
    angle: 220, radius: 399, size: 88, delay: "2s", glow: "#ff4fb0", shape: "soft",
  },
  {
    label: "AI Chat Engine",
    asset: "https://polo-pecan-73837341.figma.site/_assets/v11/926c9eb7b4bc1df846fa0e39f0b0dc3fefd80671.png",
    angle: 320, radius: 399, size: 82, delay: "2.3s", glow: "#b576ff", shape: "round",
  },
];

export function orbitNodeStyle(node: OrbitNode): CSSProperties {
  return {
    "--angle": `${node.angle}deg`,
    "--radius": `${node.radius}px`,
    "--node-size": `${node.size}px`,
    "--node-delay": node.delay,
    "--node-glow": node.glow,
  } as CSSProperties;
}

/* ── Trust Logos ── */
export const trustLogos = [
  "https://polo-pecan-73837341.figma.site/_assets/v11/1e7b0e6fcc016cd28aec5c68990118b8c54c35a5.svg",
  "https://polo-pecan-73837341.figma.site/_assets/v11/3eac03c183db2ae080d910159211c14843398b61.svg",
  "https://polo-pecan-73837341.figma.site/_assets/v11/17705a4c0023a0e5a99154dfb10582adbbf4260b.svg",
  "https://polo-pecan-73837341.figma.site/_assets/v11/0e5f442b09dc5c248e3e60d40a65505fb1887228.svg",
  "https://polo-pecan-73837341.figma.site/_assets/v11/63f99030ceb459e3c9ab9e429cfa2353491d3816.svg",
];

/* ── Accessibility Modes ── */
export type AccessibilityMode = {
  title: string;
  problem: string;
  resolution: string;
  parameter: string;
  simId: string;
  subtitle?: string;
  description?: string;
  icon: string;
  glow: string;
};

export const modes: AccessibilityMode[] = [
  {
    title: "ADHD Focus Mode",
    subtitle: "ISOLATION & FOCUS",
    description: "Dims distractions, reduces visual noise, and creates a spotlight window so you can focus on one section at a time.",
    problem: "",
    resolution: "",
    parameter: "",
    icon: "https://polo-pecan-73837341.figma.site/_assets/v11/aa51718fb3af3637e6d666b6543fc27a175fada6.png",
    glow: "#A068FF",
    simId: "adhd",
  },
  {
    title: "Dyslexia Adaptation",
    subtitle: "READABLE & WARM",
    description: "Applies a warm tint, increases letter spacing, and softens contrast to reduce letter crowding and visual stress.",
    problem: "",
    resolution: "",
    parameter: "",
    icon: "https://polo-pecan-73837341.figma.site/_assets/v11/ca755f7f93c1126fb8bdbf99ab364a33aa9ab272.png",
    glow: "#ffd84a",
    simId: "dyslexia",
  },
  {
    title: "Low Vision Suite",
    subtitle: "HIGH CONTRAST & ZOOM",
    problem: "",
    resolution: "Large readable typography, high contrast, persistent zoom, and settings-driven reading assists.",
    parameter: "Responsive reflow, cleaner hit targets, on-demand image reading, and page-preserving magnification.",
    icon: "https://polo-pecan-73837341.figma.site/_assets/v11/018736aa5d0275c4ce56cfebaf2ae3007d81ca1e.png",
    glow: "#ff5bbd",
    simId: "low-vision",
  },
  {
    title: "Astigmatism Mode",
    subtitle: "SHARP EDGES & LOW GLARE",
    description: "Sharpens text, reduces glare, and adds gentle spacing to make blurred or streaked content easier to read.",
    problem: "",
    resolution: "",
    parameter: "",
    icon: "https://polo-pecan-73837341.figma.site/_assets/v11/7b1b5f039de7b54cc9913e96c1923c3b15a157fa.png",
    glow: "#ff9f2f",
    simId: "astigmatism",
  },
  {
    title: "Color Blindness Mode",
    subtitle: "PROTAN/DEUTAN/TRITAN",
    problem: "",
    resolution: "Applies professional real-time SVG color matrices for Protan/Deutan/Tritan.",
    parameter: "High-fidelity color matrices replacing basic CSS filters.",
    icon: "https://polo-pecan-73837341.figma.site/_assets/v11/c76d8a0b99676de31c014344bfaf75bad090758d.png",
    glow: "#7b4dff",
    simId: "colorblind",
  },
  {
    title: "Cognitive Overload Mode",
    subtitle: "CLEAN & CALM READER",
    problem: "Sensory overload from too much visual noise and complexity.",
    resolution: "\"Fix This UI\" instantly wipes visual noise, replacing it with a clean reader view.",
    parameter: "Simulated stress banners, audio alerts, and overlay popup loops.",
    icon: "https://polo-pecan-73837341.figma.site/_assets/v11/926c9eb7b4bc1df846fa0e39f0b0dc3fefd80671.png",
    glow: "#A068FF",
    simId: "cognitive-overload",
  },
];

/* ── AI Copilot Tools ── */
export const copilotTools = [
  "Summarize Context",
  "Explain Complex Terms",
  "Rewrite Simply",
  "Instant Translation",
  "Visual Explainer",
];

/* ── Voice Actions ── */
export const voiceActions = [
  "Voice UI Navigation",
  "Page Audio Transcription",
  "Granular Playback Controls",
  "Voice Form Filling",
];

/* ── Security Trust Metrics ── */
export const trustMetrics = [
  "Site Integrity Scoring",
  "Scam Vulnerability Inspection",
  "Phishing Surface Isolation",
  "Malicious Pattern Detection",
];

/* ── Pipeline Timeline ── */
export type TimelineStep = {
  title: string;
  description: string;
};

export const timeline: TimelineStep[] = [
  { title: "Paste Target URL", description: "User submits any live address into Saralo." },
  { title: "Security & Validation Scrub", description: "Checks site safety and parses domain structure." },
  { title: "Firecrawl Extraction", description: "Scrapes semantic elements and raw copy instantly." },
  { title: "AI Cognitive Architecture Mapping", description: "AI redesigns layout parameters based on user profile." },
  { title: "Dynamic Accessibility Layer Injection", description: "Delivers a clean, accessible, personalized user experience." },
];

/* ── Dashboard Items ── */
export const dashboardItems = [
  "Recent adaptive history",
  "Active reading sessions",
  "Notes and bookmarks",
  "Personalized profile settings",
];

/* ── FAQ Entries ── */
export type FaqEntry = {
  question: string;
  answer: string;
};

export const faqs: FaqEntry[] = [
  {
    question: "How does Saralo adapt layouts without breaking functionality?",
    answer: "Saralo keeps the original page intent intact, then adds an accessibility layer that reorganizes reading order, labels, spacing, and assistance.",
  },
  {
    question: "Is my browsing data safe and private?",
    answer: "The demo uses local mock state. In production, Saralo should minimize retained data, isolate risky content, and only store settings the user chooses.",
  },
  {
    question: "Can I use my voice to control any website?",
    answer: "Saralo is designed for voice-first navigation patterns, page reading, playback controls, and assisted form filling wherever the page structure allows, with minimal latency.",
  },
];

/* ── Headline ── */
export const headline = "The Web Was Never Built for Everyone. Saralo Makes It Accessible.";
export const headlineSplitIndex = 36;

/* ── Logo URL ── */
export const logoUrl = logoImg;

/* ── Copilot Content ── */
export const denseCopy =
  "Cognitive accessibility tools mediate interaction complexity by interpreting page structure, user intent, sensory load, and comprehension needs before rendering a personalized navigation and reading environment.";

export const simpleCopy =
  "Saralo studies a page, understands what may feel confusing, and rebuilds it into a calmer, clearer version for each person.";
