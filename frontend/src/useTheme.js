import { useEffect, useState } from "react";

function getStoredTheme() {
  try {
    return localStorage.getItem("theme");
  } catch {
    return null;
  }
}

function getSystemTheme() {
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function useTheme() {
  const [theme, setTheme] = useState(() => getStoredTheme() || getSystemTheme());

  // If the user has never explicitly chosen a theme, keep following the system
  // preference live (the page also has no data-theme attribute in that case, so
  // CSS alone already reacts instantly — this just keeps the toggle's icon/label
  // in sync with what's actually on screen).
  useEffect(() => {
    if (getStoredTheme()) return;
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e) => setTheme(e.matches ? "dark" : "light");
    mql.addEventListener("change", handleChange);
    return () => mql.removeEventListener("change", handleChange);
  }, []);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("theme", next);
    } catch {
      /* localStorage unavailable — theme still applies for this page view */
    }
  }

  return { theme, toggleTheme };
}
