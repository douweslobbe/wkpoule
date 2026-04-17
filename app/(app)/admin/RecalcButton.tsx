"use client"

import { useState, useTransition } from "react"
import { recalcAllScores } from "@/lib/actions"

export function RecalcButton() {
  const [result, setResult] = useState<string>("")
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    setResult("")
    startTransition(async () => {
      const res = await recalcAllScores()
      if (res?.error) setResult(`Fout: ${res.error}`)
      else setResult("Alle punten herberekend.")
    })
  }

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={isPending}
        className="bg-gray-700 hover:bg-gray-800 disabled:opacity-60 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
      >
        {isPending ? "Berekenen..." : "Punten herberekenen"}
      </button>
      {result && <p className="text-xs text-gray-600 mt-1">{result}</p>}
    </div>
  )
}
