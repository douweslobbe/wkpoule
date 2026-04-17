"use client"

import { useState, useTransition } from "react"
import { saveBonusAnswer } from "@/lib/actions"
import { BonusQuestionType } from "@prisma/client"

type Question = {
  id: string
  type: BonusQuestionType
  question: string
  description?: string | null
  correctAnswer?: string | null
}

export function BonusQuestionBlock({
  question,
  currentAnswer,
  pointsAwarded,
  locked,
  correctAnswer,
}: {
  question: Question
  currentAnswer?: string
  pointsAwarded?: number | null
  locked: boolean
  correctAnswer?: string | null
}) {
  const [answer, setAnswer] = useState(currentAnswer ?? "")
  const [saved, setSaved] = useState(!!currentAnswer)
  const [error, setError] = useState("")
  const [isPending, startTransition] = useTransition()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    const fd = new FormData()
    fd.set("questionId", question.id)
    fd.set("answer", answer)
    startTransition(async () => {
      const result = await saveBonusAnswer(fd)
      if (result?.error) setError(result.error)
      else setSaved(true)
    })
  }

  const isCorrect = correctAnswer && answer.toLowerCase().trim() === correctAnswer.toLowerCase().trim()

  return (
    <div className="px-5 py-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <p className="font-medium text-gray-900">{question.question}</p>
          {question.description && (
            <p className="text-xs text-gray-500 mt-0.5">{question.description}</p>
          )}
        </div>
        {pointsAwarded !== null && pointsAwarded !== undefined && (
          <span className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${
            pointsAwarded > 0 ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
          }`}>
            {pointsAwarded > 0 ? `+${pointsAwarded} pt` : "0 pt"}
          </span>
        )}
      </div>

      {correctAnswer && (
        <p className="text-xs text-gray-500 mt-1">
          Correct antwoord:{" "}
          <span className={`font-semibold ${isCorrect ? "text-green-600" : "text-gray-700"}`}>
            {correctAnswer}
          </span>
        </p>
      )}

      {locked ? (
        <div className="mt-2">
          {answer ? (
            <span className="text-sm text-gray-700 bg-gray-100 px-3 py-1 rounded-lg inline-block">
              {answer}
            </span>
          ) : (
            <span className="text-sm text-gray-400 italic">Geen antwoord opgegeven</span>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-2 flex items-center gap-2 flex-wrap">
          {question.type === "STATEMENT" ? (
            <div className="flex gap-2">
              {["eens", "oneens"].map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => { setAnswer(opt); setSaved(false) }}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                    answer === opt
                      ? "bg-orange-500 text-white border-orange-500"
                      : "bg-white text-gray-600 border-gray-300 hover:border-orange-400"
                  }`}
                >
                  {opt.charAt(0).toUpperCase() + opt.slice(1)}
                </button>
              ))}
            </div>
          ) : question.type === "ESTIMATION" ? (
            <input
              type="number"
              min={0}
              value={answer}
              onChange={(e) => { setAnswer(e.target.value); setSaved(false) }}
              placeholder="Schatting..."
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm w-32 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          ) : (
            <input
              type="text"
              maxLength={64}
              value={answer}
              onChange={(e) => { setAnswer(e.target.value); setSaved(false) }}
              placeholder="Jouw antwoord..."
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm flex-1 min-w-0 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          )}
          <button
            type="submit"
            disabled={isPending || !answer}
            className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-sm font-semibold px-3 py-1.5 rounded-lg transition-colors shrink-0"
          >
            {isPending ? "..." : saved && !error ? "Opgeslagen ✓" : "Opslaan"}
          </button>
          {error && <p className="text-xs text-red-600 w-full">{error}</p>}
        </form>
      )}
    </div>
  )
}
