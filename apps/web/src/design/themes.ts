import { colors } from "./colors";
export type ThemeName = "light" | "dark" | "highContrast" | "senior" | "dyslexia" | "visualComfort";
export const themes = {
  light: colors.light,
  dark: colors.dark,
  highContrast: colors.highContrast,
  senior: { ...colors.light, background: "hsl(48 33% 97%)", primary: "hsl(198 72% 34%)" },
  dyslexia: { ...colors.light, background: "hsl(52 35% 96%)", surface: "hsl(52 45% 99%)" },
  visualComfort: { ...colors.light, background: "hsl(150 14% 96%)", surface: "hsl(150 18% 99%)" }
} as const;
