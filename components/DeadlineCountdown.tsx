"use client"

import { useEffect, useState } from "react"

type UpcomingMatch = {
  id: string
  homeTeam: string
  awayTeam: string
  kickoff: string // ISO string
  hasPrediction: boolean
}

function formatCountdown(ms: number) {
  if (ms <= 0) return "NU"
  const totalSeconds = Math.floor(ms / 1000)
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  if (h > 0) return `${h}u ${m.toString().padStart(2, "0")}m`
  if (m > 0) return `${m}m ${s.toString().padStart(2, "0")}s`
  return `${s}s`
}

export function DeadlineCountdown({ matches }: { matches: UpcomingMatch[] }) {
  const [, setTick] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000)
    return () => clearInterval(id)
  }, [])

  const now = Date.now()
  // Wedstrijden die binnen 2 uur beginnen (deadline = 30 min voor aftrap)
  const urgent = matches.filter((m) => {
    const deadline = new Date(m.kickoff).getTime() - 30 * 60 * 1000
    return deadline > now && deadline - now < 2 * 60 * 60 * 1000
  })

  if (urgent.length === 0) return null

  const unpredicted = urgent.filter((m) => !m.hasPrediction)
  const first = urgent[0]
  const deadline = new Date(first.kickoff).getTime() - 30 * 60 * 1000
  const msLeft = deadline - now
  const isUnpredicted = !first.hasPrediction

  return (
    <div
      className="pixel-card overflow-hidden mb-4 flex items-center gap-3 px-4 py-3"
      style={{
        background: isUnpredicted ? "#1a0800" : "#0a1a08",
        borderLeft: `4px solid ${isUnpredicted ? "#FF6200" : "#4af56a"}`,
        animation: isUnpredicted && msLeft < 30 * 60 * 1000 ? "pixel-pulse 1s infinite" : undefined,
      }}
    >
      <span style={{ fontSize: "18px", flexShrink: 0 }}>
        {isUnpredicted ? "⚠️" : "✅"}
      </span>
      <div className="flex-1 min-w-0">
        <div className="font-pixel" style={{ fontSize: "8px", color: isUnpredicted ? "#FF6200" : "#4af56a", lineHeight: "1.8" }}>
          {first.homeTeam} VS {first.awayTeam}
          {unpredicted.length > 1 && ` + ${unpredicted.length - 1} andere`}
        </div>
        <div className="font-pixel" style={{ fontSize: "7px", color: "var(--c-text-3)", lineHeight: "1.8" }}>
          {isUnpredicted
            ? `Deadline over ${formatCountdown(msLeft)} — nog niet voorspeld!`
            : `Deadline over ${formatCountdown(msLeft)} — voorspelling ingediend ✓`}
        </div>
      </div>
    </div>
  )
}
