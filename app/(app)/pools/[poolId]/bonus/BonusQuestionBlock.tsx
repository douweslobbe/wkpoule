"use client"

import { useState, useRef, useTransition } from "react"
import { saveBonusAnswer } from "@/lib/actions"
import { BonusQuestionType } from "@prisma/client"

type Question = {
  id: string
  type: BonusQuestionType
  question: string
  description?: string | null
  options?: string | null
  correctAnswer?: string | null
}

function AutocompleteInput({
  options,
  value,
  onChange,
  locked,
}: {
  options: string[]
  value: string
  onChange: (v: string) => void
  locked: boolean
}) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const filtered = options.filter((o) =>
    o.toLowerCase().includes(value.toLowerCase())
  )
  const showDropdown = open && !locked && filtered.length > 0

  return (
    <div ref={containerRef} className="relative flex-1 min-w-0">
      <input
        type="text"
        value={value}
        disabled={locked}
        onChange={(e) => { onChange(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="Typ om te zoeken..."
        className="pixel-input px-3 py-1.5 w-full"
      />
      {showDropdown && (
        <div
          className="absolute z-20 w-full mt-0.5 overflow-auto"
          style={{
            background: "var(--c-surface-alt)",
            border: "2px solid var(--c-border-bright)",
            boxShadow: "3px 3px 0 #000",
            maxHeight: "200px",
          }}
        >
          {filtered.map((opt) => (
            <button
              key={opt}
              type="button"
              onMouseDown={() => { onChange(opt); setOpen(false) }}
              className="w-full text-left px-3 py-1.5 transition-colors"
              style={{
                fontSize: "9px",
                color: "var(--c-text)",
                borderBottom: "1px solid var(--c-border)",
                fontFamily: "var(--font-pixel), monospace",
                background: opt === value ? "var(--c-surface-deep)" : "transparent",
              }}
            >
              {opt === value && <span style={{ color: "#FF6200", marginRight: "4px" }}>✓</span>}
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  )
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

  // Parse options from newline-separated string
  const optionList = question.options
    ? question.options.split("\n").map((s) => s.trim()).filter(Boolean)
    : []
  const hasOptions = optionList.length > 0

  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <p className="font-bold" style={{ color: "var(--c-text)", fontSize: "9px", lineHeight: "1.9", fontFamily: "var(--font-pixel), monospace" }}>{question.question}</p>
          {question.description && (
            <p className="mt-1" style={{ color: "var(--c-text-2)", fontSize: "7px", lineHeight: "1.8", fontFamily: "var(--font-pixel), monospace" }}>{question.description}</p>
          )}
        </div>
        {pointsAwarded !== null && pointsAwarded !== undefined && (
          <span className={pointsAwarded > 0 ? "pixel-badge-green" : "pixel-badge-gray"}>
            {pointsAwarded > 0 ? `+${pointsAwarded} pt` : "0 pt"}
          </span>
        )}
      </div>

      {correctAnswer && (
        <p className="mt-1" style={{ color: "var(--c-text-3)", fontSize: "7px", fontFamily: "var(--font-pixel), monospace", lineHeight: "1.8" }}>
          ANTWOORD:{" "}
          <span className="font-semibold" style={{ color: isCorrect ? "#4af56a" : "var(--c-text-2)" }}>
            {correctAnswer}
          </span>
        </p>
      )}

      {locked ? (
        <div className="mt-2">
          {answer ? (
            <span className="px-3 py-1 inline-block" style={{ background: "var(--c-input-bg)", color: "var(--c-text-2)", border: "2px solid var(--c-border-bright)", fontSize: "9px", fontFamily: "var(--font-pixel), monospace" }}>
              {answer}
            </span>
          ) : (
            <span className="italic" style={{ color: "var(--c-text-5)", fontSize: "8px", fontFamily: "var(--font-pixel), monospace" }}>Geen antwoord opgegeven</span>
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
                  className="px-4 py-2 font-bold transition-all"
                  style={{
                    background: answer === opt ? "#FF6200" : "var(--c-border)",
                    color: answer === opt ? "white" : "var(--c-text-nav)",
                    border: answer === opt ? "2px solid #000" : "2px solid var(--c-border-bright)",
                    boxShadow: answer === opt ? "2px 2px 0 #000" : "none",
                    fontFamily: "var(--font-pixel), monospace",
                    fontSize: "8px",
                  }}
                >
                  {opt.toUpperCase()}
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
              className="pixel-input px-3 py-1.5 w-32"
            />
          ) : hasOptions ? (
            <AutocompleteInput
              options={optionList}
              value={answer}
              onChange={(v) => { setAnswer(v); setSaved(false) }}
              locked={locked}
            />
          ) : (
            <input
              type="text"
              maxLength={64}
              value={answer}
              onChange={(e) => { setAnswer(e.target.value); setSaved(false) }}
              placeholder="Jouw antwoord..."
              className="pixel-input px-3 py-1.5 flex-1 min-w-0"
            />
          )}
          <button
            type="submit"
            disabled={isPending || !answer}
            className="px-3 py-1.5 text-sm font-bold transition-colors disabled:opacity-50"
            style={{
              background: saved && !error ? "#16a34a" : "#FF6200",
              color: "white",
              border: "2px solid #000",
              boxShadow: "2px 2px 0 #000",
              fontFamily: "var(--font-pixel), monospace",
              fontSize: "7px",
            }}
          >
            {isPending ? "..." : saved && !error ? "✓ OPGESLAGEN" : "OPSLAAN"}
          </button>
          {error && <p className="text-xs w-full" style={{ color: "#ff4444" }}>{error}</p>}
        </form>
      )}
    </div>
  )
}
