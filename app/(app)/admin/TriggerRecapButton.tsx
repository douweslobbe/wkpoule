"use client"

import { useState, useTransition } from "react"
import { triggerManualRecap } from "@/lib/actions"

export function TriggerRecapButton() {
  const [result, setResult] = useState<{ ok?: boolean; days?: number; error?: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    setResult(null)
    startTransition(async () => {
      const res = await triggerManualRecap()
      setResult(res ?? { error: "Onbekende fout" })
    })
  }

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <button
        onClick={handleClick}
        disabled={isPending}
        className="pixel-btn px-4 py-2 font-pixel"
        style={{
          background: isPending ? "#1a1a2a" : "#0a0a3a",
          color: isPending ? "#4a4a8a" : "#aaaaff",
          border: "2px solid #2a2a6a",
          fontSize: "8px",
          cursor: isPending ? "not-allowed" : "pointer",
        }}
      >
        {isPending ? "BEZIG..." : "📋 SPEELDAGOVERZICHT POSTEN"}
      </button>

      {result?.ok && (
        <span className="font-pixel" style={{ fontSize: "7px", color: "#4af56a" }}>
          ✓ Recap gepost voor {result.days} dag{result.days !== 1 ? "en" : ""} (duplicaten overgeslagen)
        </span>
      )}
      {result?.error && (
        <span className="font-pixel" style={{ fontSize: "7px", color: "#ff6666" }}>
          ❌ {result.error}
        </span>
      )}
    </div>
  )
}
