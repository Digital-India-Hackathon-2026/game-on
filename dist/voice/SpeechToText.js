"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpeechToTextModule = void 0;
const VoiceValidators_1 = require("./VoiceValidators");
class SpeechToTextModule {
    adapter;
    validators;
    constructor(adapter, validators = new VoiceValidators_1.VoiceValidators()) {
        this.adapter = adapter;
        this.validators = validators;
    }
    async transcribe(request) {
        this.validators.validateStt(request);
        return this.adapter.transcribe(request);
    }
}
exports.SpeechToTextModule = SpeechToTextModule;
