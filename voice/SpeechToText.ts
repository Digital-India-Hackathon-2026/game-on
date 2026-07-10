import type { VoiceAdapter } from "./VoiceAdapter";
import type { SpeechToTextRequest, SpeechToTextResult } from "./VoiceTypes";
import { VoiceValidators } from "./VoiceValidators";

export class SpeechToTextModule {
  constructor(private readonly adapter: VoiceAdapter, private readonly validators = new VoiceValidators()) {}
  async transcribe(request: SpeechToTextRequest): Promise<SpeechToTextResult> {
    this.validators.validateStt(request);
    return this.adapter.transcribe(request);
  }
}
