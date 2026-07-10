import type { VoiceAdapter } from "./VoiceAdapter";
import type { TextToSpeechRequest, TextToSpeechResult } from "./VoiceTypes";
import { isSensitiveReadout, normalizeSpeechText } from "./VoiceUtilities";
import { VoiceValidators } from "./VoiceValidators";

export class TextToSpeechModule {
  constructor(private readonly adapter: VoiceAdapter, private readonly validators = new VoiceValidators()) {}

  async generate(request: TextToSpeechRequest): Promise<TextToSpeechResult> {
    this.validators.validateTts(request);
    if (isSensitiveReadout(request.text)) throw new Error("Sensitive text requires confirmation before readout.");
    return this.adapter.synthesize({ ...request, text: normalizeSpeechText(request.text) });
  }
}
