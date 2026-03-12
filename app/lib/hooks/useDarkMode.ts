"use client";
import { useState, useEffect } from "react";

/**
 * Returns true when the <html> element has the "dark" class applied.
 * Reacts in real-time via MutationObserver, so any component using this hook
 * will re-render immediately when the user toggles dark mode in settings.
 */
export function useDarkMode(): boolean {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));

    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"));
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  return isDark;
}
