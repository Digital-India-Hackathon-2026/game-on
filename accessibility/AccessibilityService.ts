import { AccessibilityEventBus } from "./AccessibilityEvents";
import { AccessibilityPluginManager } from "./AccessibilityPluginManager";
import { AccessibilityRegistry } from "./AccessibilityRegistry";
import type { AccessibilityRequest, AccessibilityResult } from "./AccessibilityTypes";
import { AccessibilityValidators } from "./AccessibilityValidators";

export class AccessibilityService {
  readonly registry = new AccessibilityRegistry();
  readonly events = new AccessibilityEventBus();
  private readonly validators = new AccessibilityValidators();

  constructor() {
    new AccessibilityPluginManager(this.registry, this.validators).autoRegister();
  }

  transform(request: AccessibilityRequest): AccessibilityResult {
    this.validators.validateRequest(request);
    this.events.emit("AccessibilityTransformStarted", { profileKey: request.profileKey });
    const plugin = this.registry.resolve(request.profileKey);
    this.events.emit("AccessibilityProfileSelected", { profileKey: request.profileKey });
    const result = plugin.transform(request);
    result.validationWarnings.push(...this.validators.validateResult(result));
    if (result.validationWarnings.length > 0) {
      this.events.emit("AccessibilityValidationFailed", { warnings: result.validationWarnings });
    }
    this.events.emit("AccessibilityTransformCompleted", { profileKey: request.profileKey });
    return result;
  }
}
