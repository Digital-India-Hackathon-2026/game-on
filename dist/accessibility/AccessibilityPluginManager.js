"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccessibilityPluginManager = void 0;
const AccessibilityValidators_1 = require("./AccessibilityValidators");
const plugins_1 = require("./plugins");
class AccessibilityPluginManager {
    registry;
    validators;
    constructor(registry, validators = new AccessibilityValidators_1.AccessibilityValidators()) {
        this.registry = registry;
        this.validators = validators;
    }
    autoRegister(plugins = plugins_1.builtInAccessibilityPlugins) {
        for (const plugin of plugins) {
            this.validators.validateManifest(plugin.manifest);
            this.registry.register(plugin);
        }
    }
}
exports.AccessibilityPluginManager = AccessibilityPluginManager;
