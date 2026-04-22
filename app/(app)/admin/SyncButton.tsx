"use client"

import { useState, useTransition, useEffect } from "react"
import { syncMatches } from "@/lib/actions"

const COOLDOWN_S = 60

export function SyncButton() {
  const [result, setResult] = useState<{ ok?: string; error?: string } | null>(null)
  const [cooldown, setCooldown] = useState(0)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    if (cooldown <= 0) return
    const id = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(id)
  }, [cooldown])

  function handleClick() {
    if (cooldown > 0 || isPending) return
    setResult(null)
    startTransition(async () => {
      const res = await syncMatches()
      if (res.error) {
        setResult({ error: `Fout: ${res.error}` })
      } else {
        setResult({ ok: `✓ ${res.synced} wedstrijden, ${res.updated} bijgewerkt` })
        setCooldown(COOLDOWN_S)
      }
    })
  }

  const disabled = isPending || cooldown > 0

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={disabled}
        className="pixel-btn px-4 py-2 font-pixel disabled:opacity-50"
        style={{
          background: disabled ? "#553300" : "#FF6200",
          color: "white",
          fontSize: "7px",
        }}
      >
        {isPending ? "BEZIG..." : cooldown > 0 ? `WACHT ${cooldown}s` : "⟳ SYNC FOOTBALL-DATA"}
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
