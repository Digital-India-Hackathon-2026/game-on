import { useCallback, useMemo, useRef, useState } from "react";
import type { Dispatch, RefObject, SetStateAction } from "react";

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: ArrayLike<{
    isFinal: boolean;
    0: { transcript: string; confidence?: number };
  }>;
};

type BrowserWindowWithSpeech = Window & {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
};

type AgentStatus = "idle" | "requesting-permission" | "listening" | "thinking" | "needs-confirmation" | "speaking" | "error";
type ActionType = "click" | "type" | "scroll" | "navigate" | "undo" | "unknown";

type VoiceControlSettings = {
  enabled: boolean;
  continuous: boolean;
  language: string;
  speakFeedback: boolean;
  requireDestructiveConfirmation: boolean;
};

type ElementManifest = {
  id: string;
  tag: string;
  visibleText: string;
  ariaLabel: string;
  role: string;
  inputType: string;
  href: string;
  destructive: boolean;
  position: { top: number; left: number; width: number; height: number };
  index: number;
  color: string;
  backgroundColor: string;
  proximityText: string;
};

type ParsedIntent = {
  action: ActionType;
  targetDescription: string;
  value?: string;
  confidence: number;
  clarifyingQuestion?: string;

  actions?: Array<{
    action: ActionType;
    targetDescription: string;
    value?: string;
    confidence: number;
    clarifyingQuestion?: string;
  }>;
  language?: string;
  needsClarification?: boolean;
};

type PendingConfirmation = {
  intent: ParsedIntent;
  element: ElementManifest | null;
};

type AuditEntry = {
  id: string;
  transcript: string;
  language: string;
  action: ActionType;
  target: string;
  status: string;
  time: string;
};

type UndoEntry =
  | { kind: "input"; element: HTMLInputElement | HTMLTextAreaElement; previousValue: string }
  | { kind: "scroll"; win: Window; previousX: number; previousY: number };

const defaultSettings: VoiceControlSettings = {
  enabled: true,
  continuous: false,
  language: "auto",
  speakFeedback: true,
  requireDestructiveConfirmation: true
};

const actionWords = {
  click: ["click", "press", "tap", "open", "select", "choose", "क्लिक", "दबाओ", "खोलो", "seleccionar", "abrir", "cliquer", "ouvrir"],
  type: ["type", "write", "enter", "fill", "input", "लिख", "भरो", "escribe", "rellena", "écris", "remplis"],
  scroll: ["scroll", "go down", "go up", "नीचे", "ऊपर", "desplaza", "abajo", "arriba", "défile"],
  navigate: ["go to", "navigate", "visit", "जाओ", "visita", "aller"],
  undo: ["undo", "revert", "वापस", "पूर्ववत", "deshacer", "annuler"]
};

const localizedFallbacks: Record<string, { clarify: string; done: string; confirm: string; permission: string; unsupported: string; undone: string }> = {
  en: {
    clarify: "I did not catch that. Which page control should I use?",
    done: "Done.",
    confirm: "Please confirm before I do that.",
    permission: "Please allow microphone access to use voice control.",
    unsupported: "Voice recognition is not available in this browser.",
    undone: "Undone."
  },
  hi: {
    clarify: "मैं समझ नहीं पाया। मुझे कौन सा नियंत्रण इस्तेमाल करना चाहिए?",
    done: "हो गया।",
    confirm: "ऐसा करने से पहले कृपया पुष्टि करें।",
    permission: "वॉइस कंट्रोल के लिए माइक्रोफोन अनुमति दें।",
    unsupported: "इस ब्राउज़र में वॉइस पहचान उपलब्ध नहीं है।",
    undone: "पूर्ववत कर दिया।"
  },
  es: {
    clarify: "No entendí. ¿Qué control de la página debo usar?",
    done: "Listo.",
    confirm: "Confirma antes de que haga eso.",
    permission: "Permite el micrófono para usar el control por voz.",
    unsupported: "El reconocimiento de voz no está disponible en este navegador.",
    undone: "Deshecho."
  },
  fr: {
    clarify: "Je n'ai pas compris. Quel contrôle dois-je utiliser ?",
    done: "C'est fait.",
    confirm: "Veuillez confirmer avant que je fasse cela.",
    permission: "Autorisez le microphone pour utiliser la commande vocale.",
    unsupported: "La reconnaissance vocale n'est pas disponible dans ce navigateur.",
    undone: "Annulé."
  }
};

