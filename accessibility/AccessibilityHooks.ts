import type { AccessibilityResult } from "./AccessibilityTypes";

export type AccessibilityHook = (result: AccessibilityResult) => AccessibilityResult;

export class AccessibilityHooks {
  private readonly hooks: AccessibilityHook[] = [];

  use(hook: AccessibilityHook): void {
    this.hooks.push(hook);
  }

  run(result: AccessibilityResult): AccessibilityResult {
    return this.hooks.reduce((current, hook) => hook(current), result);
  }
}
