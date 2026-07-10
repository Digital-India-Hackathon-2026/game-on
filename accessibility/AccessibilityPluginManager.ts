import { AccessibilityRegistry } from "./AccessibilityRegistry";
import type { AccessibilityPlugin } from "./AccessibilityTypes";
import { AccessibilityValidators } from "./AccessibilityValidators";
import { builtInAccessibilityPlugins } from "./plugins";

export class AccessibilityPluginManager {
  constructor(
    private readonly registry: AccessibilityRegistry,
    private readonly validators = new AccessibilityValidators()
  ) {}

  autoRegister(plugins: AccessibilityPlugin[] = builtInAccessibilityPlugins): void {
    for (const plugin of plugins) {
      this.validators.validateManifest(plugin.manifest);
      this.registry.register(plugin);
    }
  }
}