export function useVoiceControlAgent(iframeRef: RefObject<HTMLIFrameElement>) {
  const [settings, setSettings] = useState<VoiceControlSettings>(() => loadSettings());
  const [status, setStatus] = useState<AgentStatus>("idle");
  const [lastTranscript, setLastTranscript] = useState("");
  const [detectedLanguage, setDetectedLanguage] = useState(settings.language === "auto" ? "en" : settings.language);
  const [message, setMessage] = useState("Ready for voice commands.");
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [pendingConfirmation, setPendingConfirmation] = useState<PendingConfirmation | null>(null);
  const undoStack = useRef<UndoEntry[]>([]);
  const [shortTermMemory, setShortTermMemory] = useState<Array<{ command: string; action: string; status: string }>>([]);
  const commandTimes = useRef<number[]>([]);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const [transcriptState, setTranscriptState] = useState<{
    text: string;
    isFinal: boolean;
    visible: boolean;
  }>({ text: "", isFinal: false, visible: false });

  const language = normalizeRuntimeLanguage(detectedLanguage || settings.language);

  const updateSettings = useCallback((patch: Partial<VoiceControlSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      window.localStorage.setItem("saralo.voiceControl.settings", JSON.stringify(next));
      return next;
    });
  }, []);

  const speak = useCallback(
    (text: string, lang = language) => {
      const clean = sanitize(text);
      setMessage(clean);
      if (!settings.speakFeedback || !("speechSynthesis" in window)) return;
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(clean);
      utterance.lang = lang === "auto" ? "en" : lang;
      utterance.rate = 0.96;
      setStatus("speaking");
      utterance.onend = () => setStatus("idle");
      window.speechSynthesis.speak(utterance);
    },
    [language, settings.speakFeedback]
  );

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setStatus("idle");
  }, []);

  const processTranscript = useCallback(
    (transcript: string, confidence = 0.9) => {
      const cleanTranscript = sanitize(transcript);
      setLastTranscript(cleanTranscript);
      setTranscriptState({ text: cleanTranscript, isFinal: true, visible: true });
      setTimeout(() => {
        setTranscriptState((prev) => (prev.text === cleanTranscript ? { ...prev, visible: false } : prev));
      }, 4000);

      setStatus("thinking");
      if (!allowCommand(commandTimes.current)) {
        speak("Please pause for a moment before giving another voice command.");
        addAudit(setAudit, cleanTranscript, language, "unknown", "", "rate limited");
        return;
      }

      const intent = parseIntent(cleanTranscript, confidence, shortTermMemory);
      const doc = iframeRef.current?.contentDocument;
      const win = iframeRef.current?.contentWindow;
      if (!doc || !win) {
        speak("The page is still loading. Try again in a moment.");
        addAudit(setAudit, cleanTranscript, language, intent.action, intent.targetDescription, "page unavailable");
        return;
      }

      const actionsToExecute = intent.actions || [intent];

      const runActions = async () => {
        for (let i = 0; i < actionsToExecute.length; i++) {
          const step = actionsToExecute[i];

          if (step.action === "undo") {
            const undone = undoLast(undoStack.current);
            speak(undone ? fallback(language).undone : fallback(language).clarify);
            addAudit(setAudit, cleanTranscript, language, "undo", "last action", undone ? "undone" : "nothing to undo");
            continue;
          }

          if (step.action === "unknown" || step.confidence < 0.58) {
            speak(step.clarifyingQuestion || fallback(language).clarify);
            addAudit(setAudit, cleanTranscript, language, "unknown", step.targetDescription, "needs clarification");
            return;
          }
          if (step.confidence >= 0.58 && step.confidence < 0.85) {
            speak(`I understood you want to ${step.action} the ${step.targetDescription}. Doing that now.`);
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
          // RE-SCAN THE MANIFEST!
          const manifest = buildElementManifest(doc);
          const element = groundIntent(step, manifest);

          if (!element && step.action !== "scroll") {
            speak(step.clarifyingQuestion || fallback(language).clarify);
            addAudit(setAudit, cleanTranscript, language, step.action, step.targetDescription, "no match");
            return;
          }

          if (settings.requireDestructiveConfirmation && requiresConfirmation(step, element)) {
            setPendingConfirmation({ intent: step, element });
            setStatus("needs-confirmation");
            speak(fallback(language).confirm);
            addAudit(setAudit, cleanTranscript, language, step.action, step.targetDescription, "awaiting confirmation");
            return;
          }

          const result = executeIntent(step, element, doc, win, undoStack.current);
          speak(result.ok ? result.message : result.error || fallback(language).clarify);
          addAudit(setAudit, cleanTranscript, language, step.action, step.targetDescription, result.ok ? "executed" : "failed");

          setShortTermMemory((prev) => [
            { command: cleanTranscript, action: step.action, status: result.ok ? "executed" : "failed" },
            ...prev.slice(0, 4)
          ]);

          if (i < actionsToExecute.length - 1) {
            // Wait 500ms between sequential actions to allow page transitions/renders
            await new Promise((resolve) => setTimeout(resolve, 500));
          }
        }
      };

      runActions();
    },
    [iframeRef, language, settings.requireDestructiveConfirmation, speak]
  );

  const startListening = useCallback(async () => {
    if (!settings.enabled) return;
    const SpeechRecognition = (window as BrowserWindowWithSpeech).SpeechRecognition || (window as BrowserWindowWithSpeech).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setStatus("error");
      speak(fallback(language).unsupported);
      return;
    }

    try {
      setStatus("requesting-permission");
      await navigator.mediaDevices?.getUserMedia({ audio: true });
    } catch {
      setStatus("error");
      speak(fallback(language).permission);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = settings.language === "auto" ? navigator.language || "en" : settings.language;
    recognition.continuous = settings.continuous;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => setStatus("listening");
    recognition.onend = () => setStatus((prev) => (prev === "listening" ? "idle" : prev));
    recognition.onerror = (event) => {
      setStatus("error");
      speak(event.error === "not-allowed" ? fallback(language).permission : fallback(language).clarify);
    };
    recognition.onresult = (event) => {
      let interim = "";
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        if (result.isFinal) {
          const transcript = result[0].transcript;
          const resultLanguage = settings.language === "auto" ? inferLanguage(transcript, navigator.language) : settings.language;
          setDetectedLanguage(resultLanguage);
          processTranscript(transcript, result[0].confidence ?? 0.86);
        } else {
          interim += result[0].transcript;
        }
      }
      if (interim) {
        setTranscriptState({ text: interim, isFinal: false, visible: true });
      }
    };
    recognitionRef.current = recognition;
    recognition.start();
  }, [language, processTranscript, settings.continuous, settings.enabled, settings.language, speak]);

  const confirmPending = useCallback(() => {
    if (!pendingConfirmation) return;
    const doc = iframeRef.current?.contentDocument;
    const win = iframeRef.current?.contentWindow;
    if (!doc || !win) return;
    const result = executeIntent(pendingConfirmation.intent, pendingConfirmation.element, doc, win, undoStack.current);
    setPendingConfirmation(null);
    speak(result.ok ? result.message : result.error || fallback(language).clarify);
  }, [iframeRef, language, pendingConfirmation, speak]);

  const dashboard = useMemo(
    () => ({
      availableElements: iframeRef.current?.contentDocument ? buildElementManifest(iframeRef.current.contentDocument).length : 0,
      undoAvailable: undoStack.current.length > 0,
      commandCount: audit.length
    }),
    [audit.length, iframeRef]
  );

  return {
    settings,
    updateSettings,
    status,
    lastTranscript,
    detectedLanguage,
    message,
    audit,
    pendingConfirmation,
    dashboard,
    startListening,
    stopListening,
    confirmPending,
    cancelPending: () => setPendingConfirmation(null),
    processTranscript,
    transcriptState
  };
}

