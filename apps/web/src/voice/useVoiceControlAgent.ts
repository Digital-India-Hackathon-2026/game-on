import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Dispatch, RefObject, SetStateAction } from "react";
import type { AccessibilityModeId, useAdaptiveSession } from "../hooks/useAdaptiveSession";
import { handleUniversalCommand as parseUniversalCommand } from "../services/assistantEngine";

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

export type AssistantIntentName =
  | "READ_PAGE"
  | "SUMMARIZE_PAGE"
  | "SIMPLIFY_PAGE"
  | "OPEN_CART"
  | "OPEN_CHECKOUT"
  | "OPEN_TRACKING"
  | "OPEN_SUPPORT"
  | "SEARCH_PRODUCT"
  | "ADD_FIRST_MATCH_TO_CART"
  | "TURN_ON_ADHD"
  | "TURN_ON_DYSLEXIA"
  | "TURN_ON_LOW_VISION"
  | "TURN_ON_ASTIGMATISM"
  | "TURN_ON_COLOR_BLINDNESS"
  | "TURN_ON_COGNITIVE_OVERLOAD"
  | "INCREASE_TEXT_SIZE"
  | "DECREASE_TEXT_SIZE"
  | "STOP_READING"
  | "GO_BACK"
  | "EXPLAIN_PAGE";

type AssistantStatus = "idle" | "requesting-permission" | "listening" | "thinking" | "speaking" | "error";

type AssistantIntent = {
  language: string;
  intent: AssistantIntentName;
  parameters: Record<string, string>;
  reply: string;
};

type AssistantSettings = {
  continuous: boolean;
  language: string;
  speakFeedback: boolean;
};

type AssistantAuditEntry = {
  id: string;
  transcript: string;
  language: string;
  intent: AssistantIntentName;
  status: string;
  time: string;
};

type AssistantState = {
  transcript: string;
  detectedCommand: string;
  reply: string;
  error: string;
  expanded: boolean;
};

type UseVoiceControlAgentOptions = {
  iframeRef: RefObject<HTMLIFrameElement>;
  session: ReturnType<typeof useAdaptiveSession>;
};

const defaultSettings: AssistantSettings = {
  continuous: false,
  language: "auto",
  speakFeedback: true,
};

const allowedIntents: AssistantIntentName[] = [
  "READ_PAGE",
  "SUMMARIZE_PAGE",
  "SIMPLIFY_PAGE",
  "OPEN_CART",
  "OPEN_CHECKOUT",
  "OPEN_TRACKING",
  "OPEN_SUPPORT",
  "SEARCH_PRODUCT",
  "ADD_FIRST_MATCH_TO_CART",
  "TURN_ON_ADHD",
  "TURN_ON_DYSLEXIA",
  "TURN_ON_LOW_VISION",
  "TURN_ON_ASTIGMATISM",
  "TURN_ON_COLOR_BLINDNESS",
  "TURN_ON_COGNITIVE_OVERLOAD",
  "INCREASE_TEXT_SIZE",
  "DECREASE_TEXT_SIZE",
  "STOP_READING",
  "GO_BACK",
  "EXPLAIN_PAGE",
];

const intentToMode: Partial<Record<AssistantIntentName, AccessibilityModeId>> = {
  TURN_ON_ADHD: "adhd",
  TURN_ON_DYSLEXIA: "dyslexia",
  TURN_ON_LOW_VISION: "low-vision",
  TURN_ON_ASTIGMATISM: "astigmatism",
  TURN_ON_COLOR_BLINDNESS: "colorblind",
  TURN_ON_COGNITIVE_OVERLOAD: "cognitive-overload",
};

