export type AssistantCommandResult = {
  intent: string;
  parameters?: Record<string, string>;
  reply: string;
};

type CommandRule = {
  intent: string;
  patterns: string[];
  reply: string;
};

const commandRules: CommandRule[] = [
  {
    intent: "OPEN_CART",
    patterns: ["open cart", "cart kholo", "cart open", "cart dikhao", "basket"],
    reply: "Opening cart.",
  },
  {
    intent: "OPEN_CHECKOUT",
    patterns: ["checkout", "checkout kholo", "payment", "pay karna"],
    reply: "Opening checkout.",
  },
  {
    intent: "READ_PAGE",
    patterns: ["read page", "page padho", "read this", "sunao"],
    reply: "Reading the page.",
  },
  {
    intent: "SUMMARIZE_PAGE",
    patterns: ["summarize", "summary", "short mein batao", "short me batao", "brief"],
    reply: "Preparing a short summary.",
  },
  {
    intent: "TURN_ON_LOW_VISION",
    patterns: ["low vision", "text bada karo", "zoom karo", "bada karo"],
    reply: "Turning on Low Vision Suite.",
  },
  {
    intent: "TURN_ON_DYSLEXIA",
    patterns: ["dyslexia mode", "dyslexia"],
    reply: "Turning on Dyslexia Adaptation.",
  },
  {
    intent: "TURN_ON_ADHD",
    patterns: ["adhd mode", "focus mode", "focus karo"],
    reply: "Turning on ADHD Focus Mode.",
  },
  {
    intent: "STOP_READING",
    patterns: ["stop reading", "stop speaking", "chup", "bas"],
    reply: "Stopped reading.",
  },
];

export function handleUniversalCommand(inputText: string): AssistantCommandResult {
  const normalized = normalize(inputText);
  if (!normalized) {
    return {
      intent: "UNKNOWN",
      reply: "Please say a command.",
    };
  }

  const searchQuery = extractSearchQuery(inputText);
  if (searchQuery) {
    return {
      intent: "SEARCH_PRODUCT",
      parameters: { query: searchQuery },
      reply: `Searching for ${searchQuery}.`,
    };
  }

  const rule = commandRules.find((candidate) =>
    candidate.patterns.some((pattern) => normalized.includes(normalize(pattern)))
  );

  if (rule) {
    return {
      intent: rule.intent,
      reply: rule.reply,
    };
  }

  return {
    intent: "UNKNOWN",
    reply: "I did not understand that command yet.",
  };
}

function extractSearchQuery(inputText: string): string {
  const match = inputText.match(/(?:search|find|look for|dhoondo|dhundo|search karo)\s+(.+)$/i);
  return sanitize(match?.[1] || "", 80);
}

function normalize(inputText: string): string {
  return inputText
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function sanitize(inputText: string, maxLength: number): string {
  return inputText.replace(/[<>`{}]/g, "").replace(/\s+/g, " ").trim().slice(0, maxLength);
}
