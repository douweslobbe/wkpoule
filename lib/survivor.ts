import { prisma } from "./prisma"

export const SURVIVOR_ROUNDS = [
  "GROUP_1",
  "GROUP_2",
  "GROUP_3",
  "ROUND_OF_32",
  "ROUND_OF_16",
  "QUARTER_FINAL",
  "SEMI_FINAL",
  "FINAL",
] as const

export type SurvivorRound = (typeof SURVIVOR_ROUNDS)[number]

export const ROUND_LABELS: Record<SurvivorRound, string> = {
  GROUP_1: "Speeldag 1",
  GROUP_2: "Speeldag 2",
  GROUP_3: "Speeldag 3",
  ROUND_OF_32: "Ronde van 32",
  ROUND_OF_16: "Achtste finale",
  QUARTER_FINAL: "Kwartfinale",
  SEMI_FINAL: "Halve finale",
  FINAL: "Finale",
}

export function matchToSurvivorRound(match: {
  stage: string
  matchday?: number | null
}): SurvivorRound | null {
  if (match.stage === "GROUP") {
    if (match.matchday === 1) return "GROUP_1"
    if (match.matchday === 2) return "GROUP_2"
    if (match.matchday === 3) return "GROUP_3"
    return null
  }
  const map: Partial<Record<string, SurvivorRound>> = {
    ROUND_OF_32: "ROUND_OF_32",
    ROUND_OF_16: "ROUND_OF_16",
    QUARTER_FINAL: "QUARTER_FINAL",
    SEMI_FINAL: "SEMI_FINAL",
    FINAL: "FINAL",
  }
  return map[match.stage] ?? null
}

// ─── DB helpers ───────────────────────────────────────────────────────────────

async function matchesForRound(round: SurvivorRound) {
  if (round === "GROUP_1") return prisma.match.findMany({ where: { stage: "GROUP", matchday: 1 } })
  if (round === "GROUP_2") return prisma.match.findMany({ where: { stage: "GROUP", matchday: 2 } })
  if (round === "GROUP_3") return prisma.match.findMany({ where: { stage: "GROUP", matchday: 3 } })
  return prisma.match.findMany({ where: { stage: round as never } })
}

export async function getFirstMatchOfRound(round: SurvivorRound) {
  if (round === "GROUP_1")
    return prisma.match.findFirst({ where: { stage: "GROUP", matchday: 1 }, orderBy: { kickoff: "asc" }, select: { id: true, kickoff: true } })
  if (round === "GROUP_2")
    return prisma.match.findFirst({ where: { stage: "GROUP", matchday: 2 }, orderBy: { kickoff: "asc" }, select: { id: true, kickoff: true } })
  if (round === "GROUP_3")
    return prisma.match.findFirst({ where: { stage: "GROUP", matchday: 3 }, orderBy: { kickoff: "asc" }, select: { id: true, kickoff: true } })
  return prisma.match.findFirst({ where: { stage: round as never }, orderBy: { kickoff: "asc" }, select: { id: true, kickoff: true } })
}

export async function getRoundDeadline(round: SurvivorRound): Promise<Date | null> {
  const first = await getFirstMatchOfRound(round)
  if (!first) return null
  return new Date(first.kickoff.getTime() - 30 * 60 * 1000)
}

async function countUnfinishedInRound(round: SurvivorRound): Promise<number> {
  if (round === "GROUP_1") return prisma.match.count({ where: { stage: "GROUP", matchday: 1, status: { not: "FINISHED" } } })
  if (round === "GROUP_2") return prisma.match.count({ where: { stage: "GROUP", matchday: 2, status: { not: "FINISHED" } } })
  if (round === "GROUP_3") return prisma.match.count({ where: { stage: "GROUP", matchday: 3, status: { not: "FINISHED" } } })
  return prisma.match.count({ where: { stage: round as never, status: { not: "FINISHED" } } })
}

/**
 * The "active" round is the first round that either:
 *  - has a deadline in the future (picks still open), OR
 *  - has unfinished matches (results pending)
 * Returns null when the entire tournament is done.
 */
export async function getActiveSurvivorRound(): Promise<SurvivorRound | null> {
  const now = new Date()
  for (const round of SURVIVOR_ROUNDS) {
    const deadline = await getRoundDeadline(round)
    if (!deadline) continue // round has no matches yet (no sync)
    if (deadline > now) return round // picks still open
    const unfinished = await countUnfinishedInRound(round)
    if (unfinished > 0) return round // matches in progress / awaiting results
  }
  return null
}

/** Returns the set of teamIds that play in the given round */
export async function getTeamIdsInRound(round: SurvivorRound): Promise<Set<string>> {
  const matches = await matchesForRound(round)
  const ids = new Set<string>()
  for (const m of matches) {
    if (m.homeTeamId) ids.add(m.homeTeamId)
    if (m.awayTeamId) ids.add(m.awayTeamId)
  }
  return ids
}
