import { create } from "zustand";
import type { ThemeName } from "../design";
export const useThemeStore = create<{ theme: ThemeName; setTheme: (theme: ThemeName) => void }>((set) => ({
  theme: "light",
  setTheme: (theme) => set({ theme })
}));