function loadSettings(): VoiceControlSettings {
  try {
    const stored = window.localStorage.getItem("saralo.voiceControl.settings");
    return stored ? { ...defaultSettings, ...JSON.parse(stored) } : defaultSettings;
  } catch {
    return defaultSettings;
  }
}

function buildElementManifest(doc: Document): ElementManifest[] {
  const selector = "button,a,input,textarea,select,[role='button'],[role='link'],[tabindex]";
  return Array.from(doc.querySelectorAll<HTMLElement>(selector))
    .filter((element) => {
      const rect = element.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0 && !element.hasAttribute("disabled") && element.getAttribute("aria-hidden") !== "true";
    })
    .slice(0, 140)
    .map((element, index) => {
      const rect = element.getBoundingClientRect();
      const text = (element.innerText || element.textContent || "").trim();
      const input = element.tagName.toLowerCase() === "input" ? (element as HTMLInputElement) : null;
      const link = element.tagName.toLowerCase() === "a" ? (element as HTMLAnchorElement) : null;
      
      const style = window.getComputedStyle(element);
      const color = style.color || "";
      const backgroundColor = style.backgroundColor || "";
      const parentText = (element.parentElement?.innerText || "").slice(0, 120).trim();
      const siblingText = Array.from(element.parentElement?.children || [])
        .filter(c => c !== element)
        .map(c => (c as HTMLElement).innerText || "")
        .join(" ")
        .slice(0, 120)
        .trim();

      return {
        id: element.id || `voice-element-${index}`,
        tag: element.tagName.toLowerCase(),
        visibleText: text,
        ariaLabel: element.getAttribute("aria-label") || element.getAttribute("title") || input?.placeholder || "",
        role: element.getAttribute("role") || "",
        inputType: input?.type || "",
        href: link?.href || "",
        destructive: isDestructive(`${text} ${element.getAttribute("aria-label") || ""} ${input?.value || ""}`),
        position: { top: rect.top, left: rect.left, width: rect.width, height: rect.height },
        index: index + 1,
        color,
        backgroundColor,
        proximityText: `${parentText} ${siblingText}`.trim().slice(0, 200)
      };
    });
}

