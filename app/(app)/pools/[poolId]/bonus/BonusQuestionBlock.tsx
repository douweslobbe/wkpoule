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
    <div ref={containerRef} className="relative w-full">
      <input
        type="text"
        value={value}
        disabled={locked}
        onChange={(e) => { onChange(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 200)}
        placeholder="Typ om te zoeken..."
        className="pixel-input px-3 w-full"
        style={{ padding: "10px 12px", fontSize: "9px" }}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
      />
      {showDropdown && (
        <div
          className="absolute z-30 w-full mt-0.5 overflow-auto"
          style={{
            background: "var(--c-surface-alt)",
            border: "2px solid var(--c-border-bright)",
            boxShadow: "3px 3px 0 #000",
            maxHeight: "240px",
            // Prevent dropdown going off-screen
            overscrollBehavior: "contain",
          }}
        >
          {filtered.map((opt) => (
            <button
              key={opt}
              type="button"
              onPointerDown={(e) => {
                // pointerDown fires before onBlur, preventing the dropdown closing before we pick
                e.preventDefault()
                onChange(opt)
                setOpen(false)
              }}
              className="w-full text-left px-3 transition-colors"
              style={{
                padding: "10px 12px",
                fontSize: "9px",
                color: "var(--c-text)",
                borderBottom: "1px solid var(--c-border)",
                fontFamily: "var(--font-pixel), monospace",
                background: opt === value ? "var(--c-surface-deep)" : "transparent",
                minHeight: "40px",
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

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault()
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

  // Auto-save helper — used by STATEMENT buttons
  async function pickAndSave(val: string) {
    setAnswer(val)
    setSaved(false)
    setError("")
    const fd = new FormData()
    fd.set("questionId", question.id)
    fd.set("answer", val)
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
        <form onSubmit={handleSubmit} className="mt-3">
          {question.type === "STATEMENT" ? (
            /* STATEMENT: grote knoppen, direct opslaan bij aanklikken */
            <div className="flex gap-2">
              {["eens", "oneens"].map((opt) => {
                const isSelected = answer === opt
                const isSavedOpt = isSelected && saved && !error
                return (
                  <button
                    key={opt}
                    type="button"
                    disabled={isPending}
                    onClick={() => pickAndSave(opt)}
                    style={{
                      flex: 1,
                      padding: "12px 8px",
                      fontFamily: "var(--font-pixel), monospace",
                      fontSize: "9px",
                      background: isSavedOpt ? "#16a34a" : isSelected ? "#FF6200" : "var(--c-surface-alt)",
                      color: isSelected ? "white" : "var(--c-text-nav)",
                      border: isSelected ? "2px solid #000" : "2px solid var(--c-border-bright)",
                      boxShadow: isSelected ? "2px 2px 0 #000" : "none",
                      touchAction: "manipulation",
                      cursor: isPending ? "not-allowed" : "pointer",
                      transition: "all 0.1s",
                    }}
                  >
                    {isSavedOpt ? `✓ ${opt.toUpperCase()}` : opt.toUpperCase()}
                  </button>
                )
              })}
            </div>
          ) : (
            /* ESTIMATION / OPEN / OPTIONS: input + opslaan-knop */
            <div className="flex flex-col gap-2">
              {question.type === "ESTIMATION" ? (
                <input
                  type="number"
                  min={0}
                  value={answer}
                  onChange={(e) => { setAnswer(e.target.value); setSaved(false) }}
                  placeholder="Jouw schatting..."
                  className="pixel-input px-3 w-full"
                  style={{ padding: "10px 12px", fontSize: "9px" }}
                  inputMode="numeric"
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
                  className="pixel-input px-3 w-full"
                  style={{ padding: "10px 12px", fontSize: "9px" }}
                />
              )}
              <button
                type="submit"
                disabled={isPending || !answer}
                className="w-full font-bold transition-colors disabled:opacity-50"
                style={{
                  padding: "10px",
                  background: saved && !error ? "#16a34a" : "#FF6200",
                  color: "white",
                  border: "2px solid #000",
                  boxShadow: "2px 2px 0 #000",
                  fontFamily: "var(--font-pixel), monospace",
                  fontSize: "8px",
                  touchAction: "manipulation",
                }}
              >
                {isPending ? "..." : saved && !error ? "✓ OPGESLAGEN" : "OPSLAAN"}
              </button>
            </div>
          )}
          {error && <p className="mt-1 text-xs" style={{ color: "#ff4444", fontFamily: "var(--font-pixel), monospace", fontSize: "7px" }}>{error}</p>}
        </form>
      )}
    </div>
  )
}
