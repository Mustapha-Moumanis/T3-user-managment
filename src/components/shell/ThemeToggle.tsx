"use client";

import { useEffect, useState } from "react";

const ACCENT_PRESETS: Record<string, { l: string; l2: string; ls: string; d: string; ds: string }> = {
  dodgerBlue: { l: "#0d74f6", l2: "#4a94ff", ls: "#ebf4ff", d: "#8ab4f8", ds: "#0b2559" },
  indigo:     { l: "#4f46e5", l2: "#6366f1", ls: "#eef2ff", d: "#818cf8", ds: "#1e1b4b" },
  emerald:    { l: "#059669", l2: "#10b981", ls: "#ecfdf5", d: "#34d399", ds: "#022c22" },
  amber:      { l: "#d97706", l2: "#f59e0b", ls: "#fffbeb", d: "#fbbf24", ds: "#451a03" },
  rose:       { l: "#db2777", l2: "#ec4899", ls: "#fdf2f8", d: "#f472b6", ds: "#500724" },
};

export function applyTheme(theme: "light" | "dark", accent: string) {
  document.documentElement.setAttribute("data-theme", theme);
  const p = ACCENT_PRESETS[accent] || ACCENT_PRESETS.dodgerBlue;
  const r = document.documentElement.style;
  if (theme === "dark") {
    r.setProperty("--accent", p.d);
    r.setProperty("--accent-soft", p.ds);
  } else {
    r.setProperty("--accent", p.l);
    r.setProperty("--accent-2", p.l2);
    r.setProperty("--accent-soft", p.ls);
  }
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const t = (localStorage.getItem("uim.theme") as "light" | "dark") || "light";
    setTheme(t);
  }, []);

  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("uim.theme", next);
    const accent = localStorage.getItem("uim.accent") || "dodgerBlue";
    applyTheme(next, accent);
  };

  return (
    <button className="btn btn-ghost btn-icon btn-sm" onClick={toggle} title="Toggle theme">
      {theme === "dark" ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  );
}
