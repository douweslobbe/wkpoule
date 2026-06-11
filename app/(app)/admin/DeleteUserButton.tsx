"use client"

import { useTransition, useState } from "react"
import { adminDeleteUser } from "@/lib/actions"

export function DeleteUserButton({ userId, userName }: { userId: string; userName: string }) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleDelete() {
    const typed = window.prompt(
      `DEFINITIEF VERWIJDEREN\n\nAlle data van deze gebruiker wordt gewist (voorspellingen, WK Manager-team, Survivor, bonusantwoorden, badges). Dit kan niet ongedaan worden gemaakt.\n\nType de naam om te bevestigen:\n"${userName}"`,
    )
    if (typed === null) return // geannuleerd
    if (typed.trim() !== userName.trim()) {
      setError("Naam klopt niet — geannuleerd.")
      return
    }
    setError(null)
    startTransition(async () => {
      const res = await adminDeleteUser(userId)
      if ("error" in res && res.error) setError(res.error)
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
          background: "transparent",
          color: "#ff6666",
          border: "1px solid #553333",
          cursor: isPending ? "default" : "pointer",
          opacity: isPending ? 0.5 : 1,
        }}
        title="Gebruiker definitief verwijderen"
      >
        {isPending ? "..." : "🗑 VERWIJDER"}
      </button>
      {error && (
        <div className="font-pixel mt-1" style={{ fontSize: "6px", color: "#ff4444" }}>{error}</div>
      )}
    </div>
  )
}
