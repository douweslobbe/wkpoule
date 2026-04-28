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
      className="shrink-0 px-2.5 py-1.5 font-pixel transition-all"
      style={{
        fontSize: "13px",
        color: theme === "dark" ? "#aaaacc" : "#444466",
        border: "2px solid var(--c-border-mid)",
        background: "transparent",
        lineHeight: 1,
        boxShadow: "1px 1px 0 #000",
      }}
    >
      {theme === "dark" ? "☀" : "☾"}
    </button>
  )
}
