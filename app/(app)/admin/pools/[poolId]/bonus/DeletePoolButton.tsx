"use client"

import { useTransition, useState } from "react"
import { useRouter } from "next/navigation"
import { requestDeletePool } from "@/lib/actions"

export function DeletePoolButton({ poolId, poolName }: { poolId: string; poolName: string }) {
  const [isPending, startTransition] = useTransition()
  const [confirmed, setConfirmed] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  function handleClick() {
    if (!confirmed) {
      setConfirmed(true)
      return
    }
    // Tweede klik = definitief
    const typed = window.prompt(`Type de poolnaam om te bevestigen:\n"${poolName}"`)
    if (typed?.trim() !== poolName.trim()) {
      setConfirmed(false)
      setError("Naam komt niet overeen — verwijdering geannuleerd.")
      return
    }
    startTransition(async () => {
      const res = await requestDeletePool(poolId)
      if ("error" in res) {
        setError(res.error ?? null)
        setConfirmed(false)
      } else {
        router.push("/dashboard")
      }
    })
  }

  return (
    <div className="mt-2">
      {error && (
        <p className="font-pixel mb-2" style={{ fontSize: "7px", color: "#ff4444" }}>⚠ {error}</p>
      )}
      <button
        onClick={handleClick}
        disabled={isPending}
        className="font-pixel px-3 py-2"
        style={{
          fontSize: "7px",
          background: confirmed ? "#ff4444" : "transparent",
          color: confirmed ? "#fff" : "#ff4444",
          border: "2px solid #ff4444",
          cursor: "pointer",
          opacity: isPending ? 0.5 : 1,
        }}
      >
        {isPending ? "BEZIG..." : confirmed ? "⚠ KLIK NOGMAALS OM TE BEVESTIGEN" : "🗑 POOL VERWIJDEREN"}
      </button>
      {confirmed && (
        <p className="font-pixel mt-1" style={{ fontSize: "6px", color: "#ff8888" }}>
          Je wordt gevraagd de poolnaam in te typen. De globale admin verwijdert de pool definitief.
        </p>
      )}
    </div>
  )
}
