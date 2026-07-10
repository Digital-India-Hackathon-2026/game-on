"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccessibilityRegistry = void 0;
class AccessibilityRegistry {
    plugins = new Map();
    register(plugin) {
        this.plugins.set(plugin.manifest.profileKey, plugin);
    }
    resolve(profileKey) {
        const plugin = this.plugins.get(profileKey);
        if (!plugin)
            throw new Error(`Accessibility profile ${profileKey} is not registered.`);
        return plugin;
    }
    list() {
        return [...this.plugins.values()];
    }
}
exports.AccessibilityRegistry = AccessibilityRegistry;
