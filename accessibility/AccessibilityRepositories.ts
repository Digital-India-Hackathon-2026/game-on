import type { AccessibilityPluginManifest } from "./AccessibilityTypes";

export interface AccessibilityProfileRepository {
  save(manifest: AccessibilityPluginManifest): Promise<void>;
  list(): Promise<AccessibilityPluginManifest[]>;
}

export class InMemoryAccessibilityProfileRepository implements AccessibilityProfileRepository {
  private readonly profiles = new Map<string, AccessibilityPluginManifest>();

  async save(manifest: AccessibilityPluginManifest): Promise<void> {
    this.profiles.set(manifest.profileKey, manifest);
  }

  async list(): Promise<AccessibilityPluginManifest[]> {
    return [...this.profiles.values()];
  }
}
