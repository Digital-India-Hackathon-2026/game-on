import { createContext, PropsWithChildren, useContext, useEffect } from "react";
import { themes, type ThemeName } from "../design";
import { useThemeStore } from "../state/themeStore";

const ThemeContext = createContext<{ theme: ThemeName; setTheme: (theme: ThemeName) => void } | null>(null);

export function ThemeProvider({ children }: PropsWithChildren) {
  const { theme, setTheme } = useThemeStore();
  useEffect(() => {
    const tokens = themes[theme];
    for (const [key, value] of Object.entries(tokens)) document.documentElement.style.setProperty(`--color-${key}`, value);
    document.documentElement.dataset.theme = theme;
  }, [theme]);
  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}

export function useThemeContext() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useThemeContext must be used inside ThemeProvider.");
  return context;
}
