"use client"

import { useState, useTransition } from "react"
import { syncMatches } from "@/lib/actions"

export function SyncButton() {
  const [result, setResult] = useState<string>("")
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    setResult("")
    startTransition(async () => {
      const res = await syncMatches()
      if (res.error) setResult(`Fout: ${res.error}`)
      else setResult(`Gesynchroniseerd: ${res.synced} wedstrijden, ${res.updated} bijgewerkt.`)
    })
  }

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={isPending}
        className="bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
      >
        {isPending ? "Synchroniseren..." : "Sync football-data.org"}
      </button>
      {result && <p className="text-xs text-gray-600 mt-1">{result}</p>}
    </div>
  )
}
