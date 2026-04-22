"use client"

import { useState, useTransition } from "react"
import { recalcAllScores } from "@/lib/actions"

export function RecalcButton() {
  const [result, setResult] = useState<{ ok?: string; error?: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    setResult(null)
    startTransition(async () => {
      const res = await recalcAllScores()
      if (res?.error) setResult({ error: `Fout: ${res.error}` })
      else setResult({ ok: "✓ Alle punten herberekend" })
    })
  }

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={isPending}
        className="pixel-btn px-4 py-2 font-pixel disabled:opacity-50"
        style={{
          background: isPending ? "#1a3d1f" : "#16a34a",
          color: "white",
          fontSize: "7px",
        }}
      >
        {isPending ? "BEREKENEN..." : "⟳ HERBEREKEN PUNTEN"}
      </button>
      {result?.ok && (
        <p className="font-pixel mt-1" style={{ fontSize: "7px", color: "#4af56a" }}>{result.ok}</p>
      )}
      {result?.error && (
        <p className="font-pixel mt-1" style={{ fontSize: "7px", color: "#ff4444" }}>{result.error}</p>
      )}
    </div>
  )
}
