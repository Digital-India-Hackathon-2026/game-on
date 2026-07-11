import { ChevronDown, ChevronUp, Mic, MicOff, Volume2 } from "lucide-react";
import { voiceLanguageOptions } from "../../voice/languages";
import type { useVoiceControlAgent } from "../../voice/useVoiceControlAgent";

type VoiceControlPanelProps = {
  agent: ReturnType<typeof useVoiceControlAgent>;
};

export function VoiceControlPanel({ agent }: VoiceControlPanelProps) {
  const isListening = agent.status === "listening" || agent.status === "requesting-permission";
  const isExpanded = agent.assistantState.expanded || isListening || agent.status === "thinking" || agent.status === "error";

  return (
    <aside className={`voice-control-panel ${isExpanded ? "is-expanded" : "is-compact"}`} aria-label="Saralo voice assistant">
      {isExpanded && (
        <div className="voice-control-panel__body">
          <div className="voice-control-panel__title-row">
            <div>
              <p className="voice-control-panel__eyebrow">Saralo Voice Assistant</p>
              <strong>{isListening ? "Listening" : agent.status.replace("-", " ")}</strong>
            </div>
            <button
              className="voice-control-panel__collapse"
              type="button"
              onClick={() => agent.setAssistantExpanded(false)}
              aria-label="Collapse voice assistant"
            >
              <ChevronDown size={18} />
            </button>
          </div>

          <div className="voice-control-panel__assistant-log">
            <div>
              <span>Transcript</span>
              <p>{agent.assistantState.transcript || agent.lastTranscript || "Waiting for your command..."}</p>
            </div>
            <div>
              <span>Detected command</span>
              <p>{agent.assistantState.detectedCommand || "None yet"}</p>
            </div>
            <div>
              <span>Reply</span>
              <p>{agent.assistantState.reply || agent.message}</p>
            </div>
            {agent.assistantState.error && (
              <div className="voice-control-panel__error" role="alert">
                <span>Error</span>
                <p>{agent.assistantState.error}</p>
              </div>
            )}
          </div>

          <div className="voice-control-panel__settings">
            <label>
              <span>Language</span>
              <input
                list="voice-language-options"
                value={agent.settings.language}
                onChange={(event) => agent.updateSettings({ language: event.target.value })}
              />
              <datalist id="voice-language-options">
                {voiceLanguageOptions.map((language) => (
                  <option key={language.code} value={language.code}>
                    {language.name}
                  </option>
                ))}
              </datalist>
            </label>
            <button
              className={agent.settings.speakFeedback ? "is-on" : ""}
              type="button"
              onClick={() => agent.updateSettings({ speakFeedback: !agent.settings.speakFeedback })}
            >
              <Volume2 size={15} />
              Speak
            </button>
          </div>
        </div>
      )}

      <div className="voice-control-panel__dock">
        {!isExpanded && (
          <button
            className="voice-control-panel__expand"
            type="button"
            onClick={() => agent.setAssistantExpanded(true)}
            aria-label="Open voice assistant panel"
          >
            <ChevronUp size={18} />
          </button>
        )}
        <button
          className={`voice-control-panel__mic ${isListening ? "is-listening" : ""}`}
          type="button"
          onClick={isListening ? agent.stopListening : agent.startListening}
          aria-label={isListening ? "Stop listening" : "Start listening"}
          title={isListening ? "Stop listening" : "Start listening"}
        >
          {isListening ? <MicOff size={22} /> : <Mic size={22} />}
        </button>
      </div>
    </aside>
  );
}
