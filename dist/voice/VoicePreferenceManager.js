"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VoicePreferenceManager = void 0;
const VoiceRepositories_1 = require("./VoiceRepositories");
const VoiceValidators_1 = require("./VoiceValidators");
class VoicePreferenceManager {
    repository;
    validators;
    constructor(repository = new VoiceRepositories_1.VoicePreferenceRepository(), validators = new VoiceValidators_1.VoiceValidators()) {
        this.repository = repository;
        this.validators = validators;
    }
    get(userId) {
        return this.repository.get(userId);
    }
    async save(userId, preferences) {
        this.validators.validatePreferences(preferences);
        await this.repository.save(userId, preferences);
    }
}
exports.VoicePreferenceManager = VoicePreferenceManager;
