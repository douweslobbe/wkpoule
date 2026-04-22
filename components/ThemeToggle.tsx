"use client"

import { useState, useEffect } from "react"

export function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">("dark")

  useEffect(() => {
    const stored = document.documentElement.getAttribute("data-theme") as "dark" | "light" | null
    setTheme(stored ?? "dark")
  }, [])

  function toggle() {
    const next: "dark" | "light" = theme === "dark" ? "light" : "dark"
    setTheme(next)
    document.documentElement.setAttribute("data-theme", next)
    try { localStorage.setItem("wk-theme", next) } catch { /* noop */ }
  }

  return (
    <button
      onClick={toggle}
      title={theme === "dark" ? "Schakel naar licht thema" : "Schakel naar donker thema"}
      className="shrink-0 px-2 py-1 font-pixel transition-all"
      style={{
        fontSize: "9px",
        color: theme === "dark" ? "#8888aa" : "#555577",
        border: "1px solid var(--c-border-mid)",
        background: "transparent",
        lineHeight: 1,
      }}
    >
      {theme === "dark" ? "☀" : "☾"}
    </button>
  )
}
