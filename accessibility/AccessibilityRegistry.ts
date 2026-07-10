import type { AccessibilityPlugin, AccessibilityProfileKey } from "./AccessibilityTypes";

export class AccessibilityRegistry {
  private readonly plugins = new Map<AccessibilityProfileKey, AccessibilityPlugin>();

  register(plugin: AccessibilityPlugin): void {
    this.plugins.set(plugin.manifest.profileKey, plugin);
  }

  resolve(profileKey: AccessibilityProfileKey): AccessibilityPlugin {
    const plugin = this.plugins.get(profileKey);
    if (!plugin) throw new Error(`Accessibility profile ${profileKey} is not registered.`);
    return plugin;
  }

  list(): AccessibilityPlugin[] {
    return [...this.plugins.values()];
  }
}
