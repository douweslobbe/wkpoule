"use client"

import { useState, useEffect, useRef, useTransition } from "react"
import { savePrediction } from "@/lib/actions"

export function PredictionForm({
  matchId,
  initialHome,
  initialAway,
}: {
  matchId: string
  initialHome?: number
  initialAway?: number
}) {
  const [home, setHome] = useState(initialHome?.toString() ?? "")
  const [away, setAway] = useState(initialAway?.toString() ?? "")
  const [saveStatus, setSaveStatus] = useState<"idle" | "debouncing" | "saving" | "saved" | "error">(
    initialHome !== undefined && initialAway !== undefined ? "saved" : "idle"
  )
  const [error, setError] = useState("")
  const [isPending, startTransition] = useTransition()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isInitial = useRef(true)

  useEffect(() => {
    if (isInitial.current) {
      isInitial.current = false
      return
    }
    if (home === "" || away === "") {
      setSaveStatus("idle")
      return
    }

    setSaveStatus("debouncing")
    if (debounceRef.current) clearTimeout(debounceRef.current)

    debounceRef.current = setTimeout(() => {
      setSaveStatus("saving")
      const fd = new FormData()
      fd.set("matchId", matchId)
      fd.set("homeScore", home)
      fd.set("awayScore", away)
      startTransition(async () => {
        const result = await savePrediction(fd)
        if (result?.error) {
          setError(result.error)
          setSaveStatus("error")
        } else {
          setError("")
          setSaveStatus("saved")
        }
      })
    }, 700)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [home, away, matchId])

  const statusLabel =
    saveStatus === "debouncing" || saveStatus === "saving" || isPending
      ? "Opslaan..."
      : saveStatus === "saved"
      ? "✓ Opgeslagen"
      : saveStatus === "error"
      ? "✕ Fout"
      : ""

  const statusColor =
    saveStatus === "saved" ? "#16a34a"
    : saveStatus === "error" ? "#ff4444"
    : "#999"

  function adj(val: string, delta: number) {
    const n = Math.min(20, Math.max(0, parseInt(val || "0") + delta))
    return n.toString()
  }

  return (
    <div className="mt-3 pt-3" style={{ borderTop: "1px solid var(--c-border)" }}>
      <div className="flex items-center gap-2 justify-center flex-wrap">
        <span className="text-xs" style={{ color: "var(--c-text-4)" }}>Jouw voorspelling:</span>
        <div className="flex items-center gap-0.5">
          <button type="button" onClick={() => setHome(adj(home, -1))} className="pixel-pm">–</button>
          <input
            type="number"
            min={0}
            max={20}
            value={home}
            onChange={(e) => setHome(e.target.value)}
            className="pixel-input w-10 text-center font-bold text-lg py-1.5"
            placeholder="–"
          />
          <button type="button" onClick={() => setHome(adj(home, +1))} className="pixel-pm">+</button>
        </div>
        <span className="font-bold" style={{ color: "var(--c-text-4)" }}>–</span>
        <div className="flex items-center gap-0.5">
          <button type="button" onClick={() => setAway(adj(away, -1))} className="pixel-pm">–</button>
          <input
            type="number"
            min={0}
            max={20}
            value={away}
            onChange={(e) => setAway(e.target.value)}
            className="pixel-input w-10 text-center font-bold text-lg py-1.5"
            placeholder="–"
          />
          <button type="button" onClick={() => setAway(adj(away, +1))} className="pixel-pm">+</button>
        </div>
        <span className="font-pixel text-xs" style={{ color: statusColor, minWidth: "80px" }}>
          {statusLabel}
        </span>
      </div>
      {error && <p className="text-center text-xs mt-1" style={{ color: "#ff4444" }}>{error}</p>}
    </div>
  )
}
