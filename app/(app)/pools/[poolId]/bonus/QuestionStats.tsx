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
    return <p className="text-xs text-gray-400 mt-1 italic">Nog niemand beantwoord</p>
  }

  if (type === "STATEMENT") {
    const eens = answers.filter((a) => a.answer.toLowerCase() === "eens").length
    const oneens = answers.filter((a) => a.answer.toLowerCase() === "oneens").length
    const total = answers.length
    const eensPct = Math.round((eens / total) * 100)
    const oneensPct = 100 - eensPct

    return (
      <div className="mt-2 text-xs text-gray-500">
        <div className="flex items-center gap-2 mb-1">
          <span className="shrink-0 text-gray-400">{total} picks:</span>
          <div className="flex-1 h-4 flex overflow-hidden" style={{ border: "2px solid #1a1a2e" }}>
            <div
              style={{ width: `${eensPct}%`, background: "#16a34a" }}
              title={`Eens: ${eens}`}
              className="flex items-center justify-center text-white font-bold"
            >
              {eensPct >= 20 && <span style={{ fontSize: "8px" }}>{eensPct}%</span>}
            </div>
            <div
              style={{ width: `${oneensPct}%`, background: "#dc2626" }}
              title={`Oneens: ${oneens}`}
              className="flex items-center justify-center text-white font-bold"
            >
              {oneensPct >= 20 && <span style={{ fontSize: "8px" }}>{oneensPct}%</span>}
            </div>
          </div>
          <span className="shrink-0 text-green-600 font-semibold">{eens}× eens</span>
          <span className="shrink-0 text-red-500 font-semibold">{oneens}× oneens</span>
        </div>
        {myAnswer && (
          <span className="text-gray-400">
            Jij koos <strong className="text-gray-600">{myAnswer}</strong>
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

    // Rank: how close am I to median vs others?
    const distToMedian = (n: number) => Math.abs(n - median)
    const myDist = !isNaN(myNum) ? distToMedian(myNum) : Infinity
    const myRankAmongAll = nums.filter((n) => distToMedian(n) < myDist).length + 1

    return (
      <div className="mt-2 space-y-1 text-xs text-gray-500">
        <div className="flex flex-wrap gap-x-4 gap-y-0.5">
          <span>📊 {nums.length} schattingen</span>
          <span>Gem: <strong className="text-gray-700">{avg}</strong></span>
          <span>Mediaan: <strong className="text-gray-700">{median}</strong></span>
          <span>Bereik: {min}–{max}</span>
        </div>
        {!isNaN(myNum) && (
          <div className="flex items-center gap-2">
            <span>Jij: <strong className="text-gray-700">{myNum}</strong></span>
            <span className={`font-semibold ${myRankAmongAll <= 3 ? "text-green-600" : "text-gray-500"}`}>
              → positie ~{myRankAmongAll}/{nums.length} t.o.v. mediaan
              {myRankAmongAll <= 3 && " 🎯"}
            </span>
          </div>
        )}
        {/* Mini distribution bar */}
        <div className="flex h-3 gap-px mt-1" style={{ border: "1px solid #1a1a2e" }}>
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
        <p className="text-gray-400" style={{ fontSize: "10px" }}>
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
      <div className="mt-2 text-xs text-gray-500">
        <span className="text-gray-400">Pool kiest ({answers.length}×): </span>
        <div className="flex flex-wrap gap-1.5 mt-1">
          {sorted.map(([ans, cnt]) => (
            <span
              key={ans}
              className="px-2 py-0.5 font-semibold"
              style={{
                background: myKey === ans ? "#FF6200" : "#e5e7eb",
                color: myKey === ans ? "white" : "#374151",
                border: "1px solid #1a1a2e",
              }}
            >
              {ans} <span className="opacity-70">({cnt}×)</span>
            </span>
          ))}
        </div>
        {myAnswer && !sorted.find(([a]) => a === myKey) && (
          <p className="mt-1 text-orange-500">Jij als enige: <strong>{myAnswer}</strong> 🦄</p>
        )}
      </div>
    )
  }

  return null
}
