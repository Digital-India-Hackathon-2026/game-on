export type AITaskType =
  | "simplify"
  | "summarize"
  | "explain"
  | "rewrite"
  | "translate"
  | "reading_guide"
  | "visual_explain"
  | "form_assistant"
  | "checklist"
  | "ask"
  | "conversation"
  | "accessibility_support"
  | "website_explanation"
  | "navigation_guidance"
  | "security_explanation"
  | "predict_next_step"
  | "mistake_detection"
  | "voice_control";

export type AIProviderName =
  | "gemini"
  | "openai"
  | "claude"
  | "deepseek"
  | "llama"
  | "mistral"
  | "azure_openai"
  | "local"
  | "mock";

export type AIEventName =
  | "AI_REQUEST_STARTED"
  | "AI_REQUEST_COMPLETED"
  | "AI_REQUEST_FAILED"
  | "MEMORY_UPDATED"
  | "PROMPT_SELECTED"
  | "MODEL_CHANGED"
  | "HISTORY_SAVED";

export type AISafetyStatus = "passed" | "warned" | "blocked" | "needs_review";
export type AIHistoryStatus = "success" | "failed";
export type AIOutputFormat = "markdown" | "plain_text" | "json";
export type SimplificationLevel = "light" | "balanced" | "strong";
export type ReadingLevel = "original" | "plain" | "simple" | "step_by_step";
export type SecurityDecision = "unknown" | "allow" | "warn" | "restrict" | "block";

export interface AIUserPreferences {
  accessibilityProfileKey?: string;
  simplificationLevel?: SimplificationLevel;
  readingLevel?: ReadingLevel;
  language?: string;
  focusMode?: boolean;
  reducedMotion?: boolean;
  dyslexiaSpacing?: boolean;
  historyEnabled?: boolean;
}

export interface AIVoicePreferences {
  ttsEnabled?: boolean;
  sttEnabled?: boolean;
  voiceId?: string;
  speechRate?: number;
  language?: string;
  captionsEnabled?: boolean;
}

export interface AIPageSection {
  id: string;
  heading?: string;
  text: string;
  readingOrder?: number;
  sourceHref?: string;
  metadata?: Record<string, unknown>;
}

export interface AIWebpageContext {
  pageSessionId?: string;
  title?: string;
  sourceUrl?: string;
  language?: string;
  securityDecision?: SecurityDecision;
  securityWarnings?: string[];
  sections?: AIPageSection[];
  forms?: Array<Record<string, unknown>>;
  links?: Array<Record<string, unknown>>;
  visualElements?: Array<Record<string, unknown>>;
  metadata?: Record<string, unknown>;
}

export interface AIConversationMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface AIMemoryState {
  conversation: AIConversationMessage[];
  session: Record<string, unknown>;
  preferences: Record<string, unknown>;
  context: Record<string, unknown>;
  longTerm?: Record<string, unknown>;
}

export interface AIRequest {
  task: AITaskType;
  input: string;
  userId?: string;
  tenantId?: string;
  conversationId?: string;
  pageSessionId?: string;
  webpage?: AIWebpageContext;
  preferences?: AIUserPreferences;
  voicePreferences?: AIVoicePreferences;
  language?: string;
  outputFormat?: AIOutputFormat;
  provider?: AIProviderName;
  model?: string;
  promptKey?: string;
  metadata?: Record<string, unknown>;
}

export interface AIBuiltContext {
  trustedInstructions: string[];
  taskInstruction: string;
  userInput: string;
  untrustedSections: AIPageSection[];
  security: {
    decision: SecurityDecision;
    warnings: string[];
    promptInjectionDetected: boolean;
  };
  preferences: AIUserPreferences;
  voicePreferences: AIVoicePreferences;
  conversation: AIConversationMessage[];
  memory: AIMemoryState;
  language: string;
  currentTask: AITaskType;
  citationMap: Record<string, string>;
  estimatedTokens: number;
}

export interface PromptTemplate {
  key: string;
  version: string;
  task: AITaskType;
  locale: string;
  status: "active" | "deprecated" | "disabled";
  systemInstruction: string;
  developerInstruction: string;
  inputSchema: Record<string, unknown>;
  outputSchema: Record<string, unknown>;
  safetyPolicy: string[];
  supportedProfiles: string[];
}

export interface AIProviderMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AIProviderRequest {
  messages: AIProviderMessage[];
  model: string;
  temperature: number;
  maxTokens: number;
  timeoutMs: number;
  responseFormat: AIOutputFormat;
  metadata?: Record<string, unknown>;
}

export interface AIProviderResponse {
  text: string;
  model: string;
  provider: AIProviderName;
  tokenUsage?: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  raw?: unknown;
}

export interface AIFormattedResponse {
  content: string;
  format: AIOutputFormat;
  markdown?: string;
  bulletList?: string[];
  table?: Array<Record<string, string>>;
  highlightedSteps?: string[];
  accessibilityNotes?: string[];
  readingDifficulty?: "easy" | "medium" | "hard";
  estimatedReadingTimeSeconds?: number;
  keyTakeaways?: string[];
  actionItems?: string[];
  warnings?: string[];
  citations?: Array<{ sectionId: string; label: string }>;
}

export interface AIResponse {
  requestId: string;
  task: AITaskType;
  provider: AIProviderName;
  model: string;
  safetyStatus: AISafetyStatus;
  formatted: AIFormattedResponse;
  createdAt: string;
  executionTimeMs: number;
  tokenUsage?: AIProviderResponse["tokenUsage"];
  metadata?: Record<string, unknown>;
}

export interface AIHistoryRecord {
  id: string;
  userId?: string;
  pageSessionId?: string;
  taskType: AITaskType;
  prompt: string;
  response: string;
  timestamp: string;
  website?: string;
  accessibilityMode?: string;
  language: string;
  executionTimeMs: number;
  model: string;
  provider: AIProviderName;
  tokenUsage?: AIProviderResponse["tokenUsage"];
  status: AIHistoryStatus;
  errors?: string[];
  metadata?: Record<string, unknown>;
}

export interface AIEvent {
  id: string;
  name: AIEventName;
  timestamp: string;
  payload: Record<string, unknown>;
}
