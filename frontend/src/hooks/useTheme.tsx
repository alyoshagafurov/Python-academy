import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type Theme = "dark" | "light";

interface ThemeCtx {
  theme: Theme;
  toggle: () => void;
}

const Ctx = createContext<ThemeCtx | null>(null);

/** Stores only an explicit user choice. v2: the previous key recorded "dark" for
 *  every visitor, which would pin returning users to the old default. The same
 *  key is read by the inline script in index.html before first paint. */
const STORAGE_KEY = "pkh-theme-v2";
const DARK_QUERY = "(prefers-color-scheme: dark)";

function readSaved(): Theme | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === "dark" || saved === "light" ? saved : null;
  } catch {
    return null;
  }
}

function systemTheme(): Theme {
  return window.matchMedia(DARK_QUERY).matches ? "dark" : "light";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [choice, setChoice] = useState<Theme | null>(readSaved);
  const [system, setSystem] = useState<Theme>(systemTheme);
  const theme = choice ?? system;

  // Follow the OS setting live while the user has not picked a theme.
  useEffect(() => {
    const mq = window.matchMedia(DARK_QUERY);
    const onChange = () => setSystem(mq.matches ? "dark" : "light");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    const meta = document.querySelector('meta[name="theme-color"]');
    const bg = getComputedStyle(root).getPropertyValue("--bg").trim();
    if (meta && bg) meta.setAttribute("content", bg);
  }, [theme]);

  const toggle = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setChoice(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* private mode: the choice lasts for this session only */
    }
  };

  return <Ctx.Provider value={{ theme, toggle }}>{children}</Ctx.Provider>;
}

export function useTheme() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
