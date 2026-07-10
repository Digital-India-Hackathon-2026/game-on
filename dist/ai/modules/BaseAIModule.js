"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseAIModule = void 0;
class BaseAIModule {
    task;
    constructor(task) {
        this.task = task;
    }
    execute(request, service) {
        return service.run({ ...request, task: this.task });
    }
}
exports.BaseAIModule = BaseAIModule;
