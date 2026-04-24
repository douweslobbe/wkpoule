"use client"

import { useState, useEffect } from "react"

export function DeadlineDisplay({ deadline }: { deadline: Date }) {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    // Update elke 30 seconden
    const interval = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(interval)
  }, [])

  const diff = deadline.getTime() - now.getTime()

  if (diff <= 0) {
    return (
      <span className="font-pixel" style={{ fontSize: "9px", color: "#cc2222" }}>
        🔒 GESLOTEN
      </span>
    )
  }

  // Meer dan 24 uur: gewone datumweergave
  if (diff > 24 * 3_600_000) {
    const dateStr = deadline.toLocaleString("nl-NL", {
      day: "numeric", month: "long", hour: "2-digit", minute: "2-digit",
    })
    return (
      <span className="font-pixel" style={{ fontSize: "9px", color: "#4af56a" }}>
        Deadline: {dateStr}
      </span>
    )
  }

  // Binnen 24 uur: live countdown
  const hours = Math.floor(diff / 3_600_000)
  const minutes = Math.floor((diff % 3_600_000) / 60_000)
  const isUrgent = diff < 3_600_000 // minder dan 1 uur

  return (
    <span
      className="font-pixel"
      style={{
        fontSize: "9px",
        color: isUrgent ? "#ff4444" : "#FFD700",
        animation: isUrgent ? "pixel-blink 1s step-end infinite" : undefined,
      }}
    >
      {isUrgent ? "⚠ " : "⏱ "}SLUIT OVER{" "}
      {hours > 0 ? `${hours}u ` : ""}
      {minutes}min
    </span>
  )
}