export function useVoiceControlAgent({ iframeRef, session }: UseVoiceControlAgentOptions) {
  const [settings, setSettings] = useState<AssistantSettings>(() => loadSettings());
  const [status, setStatus] = useState<AssistantStatus>("idle");
  const [lastTranscript, setLastTranscript] = useState("");
  const [detectedLanguage, setDetectedLanguage] = useState(settings.language === "auto" ? "en" : settings.language);
  const [message, setMessage] = useState("Ready for voice commands.");
  const [audit, setAudit] = useState<AssistantAuditEntry[]>([]);
  const [assistantState, setAssistantState] = useState<AssistantState>({
    transcript: "",
    detectedCommand: "",
    reply: "Tap the mic and speak a command.",
    error: "",
    expanded: false,
  });
  const [transcriptState, setTranscriptState] = useState({
    text: "",
    isFinal: false,
    visible: false,
  });
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const commandTimes = useRef<number[]>([]);
  const [bridgeSupported, setBridgeSupported] = useState(false);

  const language = normalizeRuntimeLanguage(detectedLanguage || settings.language);

  const updateSettings = useCallback((patch: Partial<AssistantSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      window.localStorage.setItem("saralo.voiceAssistant.settings", JSON.stringify(next));
      return next;
    });
  }, []);

  useEffect(() => {
    setBridgeSupported(false);
  }, [session.targetUrl]);

  useEffect(() => {
    const handleBridgeMessage = (event: MessageEvent) => {
      if (event.source === iframeRef.current?.contentWindow && event.data?.type === "SARALO_BRIDGE_READY") {
        setBridgeSupported(true);
      }
    };
    window.addEventListener("message", handleBridgeMessage);
    return () => window.removeEventListener("message", handleBridgeMessage);
  }, [iframeRef]);

  const speak = useCallback(
    (text: string, lang = language) => {
      const clean = sanitize(text, 360);
      setMessage(clean);
      setAssistantState((prev) => ({ ...prev, reply: clean, error: "", expanded: true }));
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

  const executeAssistantIntent = useCallback(
    async (command: AssistantIntent, transcript: string) => {
      if (!allowedIntents.includes(command.intent)) {
        const reply = "I can only run approved Saralo accessibility commands.";
        speak(reply, command.language);
        addAudit(setAudit, transcript, command.language, "EXPLAIN_PAGE", "blocked");
        return;
      }

      const bridged = bridgeSupported && postSupportedBridgeCommand(iframeRef.current, command);
      const mode = intentToMode[command.intent];
      if (mode) {
        session.switchMode(mode);
        speak(command.reply || `Switched to ${mode}.`, command.language);
        addAudit(setAudit, transcript, command.language, command.intent, "executed");
        return;
      }

      switch (command.intent) {
        case "INCREASE_TEXT_SIZE":
          session.updateSettings({ zoom: clamp(session.settings.zoom + 10, 80, 220), textSize: clamp((session.settings.textSize ?? 120) + 10, 100, 220) });
          speak(command.reply || "Text size increased.", command.language);
          addAudit(setAudit, transcript, command.language, command.intent, "executed");
          return;
        case "DECREASE_TEXT_SIZE":
          session.updateSettings({ zoom: clamp(session.settings.zoom - 10, 80, 220), textSize: clamp((session.settings.textSize ?? 120) - 10, 100, 220) });
          speak(command.reply || "Text size decreased.", command.language);
          addAudit(setAudit, transcript, command.language, command.intent, "executed");
          return;
        case "SIMPLIFY_PAGE":
          session.updateSettings({ cognitiveFixed: true, simplifiedLayout: true, removeAds: true, hidePopups: true });
          speak(command.reply || "Simplified layout is on.", command.language);
          addAudit(setAudit, transcript, command.language, command.intent, "executed");
          return;
        case "SUMMARIZE_PAGE":
          session.updateSettings({ summaryMode: "quick" });
          speak(command.reply || "I opened the summary setting. Use settings for detail level.", command.language);
          addAudit(setAudit, transcript, command.language, command.intent, "executed");
          return;
        case "READ_PAGE":
        case "EXPLAIN_PAGE":
          speak(command.reply || `You are viewing ${session.targetUrl}. I can switch modes, simplify the page, summarize, or send supported commands to the site.`, command.language);
          addAudit(setAudit, transcript, command.language, command.intent, "saralo-side");
          return;
        case "STOP_READING":
          window.speechSynthesis?.cancel();
          setStatus("idle");
          setMessage("Stopped reading.");
          setAssistantState((prev) => ({ ...prev, reply: "Stopped reading.", expanded: true }));
          addAudit(setAudit, transcript, command.language, command.intent, "executed");
          return;
        case "GO_BACK":
          window.history.back();
          speak(command.reply || "Going back.", command.language);
          addAudit(setAudit, transcript, command.language, command.intent, "executed");
          return;
        case "OPEN_CART":
        case "OPEN_CHECKOUT":
        case "OPEN_TRACKING":
        case "OPEN_SUPPORT":
        case "SEARCH_PRODUCT":
        case "ADD_FIRST_MATCH_TO_CART":
          speak(
            bridged
              ? command.reply || "I sent that command to the website."
              : command.reply || "This website has not enabled Saralo command support yet. I can keep the page visible and guide you from here.",
            command.language
          );
          addAudit(setAudit, transcript, command.language, command.intent, bridged ? "posted-to-iframe" : "needs-site-support");
          return;
      }
    },
    [bridgeSupported, iframeRef, session, speak]
  );

  const parseCommandWithAI = useCallback(async (inputText: string): Promise<AssistantIntent> => {
    try {
      const response = await fetch("/api/voice-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: inputText, allowedIntents, targetUrl: session.targetUrl }),
      });
      if (!response.ok) throw new Error("intent_api_unavailable");
      const data = await response.json();
      return validateAssistantIntent(data, inputText);
    } catch {
      return parseCommandFallback(inputText, navigator.language || "en");
    }
  }, [session.targetUrl]);

  const handleUniversalCommand = useCallback(
    async (inputText: string) => {
      const cleanTranscript = sanitize(inputText, 500);
      if (!cleanTranscript) return;
      setStatus("thinking");
      setLastTranscript(cleanTranscript);
      setTranscriptState({ text: cleanTranscript, isFinal: true, visible: true });
      setAssistantState((prev) => ({ ...prev, transcript: cleanTranscript, error: "", expanded: true }));
      window.setTimeout(() => {
        setTranscriptState((prev) => (prev.text === cleanTranscript ? { ...prev, visible: false } : prev));
      }, 4000);

      if (!allowCommand(commandTimes.current)) {
        const reply = "Please pause for a moment before giving another voice command.";
        setStatus("error");
        speak(reply);
        return;
      }

      const command = await parseCommandWithAI(cleanTranscript);
      setDetectedLanguage(command.language || inferLanguage(cleanTranscript, navigator.language || "en"));
      setAssistantState((prev) => ({
        ...prev,
        detectedCommand: command.intent,
        reply: command.reply,
        error: "",
        expanded: true,
      }));
      await executeAssistantIntent(command, cleanTranscript);
    },
    [executeAssistantIntent, parseCommandWithAI, speak]
  );

  const startListening = useCallback(async () => {
    const SpeechRecognition = (window as BrowserWindowWithSpeech).SpeechRecognition || (window as BrowserWindowWithSpeech).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      const error = "Speech recognition is not available in this browser.";
      setStatus("error");
      setAssistantState((prev) => ({ ...prev, error, expanded: true }));
      speak(error);
      return;
    }

    try {
      setStatus("requesting-permission");
      await navigator.mediaDevices?.getUserMedia({ audio: true });
    } catch {
      const error = "Please allow microphone access to use voice commands.";
      setStatus("error");
      setAssistantState((prev) => ({ ...prev, error, expanded: true }));
      speak(error);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = settings.language === "auto" ? navigator.language || "en" : settings.language;
    recognition.continuous = settings.continuous;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => {
      setStatus("listening");
      setAssistantState((prev) => ({ ...prev, error: "", expanded: true }));
    };
    recognition.onend = () => setStatus((prev) => (prev === "listening" || prev === "requesting-permission" ? "idle" : prev));
    recognition.onerror = () => {
      const error = "I could not hear that clearly. Please try again.";
      setStatus("error");
      setAssistantState((prev) => ({ ...prev, error, expanded: true }));
    };
    recognition.onresult = (event) => {
      let interim = "";
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        if (result.isFinal) {
          const transcript = result[0].transcript;
          setDetectedLanguage(settings.language === "auto" ? inferLanguage(transcript, navigator.language || "en") : settings.language);
          void handleUniversalCommand(transcript);
        } else {
          interim += result[0].transcript;
        }
      }
      if (interim) {
        setTranscriptState({ text: interim, isFinal: false, visible: true });
        setAssistantState((prev) => ({ ...prev, transcript: interim, expanded: true }));
      }
    };
    recognitionRef.current = recognition;
    recognition.start();
  }, [handleUniversalCommand, settings.continuous, settings.language, speak]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    window.speechSynthesis?.cancel();
    setStatus("idle");
  }, []);

  const dashboard = useMemo(
    () => ({
      availableElements: 0,
      undoAvailable: false,
      commandCount: audit.length,
    }),
    [audit.length]
  );

  return {
    settings,
    updateSettings,
    status,
    lastTranscript,
    detectedLanguage,
    message,
    audit,
    pendingConfirmation: null,
    dashboard,
    startListening,
    stopListening,
    speak,
    parseCommandWithAI,
    executeAssistantIntent,
    handleUniversalCommand,
    processTranscript: handleUniversalCommand,
    confirmPending: () => undefined,
    cancelPending: () => undefined,
    transcriptState,
    assistantState,
    setAssistantExpanded: (expanded: boolean) => setAssistantState((prev) => ({ ...prev, expanded })),
  };
}

