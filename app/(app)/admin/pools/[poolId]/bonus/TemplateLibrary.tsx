"use client"

import { useState, useTransition } from "react"
import { addQuestionsFromLibrary } from "@/lib/actions"
import { DEFAULT_BONUS_QUESTIONS, QUESTION_CATEGORIES } from "@/lib/default-bonus-questions"
import { BonusQuestionType } from "@prisma/client"

type Limits = {
  remainingTotal: number
  remaining: Record<BonusQuestionType, number>
}

const TYPE_BADGE: Record<BonusQuestionType, { label: string; color: string }> = {
  OPEN:       { label: "Open",     color: "#4499ff" },
  ESTIMATION: { label: "Schatting", color: "#FFD700" },
  STATEMENT:  { label: "Stelling",  color: "#4af56a" },
}

export function TemplateLibrary({
  poolId,
  existingQuestions,
  limits,
}: {
  poolId: string
  existingQuestions: string[]
  limits: Limits
}) {
  const [added, setAdded] = useState<Set<string>>(new Set(existingQuestions))
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set())
  const [isPending, startTransition] = useTransition()
  const [pendingKeys, setPendingKeys] = useState<Set<string>>(new Set())
  // Optimistic tracking of remaining slots
  const [remaining, setRemaining] = useState<Limits>(limits)

  function toggleCategory(cat: string) {
    setOpenCategories((prev) => {
      const next = new Set(prev)
      next.has(cat) ? next.delete(cat) : next.add(cat)
      return next
    })
  }

  function canAdd(type: BonusQuestionType): boolean {
    return remaining.remainingTotal > 0 && remaining.remaining[type] > 0
  }

  function addQuestions(questions: typeof DEFAULT_BONUS_QUESTIONS) {
    const toAdd = questions.filter((q) => !added.has(q.question) && canAdd(q.type as BonusQuestionType))
    if (toAdd.length === 0) return

    const keys = new Set(toAdd.map((q) => q.question))
    setPendingKeys((prev) => new Set([...prev, ...keys]))

    // Optimistically reduce remaining counts
    setRemaining((prev) => {
      const next = { ...prev, remaining: { ...prev.remaining } }
      let totalReduced = 0
      for (const q of toAdd) {
        const type = q.type as BonusQuestionType
        if (next.remaining[type] > 0 && next.remainingTotal > 0) {
          next.remaining[type]--
          next.remainingTotal--
          totalReduced++
        }
      }
      return next
    })

    startTransition(async () => {
      const result = await addQuestionsFromLibrary(poolId, toAdd)
      if (!result?.error) {
        setAdded((prev) => new Set([...prev, ...keys]))
      } else {
        // Roll back optimistic update on error
        setRemaining(limits)
      }
      setPendingKeys((prev) => {
        const next = new Set(prev)
        keys.forEach((k) => next.delete(k))
        return next
      })
    })
  }

  const atTotalLimit = remaining.remainingTotal <= 0

  return (
    <div className="space-y-2">
      {/* Capacity bar */}
      <div
        className="flex flex-wrap gap-x-4 gap-y-1 px-3 py-2 mb-3"
        style={{ background: "var(--c-surface-deep)", border: "1px solid var(--c-border)", fontSize: "7px", fontFamily: "var(--font-pixel), monospace" }}
      >
        <span style={{ color: atTotalLimit ? "#ff4444" : "var(--c-text-3)" }}>
          Totaal nog beschikbaar:{" "}
          <strong style={{ color: atTotalLimit ? "#ff4444" : "#FFD700" }}>{remaining.remainingTotal}</strong>
        </span>
        {(["OPEN", "ESTIMATION", "STATEMENT"] as BonusQuestionType[]).map((type) => {
          const r = remaining.remaining[type]
          return (
            <span key={type} style={{ color: r <= 0 ? "#ff4444" : "var(--c-text-4)" }}>
              {TYPE_BADGE[type].label}:{" "}
              <strong style={{ color: r <= 0 ? "#ff4444" : TYPE_BADGE[type].color }}>{r}</strong>
            </span>
          )
        })}
      </div>

      {QUESTION_CATEGORIES.map((cat) => {
        const catQuestions = DEFAULT_BONUS_QUESTIONS.filter((q) => q.category === cat)
        const addedCount = catQuestions.filter((q) => added.has(q.question)).length
        const allAdded = addedCount === catQuestions.length
        const isOpen = openCategories.has(cat)
        // Can any question in this category still be added?
        const canAddAny = catQuestions.some((q) => !added.has(q.question) && canAdd(q.type as BonusQuestionType))

        return (
          <div
            key={cat}
            className="overflow-hidden"
            style={{ border: "2px solid var(--c-border)", boxShadow: "2px 2px 0 #000" }}
          >
            {/* Category header */}
            <div
              className="flex items-center gap-3 px-4 py-3 cursor-pointer"
              style={{
                background: allAdded ? "#0d1f0d" : "var(--c-surface-alt)",
                borderBottom: isOpen ? "2px solid var(--c-border)" : "none",
              }}
              onClick={() => toggleCategory(cat)}
            >
              <span
                className="font-pixel flex-1"
                style={{ fontSize: "8px", color: allAdded ? "#4af56a" : "var(--c-text)" }}
              >
                {isOpen ? "▼" : "▶"} {cat}
              </span>
              <span
                className="font-pixel shrink-0"
                style={{ fontSize: "7px", color: "var(--c-text-4)" }}
              >
                {addedCount}/{catQuestions.length} toegevoegd
              </span>
              {!allAdded && canAddAny && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); addQuestions(catQuestions) }}
                  disabled={isPending}
                  className="shrink-0 px-2 py-1 font-bold transition-all disabled:opacity-50"
                  style={{
                    background: "#FF6200",
                    color: "white",
                    border: "2px solid #000",
                    boxShadow: "1px 1px 0 #000",
                    fontFamily: "var(--font-pixel), monospace",
                    fontSize: "7px",
                  }}
                >
                  + Alles
                </button>
              )}
              {!allAdded && !canAddAny && (
                <span className="font-pixel shrink-0" style={{ fontSize: "6px", color: "#ff4444" }}>LIMIET VOL</span>
              )}
            </div>

            {/* Questions list */}
            {isOpen && (
              <div>
                {catQuestions.map((q) => {
                  const isAdded = added.has(q.question)
                  const isPendingQ = pendingKeys.has(q.question)
                  const type = q.type as BonusQuestionType
                  const isBlocked = !isAdded && !canAdd(type)
                  const badge = TYPE_BADGE[type]
                  return (
                    <div
                      key={q.question}
                      className="flex items-start gap-3 px-4 py-3"
                      style={{
                        borderBottom: "1px solid var(--c-border)",
                        background: isAdded ? "var(--c-surface-deep)" : "var(--c-surface)",
                        opacity: isAdded || isBlocked ? 0.6 : 1,
                      }}
                    >
                      <div className="flex-1 min-w-0">
                        <p style={{ fontSize: "9px", color: "var(--c-text)", lineHeight: "1.7" }}>
                          <span
                            className="font-pixel mr-1.5 px-1 py-0.5 inline-block"
                            style={{ fontSize: "6px", background: "var(--c-surface-deep)", color: badge.color, border: `1px solid ${badge.color}44` }}
                          >
                            {badge.label.toUpperCase()}
                          </span>
                          {q.question}
                        </p>
                        {q.description && (
                          <p
                            className="font-pixel mt-0.5"
                            style={{ fontSize: "6px", color: "var(--c-text-4)", lineHeight: "1.8" }}
                          >
                            {q.description}
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => addQuestions([q])}
                        disabled={isAdded || isPending || isBlocked}
                        title={isBlocked ? `Limiet voor ${badge.label.toLowerCase()}vragen bereikt` : undefined}
                        className="shrink-0 px-2 py-1 font-bold transition-all disabled:opacity-50"
                        style={{
                          background: isAdded ? "#16a34a" : isBlocked ? "#333" : "#FF6200",
                          color: "white",
                          border: "2px solid #000",
                          boxShadow: isAdded || isBlocked ? "none" : "1px 1px 0 #000",
                          fontFamily: "var(--font-pixel), monospace",
                          fontSize: "7px",
                          minWidth: "4rem",
                        }}
                      >
                        {isPendingQ ? "..." : isAdded ? "✓ Ok" : isBlocked ? "✗ Vol" : "+ Voeg toe"}
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
