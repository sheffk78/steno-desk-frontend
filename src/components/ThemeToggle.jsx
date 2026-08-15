import { useState, useEffect } from "react";
import { Sun, Moon } from "lucide-react";

const STORAGE_KEY = "sd-theme";

/**
 * ThemeToggle — dark/light mode toggle using data-theme on <html>.
 * Persists to localStorage. Respects system preference on first visit.
 * Tailwind darkMode is "class" — we add/remove .dark on <html>.
 */
export default function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = saved === "dark" || (!saved && prefersDark);
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem(STORAGE_KEY, next ? "dark" : "light");
    } catch {
      // ignore
    }
  };

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-1.5 text-[14px] text-[#6B7280] hover:text-[#1F2937] dark:text-gray-400 dark:hover:text-gray-200 px-2 py-1 rounded-md transition-colors"
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      data-testid="theme-toggle"
    >
      {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      <span className="hidden sm:inline">{dark ? "Light" : "Dark"}</span>
    </button>
  );
}