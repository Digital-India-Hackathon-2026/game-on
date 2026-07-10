import { Check, Mic, MicOff, Settings, ShieldAlert, Undo2, Volume2 } from "lucide-react";
import { voiceLanguageOptions } from "../../voice/languages";
import type { useVoiceControlAgent } from "../../voice/useVoiceControlAgent";

type VoiceControlPanelProps = {
  agent: ReturnType<typeof useVoiceControlAgent>;
};

export function VoiceControlPanel({ agent }: VoiceControlPanelProps) {
  const isListening = agent.status === "listening" || agent.status === "requesting-permission";
  const isExpanded =
    isListening ||
    Boolean(agent.pendingConfirmation) ||
    Boolean(agent.lastTranscript) ||
    agent.audit.length > 0 ||
    agent.status !== "idle";

  return (
    <aside className={`voice-control-panel ${isExpanded ? "is-expanded" : "is-compact"}`} aria-label="Voice control dashboard">
      <div className="voice-control-panel__header">
        <div>
          <p className="voice-control-panel__eyebrow">Voice Agent</p>
          <strong>{agent.status.replace("-", " ")}</strong>
        </div>
        <button
          className={`voice-control-panel__mic ${isListening ? "is-listening" : ""}`}
          type="button"
          onClick={isListening ? agent.stopListening : agent.startListening}
          aria-label={isListening ? "Stop listening" : "Start listening"}
          title={isListening ? "Stop listening" : "Start listening"}
        >
          {isListening ? <MicOff size={20} /> : <Mic size={20} />}
        </button>
      </div>

      {isExpanded && <p className="voice-control-panel__message">{agent.message}</p>}

      {isExpanded && agent.pendingConfirmation && (
        <div className="voice-control-panel__confirm">
          <ShieldAlert size={18} />
          <span>Confirmation needed</span>
          <button type="button" onClick={agent.confirmPending}>
            <Check size={15} />
            Confirm
          </button>
        </div>
      )}

      {isExpanded && (
        <div className="voice-control-panel__stats">
          <span>{agent.dashboard.availableElements} controls</span>
          <span>{agent.detectedLanguage}</span>
          <span>{agent.dashboard.commandCount} commands</span>
        </div>
      )}

      {isExpanded && (
        <div className="voice-control-panel__settings">
          <label>
            <span>
              <Settings size={15} /> Language
            </span>
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

          <div className="voice-control-panel__toggles">
            <button
              className={agent.settings.continuous ? "is-on" : ""}
              type="button"
              onClick={() => agent.updateSettings({ continuous: !agent.settings.continuous })}
            >
              <Mic size={15} />
              Continuous
            </button>
            <button
              className={agent.settings.speakFeedback ? "is-on" : ""}
              type="button"
              onClick={() => agent.updateSettings({ speakFeedback: !agent.settings.speakFeedback })}
            >
              <Volume2 size={15} />
              Speak
            </button>
            <button
              className={agent.dashboard.undoAvailable ? "is-on" : ""}
              type="button"
              onClick={() => agent.processTranscript("undo")}
            >
              <Undo2 size={15} />
              Undo
            </button>
          </div>
        </div>
      )}

      {isExpanded && agent.lastTranscript && (
        <p className="voice-control-panel__transcript">"{agent.lastTranscript}"</p>
      )}

      {isExpanded && (
        <div className="voice-control-panel__audit">
          {agent.audit.map((entry) => (
            <div key={entry.id}>
              <span>{entry.time}</span>
              <strong>{entry.action}</strong>
              <em>{entry.status}</em>
            </div>
          ))}
        </div>
      )}
    </aside>
  );
}
