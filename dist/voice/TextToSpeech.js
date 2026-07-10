"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TextToSpeechModule = void 0;
const VoiceUtilities_1 = require("./VoiceUtilities");
const VoiceValidators_1 = require("./VoiceValidators");
class TextToSpeechModule {
    adapter;
    validators;
    constructor(adapter, validators = new VoiceValidators_1.VoiceValidators()) {
        this.adapter = adapter;
        this.validators = validators;
    }
    async generate(request) {
        this.validators.validateTts(request);
        if ((0, VoiceUtilities_1.isSensitiveReadout)(request.text))
            throw new Error("Sensitive text requires confirmation before readout.");
        return this.adapter.synthesize({ ...request, text: (0, VoiceUtilities_1.normalizeSpeechText)(request.text) });
    }
}
exports.TextToSpeechModule = TextToSpeechModule;