function validateAssistantIntent(data: unknown, inputText: string): AssistantIntent {
  const candidate = data && typeof data === "object" ? data as Partial<AssistantIntent> : {};
  const intent = typeof candidate.intent === "string" && allowedIntents.includes(candidate.intent as AssistantIntentName)
    ? candidate.intent as AssistantIntentName
    : parseCommandFallback(inputText, navigator.language || "en").intent;
  return {
    language: sanitize(String(candidate.language || inferLanguage(inputText, navigator.language || "en")), 32) || "en",
    intent,
    parameters: sanitizeParameters(candidate.parameters),
    reply: sanitize(String(candidate.reply || fallbackReply(intent)), 220),
  };
}

function parseCommandFallback(inputText: string, browserLanguage: string): AssistantIntent {
  const language = inferLanguage(inputText, browserLanguage);
  const parsed = parseUniversalCommand(inputText);
  const intent = allowedIntents.includes(parsed.intent as AssistantIntentName)
    ? parsed.intent as AssistantIntentName
    : "EXPLAIN_PAGE";

  return {
    language,
    intent,
    parameters: parsed.parameters ?? {},
    reply: parsed.intent === "UNKNOWN" ? fallbackReply("EXPLAIN_PAGE") : parsed.reply,
  };
}

function postSupportedBridgeCommand(iframe: HTMLIFrameElement | null, command: AssistantIntent): boolean {
  if (!iframe?.contentWindow) return false;
  if (!["OPEN_CART", "OPEN_CHECKOUT", "OPEN_TRACKING", "OPEN_SUPPORT", "SEARCH_PRODUCT", "ADD_FIRST_MATCH_TO_CART"].includes(command.intent)) {
    return false;
  }
  iframe.contentWindow.postMessage(
    {
      type: "SARALO_ASSISTANT_COMMAND",
      intent: command.intent,
      parameters: command.parameters,
    },
    "*"
  );
  return true;
}

