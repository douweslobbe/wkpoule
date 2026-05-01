// ─── Rondes ───────────────────────────────────────────────────────────────────

// Lokale type definitie zodat het werkt voor én na prisma generate
export type PlayerPosition = "GK" | "DEF" | "MID" | "FWD"

export type FantasyRound =
  | "GROUP_1"
  | "GROUP_2"
  | "GROUP_3"
  | "ROUND_OF_32"
  | "ROUND_OF_16"
  | "QUARTER_FINAL"
  | "SEMI_FINAL"
  | "FINAL"

export const FANTASY_ROUND_LABELS: Record<FantasyRound, string> = {
  GROUP_1: "Groepsfase — speelronde 1",
  GROUP_2: "Groepsfase — speelronde 2",
  GROUP_3: "Groepsfase — speelronde 3",
  ROUND_OF_32: "Ronde van 32",
  ROUND_OF_16: "Achtste finales",
  QUARTER_FINAL: "Kwartfinales",
  SEMI_FINAL: "Halve finales",
  FINAL: "Finale",
}

// Transfer-ronden: initiële selectie + wijzigingen per ronde (t/m kwartfinales)
export const TRANSFER_ROUNDS: FantasyRound[] = [
  "GROUP_1",
  "GROUP_2",
  "GROUP_3",
  "ROUND_OF_32",
  "ROUND_OF_16",
  "QUARTER_FINAL",
]

export const MAX_TRANSFERS_PER_ROUND = 2

// ─── Selectieregels ───────────────────────────────────────────────────────────

export const SQUAD_SIZE = 15
export const POSITION_LIMITS: Record<PlayerPosition, number> = {
  GK: 2,
  DEF: 5,
  MID: 5,
  FWD: 3,
}

/** Max spelers van hetzelfde land in groepsfase */
export const MAX_PER_COUNTRY_GROUP = 2
/** Max spelers van hetzelfde land in KO-ronden */
export const MAX_PER_COUNTRY_KO = 3

// Deadline voor initiële selectie (zelfde als bonusvragen)
export const FANTASY_DEADLINE = new Date("2026-06-11T20:00:00Z")

// ─── FPL-achtig puntensysteem ─────────────────────────────────────────────────

export interface FantasyStatsInput {
  position: PlayerPosition
  minutesPlayed: number
  goals: number
  assists: number
  cleanSheet: boolean
  goalsConceded: number
  shotsSaved: number
  penaltySaved: number
  penaltyMissed: number
  yellowCards: number
  redCards: number
  ownGoals: number
  bonusPoints: number
}

export function calculateFantasyPoints(stats: FantasyStatsInput): number {
  let pts = 0
  const { position, minutesPlayed } = stats

  // Minuten gespeeld
  if (minutesPlayed >= 60) pts += 2
  else if (minutesPlayed > 0) pts += 1

  // Doelpunten
  const goalPts: Record<PlayerPosition, number> = { GK: 6, DEF: 6, MID: 5, FWD: 4 }
  pts += stats.goals * goalPts[position]

  // Assists
  pts += stats.assists * 3

  // Clean sheet (alleen bij 60+ minuten)
  if (minutesPlayed >= 60 && stats.cleanSheet) {
    if (position === "GK" || position === "DEF") pts += 4
    else if (position === "MID") pts += 1
  }

  // Tegendoelpunten (elke 2 tegendoelpunten = -1 punt, alleen GK/DEF)
  if (position === "GK" || position === "DEF") {
    pts -= Math.floor(stats.goalsConceded / 2)
  }

  // Saves (elke 3 saves = 1 punt, alleen GK)
  if (position === "GK") {
    pts += Math.floor(stats.shotsSaved / 3)
  }

  // Penalty save
  pts += stats.penaltySaved * 5

  // Penalty miss
  pts -= stats.penaltyMissed * 2

  // Kaarten
  pts -= stats.yellowCards * 1
  pts -= stats.redCards * 3

  // Eigen doelpunten
  pts -= stats.ownGoals * 2

  // Bonuspunten (door admin toegekend)
  pts += stats.bonusPoints

  return Math.max(0, pts) // Nooit negatief totaal
}

// ─── Validatie helper ─────────────────────────────────────────────────────────

export interface SquadValidationResult {
  valid: boolean
  errors: string[]
}

export function validateSquad(
  players: { position: PlayerPosition; teamCode: string }[],
  isKO: boolean = false
): SquadValidationResult {
  const errors: string[] = []

  // Totaal aantal
  if (players.length !== SQUAD_SIZE) {
    errors.push(`Selectie moet precies ${SQUAD_SIZE} spelers bevatten (nu: ${players.length})`)
  }

  // Per positie
  const byCounts = players.reduce((acc, p) => {
    acc[p.position] = (acc[p.position] ?? 0) + 1
    return acc
  }, {} as Record<PlayerPosition, number>)

  for (const [pos, required] of Object.entries(POSITION_LIMITS) as [PlayerPosition, number][]) {
    const count = byCounts[pos] ?? 0
    if (count !== required) {
      errors.push(`${pos}: ${count} geselecteerd, ${required} vereist`)
    }
  }

  // Per land
  const maxPerCountry = isKO ? MAX_PER_COUNTRY_KO : MAX_PER_COUNTRY_GROUP
  const byCountry = players.reduce((acc, p) => {
    acc[p.teamCode] = (acc[p.teamCode] ?? 0) + 1
    return acc
  }, {} as Record<string, number>)

  for (const [code, count] of Object.entries(byCountry)) {
    if (count > maxPerCountry) {
      errors.push(`Te veel spelers van ${code}: ${count} (max ${maxPerCountry})`)
    }
  }

  return { valid: errors.length === 0, errors }
}