function parseIntent(transcript: string, confidence: number, memory?: Array<{ command: string; action: string; status: string }>): ParsedIntent {
  const lower = transcript.toLowerCase();

  // Handle follow-up references
  if (lower.includes("do the same") || lower.includes("do it again") || lower.includes("next one")) {
    const lastExchange = memory?.[0];
    if (lastExchange && lastExchange.action !== "unknown" && lastExchange.action !== "undo") {
      const step: ParsedIntent = {
        action: lastExchange.action as ActionType,
        targetDescription: "next element",
        confidence: confidence * 0.9
      };
      return {
        ...step,
        actions: [step]
      };
    }
  }

  const conjunctions = /\b(?:and then|then|और फिर|y luego|et ensuite|and|और|y|et)\b/i;
  const parts = transcript.split(conjunctions).map(p => p.trim()).filter(Boolean);
  
  if (parts.length > 1) {
    const actions = parts.map(part => parseSingleIntent(part, confidence));
    return {
      action: actions[0].action,
      targetDescription: actions[0].targetDescription,
      value: actions[0].value,
      confidence: confidence,
      actions,
      needsClarification: actions.some(a => a.action === "unknown")
    };
  }
  
  const single = parseSingleIntent(transcript, confidence);
  return {
    ...single,
    actions: [single]
  };
}

function parseSingleIntent(transcript: string, confidence: number): ParsedIntent {
  const lower = transcript.toLowerCase();
  if (matchesAny(lower, actionWords.undo)) return { action: "undo", targetDescription: "last action", confidence };
  if (matchesAny(lower, actionWords.scroll)) {
    const direction = lower.includes("up") || lower.includes("ऊपर") || lower.includes("arriba") ? "up" : "down";
    return { action: "scroll", targetDescription: direction, confidence };
  }
  if (matchesAny(lower, actionWords.type)) {
    const value = extractQuoted(transcript) || transcript.replace(/^(type|write|enter|fill|input|लिखो?|भरो|escribe|rellena|écris|remplis)\s*/i, "").trim();
    return { action: "type", targetDescription: inferTargetAfterPreposition(transcript) || "focused input", value, confidence };
  }
  if (matchesAny(lower, actionWords.navigate)) {
    return { action: "navigate", targetDescription: transcript, value: extractUrl(transcript), confidence: confidence * 0.9 };
  }
  if (matchesAny(lower, actionWords.click)) {
    return { action: "click", targetDescription: stripActionWords(transcript), confidence };
  }
  return { action: "unknown", targetDescription: transcript, confidence: confidence * 0.3 };
}