function loadSettings(): AssistantSettings {
  try {
    const stored = window.localStorage.getItem("saralo.voiceAssistant.settings");
    return stored ? { ...defaultSettings, ...JSON.parse(stored) } : defaultSettings;
  } catch {
    return defaultSettings;
  }
}

function sanitizeParameters(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object") return {};
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, entry]) => [sanitize(key, 40), sanitize(String(entry ?? ""), 120)])
  );
}

function addAudit(
  setAudit: Dispatch<SetStateAction<AssistantAuditEntry[]>>,
  transcript: string,
  language: string,
  intent: AssistantIntentName,
  status: string
) {
  setAudit((prev) => [
    { id: crypto.randomUUID(), transcript, language, intent, status, time: new Date().toLocaleTimeString() },
    ...prev.slice(0, 7),
  ]);
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

function fallbackReply(intent: AssistantIntentName, query = "") {
  const replies: Record<AssistantIntentName, string> = {
    READ_PAGE: "I can read Saralo guidance aloud. The website itself stays protected in the frame.",
    SUMMARIZE_PAGE: "Summary mode is ready in Saralo settings.",
    SIMPLIFY_PAGE: "I simplified the page view from Saralo.",
    OPEN_CART: "Opening cart if this website supports Saralo commands.",
    OPEN_CHECKOUT: "Opening checkout if this website supports Saralo commands.",
    OPEN_TRACKING: "Opening tracking if this website supports Saralo commands.",
    OPEN_SUPPORT: "Opening support if this website supports Saralo commands.",
    SEARCH_PRODUCT: query ? `Searching for ${query} if this website supports Saralo commands.` : "Searching if this website supports Saralo commands.",
    ADD_FIRST_MATCH_TO_CART: "Adding the first match if this website supports Saralo commands.",
    TURN_ON_ADHD: "ADHD Focus Mode is on.",
    TURN_ON_DYSLEXIA: "Dyslexia Adaptation is on.",
    TURN_ON_LOW_VISION: "Low Vision Suite is on.",
    TURN_ON_ASTIGMATISM: "Astigmatism Mode is on.",
    TURN_ON_COLOR_BLINDNESS: "Color Blindness Mode is on.",
    TURN_ON_COGNITIVE_OVERLOAD: "Cognitive Overload Mode is on.",
    INCREASE_TEXT_SIZE: "Text size increased.",
    DECREASE_TEXT_SIZE: "Text size decreased.",
    STOP_READING: "Stopped reading.",
    GO_BACK: "Going back.",
    EXPLAIN_PAGE: "I can switch modes, summarize, simplify, read, search, or send supported commands to the website.",
  };
  return replies[intent];
}

function sanitize(input: string, max = 260): string {
  return input.replace(/[<>`{}]/g, "").replace(/\s+/g, " ").trim().slice(0, max);
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

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
