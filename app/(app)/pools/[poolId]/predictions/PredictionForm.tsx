"use client"

import { useState, useTransition } from "react"
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
  const [saved, setSaved] = useState(!!initialHome !== undefined && initialHome !== undefined)
  const [error, setError] = useState("")
  const [isPending, startTransition] = useTransition()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    const fd = new FormData()
    fd.set("matchId", matchId)
    fd.set("homeScore", home)
    fd.set("awayScore", away)

    startTransition(async () => {
      const result = await savePrediction(fd)
      if (result?.error) {
        setError(result.error)
      } else {
        setSaved(true)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 pt-3 border-t border-gray-100">
      <div className="flex items-center gap-3 justify-center">
        <span className="text-xs text-gray-400">Jouw voorspelling:</span>
        <input
          type="number"
          min={0}
          max={20}
          value={home}
          onChange={(e) => { setHome(e.target.value); setSaved(false) }}
          className="w-12 text-center border border-gray-300 rounded-lg py-1.5 font-semibold text-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          placeholder="–"
        />
        <span className="text-gray-400 font-bold">–</span>
        <input
          type="number"
          min={0}
          max={20}
          value={away}
          onChange={(e) => { setAway(e.target.value); setSaved(false) }}
          className="w-12 text-center border border-gray-300 rounded-lg py-1.5 font-semibold text-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          placeholder="–"
        />
        <button
          type="submit"
          disabled={isPending || home === "" || away === ""}
          className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-sm font-semibold px-3 py-1.5 rounded-lg transition-colors"
        >
          {isPending ? "..." : saved ? "Opgeslagen ✓" : "Opslaan"}
        </button>
      </div>
      {error && <p className="text-center text-xs text-red-600 mt-1">{error}</p>}
    </form>
  )
}
