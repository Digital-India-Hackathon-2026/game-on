"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccessibilityHooks = void 0;
class AccessibilityHooks {
    hooks = [];
    use(hook) {
        this.hooks.push(hook);
    }
    run(result) {
        return this.hooks.reduce((current, hook) => hook(current), result);
    }
}
exports.AccessibilityHooks = AccessibilityHooks;
