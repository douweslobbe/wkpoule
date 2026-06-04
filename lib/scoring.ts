type Toto = "H" | "D" | "A"

function toto(home: number, away: number): Toto {
  if (home > away) return "H"
  if (home < away) return "A"
  return "D"
}

export function scoreGroupMatch(
  pred: { homeScore: number; awayScore: number },
  actual: { homeScore: number; awayScore: number }
): number {
  let pts = 0
  const correctToto = toto(pred.homeScore, pred.awayScore) === toto(actual.homeScore, actual.awayScore)
  if (correctToto) pts += 3
  if (pred.homeScore === actual.homeScore) pts += 1
  if (pred.awayScore === actual.awayScore) pts += 1
  if (pred.homeScore === actual.homeScore && pred.awayScore === actual.awayScore) pts += 2
  return pts
}

// Knock-outfase: alle punten tellen dubbel t.o.v. de groepsfase.
// Juiste uitslag +6, juiste thuis-/uitscore +2 elk, exact goed +4 bonus
// (max 14 i.p.v. 7). Zo blijven er tot de finale flinke verschuivingen
// mogelijk en doet iedereen tot het eind mee.
export function scoreKnockoutMatch(
  pred: { homeScore: number; awayScore: number },
  actual: { homeScore: number; awayScore: number }
): number {
  return 2 * scoreGroupMatch(pred, actual)
}

export const CHAMPION_POINTS = 15
export const BONUS_POINTS = 7

export function scoreEstimationQuestion(
  answers: { userId: string; answer: number }[],
  correct: number
): Map<string, number> {
  const result = new Map<string, number>()
  if (answers.length === 0) return result

  // Top 20% rounded up get points — e.g. 4→1, 5→1, 6→2, 10→2, 11→3, 16→4
  const winnerCount = Math.ceil(answers.length * 0.2)

  const sorted = [...answers].sort(
    (a, b) => Math.abs(a.answer - correct) - Math.abs(b.answer - correct)
  )

  // Cutoff distance is the distance of the last guaranteed winner.
  // Everyone AT that distance or closer gets points (handles ties).
  const cutoffIdx = Math.min(winnerCount - 1, sorted.length - 1)
  const cutoff = Math.abs(sorted[cutoffIdx].answer - correct)

  for (const a of answers) {
    result.set(a.userId, Math.abs(a.answer - correct) <= cutoff ? BONUS_POINTS : 0)
  }
  return result
}
