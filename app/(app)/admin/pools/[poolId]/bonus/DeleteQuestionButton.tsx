"use client"

import { useTransition, useState } from "react"
import { deleteBonusQuestion } from "@/lib/actions"

export function DeleteQuestionButton({
  questionId,
  poolId,
  answerCount,
}: {
  questionId: string
  poolId: string
  answerCount: number
}) {
  const [isPending, startTransition] = useTransition()
  const [confirm, setConfirm] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteBonusQuestion(questionId, poolId)
      if (result?.error) {
        setError(result.error)
        setConfirm(false)
      }
    })
  }

  if (error) {
    return (
      <span className="font-pixel" style={{ fontSize: "6px", color: "#ff4444" }}>
        ✗ {error}
      </span>
    )
  }

  if (confirm) {
    return (
      <div className="flex items-center gap-1.5">
        {answerCount > 0 && (
          <span className="font-pixel" style={{ fontSize: "6px", color: "#FFD700" }}>
            ⚠ {answerCount} antw. gaan verloren
          </span>
        )}
        <button
          type="button"
          onClick={handleDelete}
          disabled={isPending}
          className="font-pixel px-2 py-0.5 disabled:opacity-50"
          style={{ background: "#cc0000", color: "white", border: "2px solid #000", fontSize: "6px", boxShadow: "1px 1px 0 #000" }}
        >
          {isPending ? "..." : "✓ JA, VERWIJDER"}
        </button>
        <button
          type="button"
          onClick={() => setConfirm(false)}
          disabled={isPending}
          className="font-pixel px-2 py-0.5"
          style={{ background: "var(--c-border)", color: "var(--c-text-3)", border: "1px solid var(--c-border-mid)", fontSize: "6px" }}
        >
          ANNULEER
        </button>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => setConfirm(true)}
      className="font-pixel px-2 py-0.5 transition-all hover:opacity-80"
      style={{
        background: "transparent",
        color: "#884444",
        border: "1px solid #553333",
        fontSize: "6px",
      }}
      title="Vraag verwijderen (tot toernooistart)"
    >
      ✕ Verwijder
    </button>
  )
}
