"use client"

import { useTransition, useState } from "react"
import { joinSurvivor } from "@/lib/actions"

export function SurvivorJoinButton() {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  function handleClick() {
    setError(null)
    startTransition(async () => {
      const res = await joinSurvivor()
      if ("error" in res) setError(res.error ?? null)
      else setDone(true)
    })
  }

  if (done) {
    return (
      <div className="font-pixel text-center py-4" style={{ color: "#4af56a", fontSize: "8px" }}>
        ✓ Je doet nu mee! Ververs de pagina.
      </div>
    )
  }

  return (
    <div className="text-center">
      <button
        onClick={handleClick}
        disabled={isPending}
        className="font-pixel px-6 py-3"
        style={{
          fontSize: "9px",
          background: isPending ? "#333" : "#FF6200",
          color: "#fff",
          border: "3px solid #000",
          boxShadow: isPending ? "none" : "4px 4px 0 #000",
          cursor: isPending ? "default" : "pointer",
          opacity: isPending ? 0.7 : 1,
          letterSpacing: "1px",
        }}
      >
        {isPending ? "BEZIG..." : "⚔ MEEDOEN AAN WK SURVIVOR"}
      </button>
      {error && (
        <p className="font-pixel mt-2" style={{ fontSize: "7px", color: "#ff4444" }}>
          {error}
        </p>
      )}
    </div>
  )
}
