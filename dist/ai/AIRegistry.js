"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIRegistry = void 0;
const AIErrorHandler_1 = require("./AIErrorHandler");
class AIRegistry {
    providers = new Map();
    modules = new Map();
    registerProvider(provider) {
        this.providers.set(provider.name, provider);
    }
    getProvider(name) {
        const provider = this.providers.get(name);
        if (!provider)
            throw new AIErrorHandler_1.AIEngineError("configuration_error", `AI provider ${name} is not registered.`, 500);
        return provider;
    }
    registerModule(module) {
        this.modules.set(module.task, module);
    }
    getModule(task) {
        const module = this.modules.get(task);
        if (!module)
            throw new AIErrorHandler_1.AIEngineError("configuration_error", `AI module ${task} is not registered.`, 500);
        return module;
    }
    listProviders() {
        return [...this.providers.keys()];
    }
    listModules() {
        return [...this.modules.keys()];
    }
}
exports.AIRegistry = AIRegistry;
