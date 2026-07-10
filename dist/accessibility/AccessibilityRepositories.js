"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InMemoryAccessibilityProfileRepository = void 0;
class InMemoryAccessibilityProfileRepository {
    profiles = new Map();
    async save(manifest) {
        this.profiles.set(manifest.profileKey, manifest);
    }
    async list() {
        return [...this.profiles.values()];
    }
}
exports.InMemoryAccessibilityProfileRepository = InMemoryAccessibilityProfileRepository;
