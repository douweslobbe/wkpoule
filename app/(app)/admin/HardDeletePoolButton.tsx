"use client"

import { useTransition, useState } from "react"
import { hardDeletePool } from "@/lib/actions"

export function HardDeletePoolButton({ poolId, poolName, highlight }: { poolId: string; poolName: string; highlight: boolean }) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleDelete() {
    const typed = window.prompt(`DEFINITIEF VERWIJDEREN\n\nType de poolnaam om te bevestigen:\n"${poolName}"`)
    if (typed?.trim() !== poolName.trim()) {
      setError("Naam klopt niet — geannuleerd.")
      return
    }
    setError(null)
    startTransition(async () => {
      const res = await hardDeletePool(poolId)
      if ("error" in res) setError(res.error ?? null)
    })
  }

  return (
    <div className="shrink-0">
      <button
        onClick={handleDelete}
        disabled={isPending}
        className="font-pixel px-2 py-1"
        style={{
          fontSize: "7px",
          background: highlight ? "#ff4444" : "transparent",
          color: highlight ? "#fff" : "#ff6666",
          border: `1px solid ${highlight ? "#ff4444" : "#553333"}`,
          cursor: "pointer",
          opacity: isPending ? 0.5 : 1,
          fontWeight: highlight ? "bold" : "normal",
        }}
        title="Pool definitief verwijderen"
      >
        {isPending ? "..." : "🗑 VERWIJDER"}
      </button>
      {error && (
        <div className="font-pixel mt-1" style={{ fontSize: "6px", color: "#ff4444" }}>{error}</div>
      )}
    </div>
  )
}
