import { useCallback, useEffect, useState } from "react";

export type Theme = "light" | "dark";

const STORAGE_KEY = "bonsai-theme";

/**
 * useTheme — reads/writes the `data-theme` attribute on a target element
 * (defaults to <html>) and persists the choice to localStorage.
 *
 * @example
 * const { theme, toggle } = useTheme();
 * <button onClick={toggle}>{theme === "dark" ? "☀︎" : "☾"}</button>
 */
export function useTheme(defaultTheme: Theme = "dark", target?: HTMLElement | null) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme);

  useEffect(() => {
    const stored = (typeof window !== "undefined" && window.localStorage.getItem(STORAGE_KEY)) as Theme | null;
    if (stored === "light" || stored === "dark") setThemeState(stored);
  }, []);

  useEffect(() => {
    const el = target ?? (typeof document !== "undefined" ? document.documentElement : null);
    if (el) el.setAttribute("data-theme", theme);
    if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, theme);
  }, [theme, target]);

  const setTheme = useCallback((t: Theme) => setThemeState(t), []);
  const toggle = useCallback(() => setThemeState((t) => (t === "dark" ? "light" : "dark")), []);

  return { theme, setTheme, toggle };
}

export default useTheme;
