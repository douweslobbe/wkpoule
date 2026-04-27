"use client"

import { useTransition, useState } from "react"
import { resetHighscore } from "@/lib/actions"

export function SurvivorResetButton() {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [confirmed, setConfirmed] = useState(false)

  function handleClick() {
    if (!confirmed) {
      setConfirmed(true)
      return
    }
    setError(null)
    startTransition(async () => {
      const res = await resetHighscore()
      if ("error" in res) {
        setError(res.error ?? null)
        setConfirmed(false)
      }
    })
  }

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={isPending}
        className="font-pixel px-3 py-1.5"
        style={{
          fontSize: "7px",
          background: confirmed ? "#ff8800" : "transparent",
          color: confirmed ? "#fff" : "#ff8800",
          border: `2px solid #ff8800`,
          cursor: "pointer",
          opacity: isPending ? 0.5 : 1,
        }}
      >
        {isPending ? "BEZIG..." : confirmed ? "⚠ KLIK NOGMAALS OM TE BEVESTIGEN" : "🔄 RESET GEBRUIKEN"}
      </button>
      {confirmed && !isPending && (
        <p className="font-pixel mt-1" style={{ fontSize: "6px", color: "#ff8800" }}>
          Na reset mag je alle teams opnieuw gebruiken (ook al eerder gebruikte teams).
        </p>
      )}
      {error && (
        <p className="font-pixel mt-1" style={{ fontSize: "6px", color: "#ff4444" }}>{error}</p>
      )}
    </div>
  )
}
