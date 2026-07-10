"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityRegistry = void 0;
class SecurityRegistry {
    analyzers = new Map();
    register(analyzer) {
        this.analyzers.set(analyzer.key, analyzer);
    }
    list() {
        return [...this.analyzers.values()];
    }
}
exports.SecurityRegistry = SecurityRegistry;
