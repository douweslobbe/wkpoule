"use client"

import { useState, useTransition } from "react"
import { addQuestionsFromLibrary } from "@/lib/actions"
import { DEFAULT_BONUS_QUESTIONS, QUESTION_CATEGORIES } from "@/lib/default-bonus-questions"

export function TemplateLibrary({
  poolId,
  existingQuestions,
}: {
  poolId: string
  existingQuestions: string[]
}) {
  const [added, setAdded] = useState<Set<string>>(new Set(existingQuestions))
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set())
  const [isPending, startTransition] = useTransition()
  const [pendingKeys, setPendingKeys] = useState<Set<string>>(new Set())

  function toggleCategory(cat: string) {
    setOpenCategories((prev) => {
      const next = new Set(prev)
      next.has(cat) ? next.delete(cat) : next.add(cat)
      return next
    })
  }

  function addQuestions(questions: typeof DEFAULT_BONUS_QUESTIONS) {
    const toAdd = questions.filter((q) => !added.has(q.question))
    if (toAdd.length === 0) return

    const keys = new Set(toAdd.map((q) => q.question))
    setPendingKeys((prev) => new Set([...prev, ...keys]))

    startTransition(async () => {
      const result = await addQuestionsFromLibrary(poolId, toAdd)
      if (!result?.error) {
        setAdded((prev) => new Set([...prev, ...keys]))
      }
      setPendingKeys((prev) => {
        const next = new Set(prev)
        keys.forEach((k) => next.delete(k))
        return next
      })
    })
  }

  return (
    <div className="space-y-2">
      {QUESTION_CATEGORIES.map((cat) => {
        const catQuestions = DEFAULT_BONUS_QUESTIONS.filter((q) => q.category === cat)
        const addedCount = catQuestions.filter((q) => added.has(q.question)).length
        const allAdded = addedCount === catQuestions.length
        const isOpen = openCategories.has(cat)

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
              {!allAdded && (
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
            </div>

            {/* Questions list */}
            {isOpen && (
              <div>
                {catQuestions.map((q) => {
                  const isAdded = added.has(q.question)
                  const isPendingQ = pendingKeys.has(q.question)
                  return (
                    <div
                      key={q.question}
                      className="flex items-start gap-3 px-4 py-3"
                      style={{
                        borderBottom: "1px solid var(--c-border)",
                        background: isAdded ? "var(--c-surface-deep)" : "var(--c-surface)",
                        opacity: isAdded ? 0.7 : 1,
                      }}
                    >
                      <div className="flex-1 min-w-0">
                        <p style={{ fontSize: "9px", color: "var(--c-text)", lineHeight: "1.7" }}>
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
                        disabled={isAdded || isPending}
                        className="shrink-0 px-2 py-1 font-bold transition-all disabled:opacity-50"
                        style={{
                          background: isAdded ? "#16a34a" : "#FF6200",
                          color: "white",
                          border: "2px solid #000",
                          boxShadow: isAdded ? "none" : "1px 1px 0 #000",
                          fontFamily: "var(--font-pixel), monospace",
                          fontSize: "7px",
                          minWidth: "4rem",
                        }}
                      >
                        {isPendingQ ? "..." : isAdded ? "✓ Toegevoegd" : "+ Voeg toe"}
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