function groundIntent(intent: ParsedIntent, manifest: ElementManifest[]): ElementManifest | null {
  const target = normalize(intent.targetDescription || intent.value || "");
  
  // 1. Ordinal References matching
  const ordinalPattern = /\b(first|second|third|fourth|fifth|1st|2nd|3rd|4th|5th|पहला|दूसरा|तीसरा|primer|segundo|premier|deuxième)\b/i;
  const match = target.match(ordinalPattern);
  if (match) {
    const word = match[1].toLowerCase();
    const ordinalMap: Record<string, number> = {
      first: 1, "1st": 1, पहला: 1, primer: 1, premier: 1,
      second: 2, "2nd": 2, दूसरा: 2, segundo: 2, deuxième: 2,
      third: 3, "3rd": 3, तीसरा: 3, tercer: 3, troisième: 3,
      fourth: 4, "4th": 4, चौथा: 4, cuarto: 4, quatrième: 4,
      fifth: 5, "5th": 5, पांचवां: 5, quinto: 5, cinquième: 5
    };
    const targetIndex = ordinalMap[word];
    if (targetIndex !== undefined) {
      const typeWords = {
        button: ["button", "btn", "बटन", "botón", "bouton"],
        link: ["link", "a", "लिंक", "enlace", "lien"],
        input: ["input", "textbox", "field", "लिखने", "campo", "champ"]
      };
      
      let candidateTag = "";
      if (Object.values(typeWords.button).some(w => target.includes(w))) {
        candidateTag = "button";
      } else if (Object.values(typeWords.link).some(w => target.includes(w))) {
        candidateTag = "a";
      } else if (Object.values(typeWords.input).some(w => target.includes(w))) {
        candidateTag = "input";
      }
      
      const filtered = manifest.filter(el => {
        if (candidateTag === "button") return el.tag === "button" || el.role === "button";
        if (candidateTag === "a") return el.tag === "a" || el.role === "link";
        if (candidateTag === "input") return ["input", "textarea", "select"].includes(el.tag);
        return true;
      });
      
      if (filtered[targetIndex - 1]) {
        return filtered[targetIndex - 1];
      }
    }
  }

  let best: { element: ElementManifest; score: number } | null = null;
  for (const element of manifest) {
    const haystack = normalize(`${element.visibleText} ${element.ariaLabel} ${element.role} ${element.inputType} ${element.proximityText}`);
    let score = 0;
    for (const token of target.split(" ").filter(Boolean)) {
      if (haystack.includes(token)) score += 2;
    }
    
    if (target.includes("blue") && (element.color.includes("blue") || element.backgroundColor.includes("blue") || element.color.includes("rgb(0,") || element.backgroundColor.includes("rgb(0,"))) {
      score += 3;
    }
    if (target.includes("red") && (element.color.includes("red") || element.backgroundColor.includes("red") || element.color.includes("rgb(25") || element.backgroundColor.includes("rgb(25"))) {
      score += 3;
    }
    if (target.includes("green") && (element.color.includes("green") || element.backgroundColor.includes("green"))) {
      score += 3;
    }

    if (intent.action === "type" && ["input", "textarea", "select"].includes(element.tag)) score += 4;
    if (intent.action === "click" && ["button", "a"].includes(element.tag)) score += 2;
    if (!target && intent.action === "type" && ["input", "textarea"].includes(element.tag)) score += 3;
    if (!best || score > best.score) best = { element, score };
  }
  return best && best.score >= 2 ? best.element : null;
}

function executeIntent(
  intent: ParsedIntent,
  manifestElement: ElementManifest | null,
  doc: Document,
  win: Window,
  undoStack: UndoEntry[]
): { ok: boolean; message: string; error?: string } {
  if (intent.action === "scroll") {
    undoStack.push({ kind: "scroll", win, previousX: win.scrollX, previousY: win.scrollY });
    win.scrollBy({ top: intent.targetDescription === "up" ? -Math.round(win.innerHeight * 0.7) : Math.round(win.innerHeight * 0.7), behavior: "smooth" });
    return { ok: true, message: "Scrolled." };
  }

  const element = findElement(doc, manifestElement);
  if (!element) return { ok: false, message: "", error: "I could not find that control." };

  element.scrollIntoView({ block: "center", inline: "center", behavior: "smooth" });
  element.focus();

  if (intent.action === "type") {
    const tag = element.tagName.toLowerCase();
    if (tag === "input" || tag === "textarea") {
      const input = element as HTMLInputElement | HTMLTextAreaElement;
      undoStack.push({ kind: "input", element: input, previousValue: input.value });
      input.value = intent.value || "";
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
      return { ok: true, message: "Typed." };
    }
    return { ok: false, message: "", error: "That control does not accept text." };
  }

  if (intent.action === "navigate" && intent.value) {
    win.location.href = intent.value;
    return { ok: true, message: "Opening page." };
  }

  element.click();
  return { ok: true, message: "Clicked." };
}

