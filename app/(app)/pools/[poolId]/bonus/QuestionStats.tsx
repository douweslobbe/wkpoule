import { BonusQuestionType } from "@prisma/client"

type Answer = { answer: string }

export function QuestionStats({
  type,
  answers,
  myAnswer,
}: {
  type: BonusQuestionType
  answers: Answer[]
  myAnswer?: string
}) {
  if (answers.length === 0) {
    return <p className="mt-1 italic" style={{ color: "var(--c-text-5)", fontSize: "7px" }}>Nog niemand beantwoord</p>
  }

  if (type === "STATEMENT") {
    const eens = answers.filter((a) => a.answer.toLowerCase() === "eens").length
    const oneens = answers.filter((a) => a.answer.toLowerCase() === "oneens").length
    const total = answers.length
    const eensPct = Math.round((eens / total) * 100)
    const oneensPct = 100 - eensPct

    return (
      <div className="mt-2" style={{ fontSize: "8px", color: "var(--c-text-3)", fontFamily: "var(--font-pixel), monospace", lineHeight: "1.8" }}>
        <div className="flex items-center gap-2 mb-1">
          <span className="shrink-0" style={{ color: "var(--c-text-4)" }}>{total} picks:</span>
          <div className="flex-1 h-4 flex overflow-hidden" style={{ border: "2px solid #000" }}>
            <div
              style={{ width: `${eensPct}%`, background: "#16a34a" }}
              title={`Eens: ${eens}`}
              className="flex items-center justify-center text-white font-bold"
            >
              {eensPct >= 20 && <span style={{ fontSize: "8px" }}>{eensPct}%</span>}
            </div>
            <div
              style={{ width: `${oneensPct}%`, background: "#cc2222" }}
              title={`Oneens: ${oneens}`}
              className="flex items-center justify-center text-white font-bold"
            >
              {oneensPct >= 20 && <span style={{ fontSize: "8px" }}>{oneensPct}%</span>}
            </div>
          </div>
          <span className="shrink-0 font-semibold" style={{ color: "#4af56a" }}>{eens}× eens</span>
          <span className="shrink-0 font-semibold" style={{ color: "#ff4444" }}>{oneens}× oneens</span>
        </div>
        {myAnswer && (
          <span style={{ color: "var(--c-text-4)" }}>
            Jij koos <strong style={{ color: "var(--c-text-2)" }}>{myAnswer}</strong>
            {myAnswer === "eens" && eensPct > 50 && " · meerderheid is het met je eens 👍"}
            {myAnswer === "oneens" && oneensPct > 50 && " · meerderheid is het met je oneens 🤔"}
            {myAnswer === "eens" && eensPct <= 50 && " · jij gaat tegen de stroom in ⚡"}
            {myAnswer === "oneens" && oneensPct <= 50 && " · jij gaat tegen de stroom in ⚡"}
          </span>
        )}
      </div>
    )
  }

  if (type === "ESTIMATION") {
    const nums = answers
      .map((a) => Number(a.answer))
      .filter((n) => !isNaN(n) && isFinite(n))
      .sort((a, b) => a - b)
    if (nums.length === 0) return null

    const avg = Math.round(nums.reduce((s, n) => s + n, 0) / nums.length)
    const median = nums[Math.floor(nums.length / 2)]
    const min = nums[0]
    const max = nums[nums.length - 1]
    const myNum = myAnswer !== undefined ? Number(myAnswer) : NaN

    // Top 20% wint (naar boven afgerond) — zelfde logica als scoring.ts
    const winnerCount = Math.ceil(nums.length * 0.2)

    const distToMedian = (n: number) => Math.abs(n - median)
    const myDist = !isNaN(myNum) ? distToMedian(myNum) : Infinity
    const myRankAmongAll = nums.filter((n) => distToMedian(n) < myDist).length + 1
    const isWinner = myRankAmongAll <= winnerCount

    return (
      <div className="mt-2 space-y-1" style={{ fontSize: "8px", color: "var(--c-text-3)", fontFamily: "var(--font-pixel), monospace", lineHeight: "1.8" }}>
        <div className="flex flex-wrap gap-x-4 gap-y-0.5">
          <span>📊 {nums.length} schattingen</span>
          <span>Gem: <strong style={{ color: "var(--c-text-2)" }}>{avg}</strong></span>
          <span>Mediaan: <strong style={{ color: "var(--c-text-2)" }}>{median}</strong></span>
          <span>Bereik: {min}–{max}</span>
          <span style={{ color: "var(--c-text-4)" }}>Top {winnerCount} wint</span>
        </div>
        {!isNaN(myNum) && (
          <div className="flex items-center gap-2">
            <span>Jij: <strong style={{ color: "var(--c-text-2)" }}>{myNum}</strong></span>
            <span className="font-semibold" style={{ color: isWinner ? "#4af56a" : "var(--c-text-3)" }}>
              → positie ~{myRankAmongAll}/{nums.length}
              {isWinner && " 🎯 in de top!"}
            </span>
          </div>
        )}
        {/* Mini distribution bar */}
        <div className="flex h-3 gap-px mt-1" style={{ border: "1px solid var(--c-border-mid)" }}>
          {nums.map((n, i) => {
            const isMe = !isNaN(myNum) && n === myNum
            return (
              <div
                key={i}
                className="flex-1"
                style={{ background: isMe ? "#FF6200" : "#1a6b36" }}
                title={`${n}`}
              />
            )
          })}
        </div>
        <p style={{ fontSize: "7px", color: "var(--c-text-5)" }}>
          Oranje = jouw schatting · groen = anderen (gesorteerd)
        </p>
      </div>
    )
  }

  if (type === "OPEN") {
    const freq: Record<string, number> = {}
    for (const a of answers) {
      const key = a.answer.toLowerCase().trim()
      freq[key] = (freq[key] ?? 0) + 1
    }
    const sorted = Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)

    const myKey = myAnswer?.toLowerCase().trim()

    return (
      <div className="mt-2" style={{ fontSize: "8px", color: "var(--c-text-3)", fontFamily: "var(--font-pixel), monospace", lineHeight: "1.8" }}>
        <span style={{ color: "var(--c-text-4)" }}>Pool kiest ({answers.length}×): </span>
        <div className="flex flex-wrap gap-1.5 mt-1">
          {sorted.map(([ans, cnt]) => (
            <span
              key={ans}
              className="px-2 py-0.5 font-semibold"
              style={{
                background: myKey === ans ? "#FF6200" : "var(--c-border)",
                color: myKey === ans ? "white" : "var(--c-text-2)",
                border: myKey === ans ? "1px solid #000" : "1px solid var(--c-border-mid)",
              }}
            >
              {ans} <span style={{ opacity: 0.6 }}>({cnt}×)</span>
            </span>
          ))}
        </div>
        {myAnswer && !sorted.find(([a]) => a === myKey) && (
          <p className="mt-1" style={{ color: "#FF6200" }}>Jij als enige: <strong>{myAnswer}</strong> 🦄</p>
        )}
      </div>
    )
  }

  return null
}
