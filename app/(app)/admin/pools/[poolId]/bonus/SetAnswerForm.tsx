"use client"

import { useState, useTransition } from "react"
import { setCorrectBonusAnswer } from "@/lib/actions"
import { BonusQuestionType } from "@prisma/client"

export function SetAnswerForm({
  questionId,
  currentAnswer,
  type,
}: {
  questionId: string
  currentAnswer?: string | null
  type: BonusQuestionType
}) {
  const [answer, setAnswer] = useState(currentAnswer ?? "")
  const [saved, setSaved] = useState(!!currentAnswer)
  const [error, setError] = useState("")
  const [isPending, startTransition] = useTransition()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    const fd = new FormData()
    fd.set("questionId", questionId)
    fd.set("correctAnswer", answer)
    startTransition(async () => {
      const result = await setCorrectBonusAnswer(fd)
      if (result?.error) setError(result.error)
      else setSaved(true)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 flex-wrap">
      <span className="text-xs text-gray-500">Correct antwoord:</span>
      {type === "STATEMENT" ? (
        <select
          value={answer}
          onChange={(e) => { setAnswer(e.target.value); setSaved(false) }}
          className="border border-gray-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
        >
          <option value="">— kies —</option>
          <option value="eens">Eens</option>
          <option value="oneens">Oneens</option>
        </select>
      ) : (
        <input
          type={type === "ESTIMATION" ? "number" : "text"}
          value={answer}
          onChange={(e) => { setAnswer(e.target.value); setSaved(false) }}
          placeholder={type === "ESTIMATION" ? "Getal..." : "Antwoord..."}
          className="border border-gray-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
      )}
      <button
        type="submit"
        disabled={isPending || !answer}
        className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-xs font-semibold px-3 py-1.5 rounded-lg"
      >
        {isPending ? "..." : saved ? "Opgeslagen ✓" : "Instellen"}
      </button>
      {error && <p className="text-xs text-red-600 w-full">{error}</p>}
    </form>
  )
}