function findElement(doc: Document, manifestElement: ElementManifest | null): HTMLElement | null {
  if (!manifestElement) return doc.activeElement && "tagName" in doc.activeElement ? (doc.activeElement as HTMLElement) : null;
  if (manifestElement.id && !manifestElement.id.startsWith("voice-element-")) {
    return doc.getElementById(manifestElement.id);
  }
  const candidates = buildElementManifest(doc);
  const index = candidates.findIndex((candidate) => candidate.id === manifestElement.id);
  return Array.from(doc.querySelectorAll<HTMLElement>("button,a,input,textarea,select,[role='button'],[role='link'],[tabindex]"))[index] ?? null;
}

function undoLast(stack: UndoEntry[]): boolean {
  const last = stack.pop();
  if (!last) return false;
  if (last.kind === "input") {
    last.element.value = last.previousValue;
    last.element.dispatchEvent(new Event("input", { bubbles: true }));
    return true;
  }
  last.win.scrollTo({ left: last.previousX, top: last.previousY, behavior: "smooth" });
  return true;
}

function requiresConfirmation(intent: ParsedIntent, element: ElementManifest | null): boolean {
  return intent.action === "navigate" || Boolean(element?.destructive) || isDestructive(`${intent.targetDescription} ${intent.value || ""}`);
}

function fallback(language: string) {
  const key = language.split("-")[0];
  return localizedFallbacks[key] || localizedFallbacks.en;
}

function allowCommand(times: number[]): boolean {
  const now = Date.now();
  const recent = times.filter((time) => now - time < 60_000);
  times.length = 0;
  times.push(...recent);
  if (times.length >= 18) return false;
  times.push(now);
  return true;
}

function addAudit(
  setAudit: Dispatch<SetStateAction<AuditEntry[]>>,
  transcript: string,
  language: string,
  action: ActionType,
  target: string,
  status: string
) {
  setAudit((prev) => [
    { id: crypto.randomUUID(), transcript, language, action, target, status, time: new Date().toLocaleTimeString() },
    ...prev.slice(0, 7)
  ]);
}

function matchesAny(input: string, words: string[]): boolean {
  return words.some((word) => input.includes(word));
}

function stripActionWords(input: string): string {
  return [...actionWords.click, ...actionWords.type, ...actionWords.navigate].reduce(
    (text, word) => text.replace(new RegExp(word, "i"), ""),
    input
  ).trim();
}

function extractQuoted(input: string): string {
  return input.match(/["'“”](.*?)["'“”]/)?.[1] ?? "";
}

function extractUrl(input: string): string {
  const match = input.match(/https?:\/\/\S+|www\.\S+/i)?.[0];
  if (!match) return "";
  return match.startsWith("http") ? match : `https://${match}`;
}

function inferTargetAfterPreposition(input: string): string {
  return input.match(/\b(?:in|into|to|on|में|en|dans)\s+(.+)$/i)?.[1] ?? "";
}

function normalize(input: string): string {
  return input.toLowerCase().normalize("NFKD").replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim();
}

function sanitize(input: string): string {
  return input.replace(/[<>`{}]/g, "").replace(/\s+/g, " ").trim().slice(0, 260);
}

function isDestructive(text: string): boolean {
  return /delete|remove|submit|send|pay|purchase|buy|logout|sign out|cancel|erase|हटाओ|मिटाओ|भेजो|pagar|eliminar|supprimer|envoyer/i.test(text);
}

function inferLanguage(transcript: string, browserLanguage: string): string {
  if (/[\u0900-\u097F]/.test(transcript)) return "hi";
  if (/[¿¡ñáéíóú]/i.test(transcript)) return "es";
  if (/[àâçéèêëîïôûùüÿœ]/i.test(transcript)) return "fr";
  return browserLanguage || "en";
}

function normalizeRuntimeLanguage(language: string): string {
  return language === "auto" ? navigator.language || "en" : language;
}
