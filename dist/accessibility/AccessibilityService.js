"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccessibilityService = void 0;
const AccessibilityEvents_1 = require("./AccessibilityEvents");
const AccessibilityPluginManager_1 = require("./AccessibilityPluginManager");
const AccessibilityRegistry_1 = require("./AccessibilityRegistry");
const AccessibilityValidators_1 = require("./AccessibilityValidators");
class AccessibilityService {
    registry = new AccessibilityRegistry_1.AccessibilityRegistry();
    events = new AccessibilityEvents_1.AccessibilityEventBus();
    validators = new AccessibilityValidators_1.AccessibilityValidators();
    constructor() {
        new AccessibilityPluginManager_1.AccessibilityPluginManager(this.registry, this.validators).autoRegister();
    }
    transform(request) {
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
exports.AccessibilityService = AccessibilityService;
