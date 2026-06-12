import { prisma } from "./prisma"
import { getRoundDeadline, matchToSurvivorRound, type SurvivorRound } from "./survivor"
import { TRANSFER_ROUNDS, type FantasyRound } from "./fantasy"

const ROUND_INDEX: Record<string, number> = {
  GROUP_1: 0, GROUP_2: 1, GROUP_3: 2,
  ROUND_OF_32: 3, ROUND_OF_16: 4, QUARTER_FINAL: 5, SEMI_FINAL: 6, FINAL: 7,
}

/**
 * De eerstvolgende ronde met een open transfervenster (2 transfers), of null
 * wanneer er geen venster open is (vóór het toernooi, of vanaf de halve finale).
 * Het venster voor een ronde sluit bij de eerste wedstrijd van die ronde.
 */
export async function getCurrentTransferRound(): Promise<{ round: FantasyRound; deadline: Date } | null> {
  const now = new Date()
  for (const round of TRANSFER_ROUNDS) {
    const deadline = await getRoundDeadline(round as SurvivorRound)
    if (deadline && now < deadline) return { round, deadline }
  }
  return null
}

/**
 * Punten per speler voor een selectie: alleen de wedstrijden in de rondes
 * waarin de speler in de selectie zat (vanaf addedInRound), consistent met de
 * eerlijke per-ronde-teamtelling. Geeft { playerId: punten }.
 */
export async function getSquadPlayerPoints(
  picks: { playerId: string; addedInRound: string }[],
): Promise<Record<string, number>> {
  const playerIds = picks.map((p) => p.playerId)
  if (playerIds.length === 0) return {}

  const finished = await prisma.match.findMany({
    where: { status: "FINISHED" },
    select: { id: true, stage: true, matchday: true },
  })
  const matchRoundIdx = new Map<string, number>()
  for (const m of finished) {
    const r = m.stage === "THIRD_PLACE" ? "FINAL" : matchToSurvivorRound({ stage: m.stage, matchday: m.matchday })
    if (r) matchRoundIdx.set(m.id, ROUND_INDEX[r] ?? 99)
  }

  const stats = await prisma.fantasyPlayerStats.findMany({
    where: { playerId: { in: playerIds }, matchId: { in: [...matchRoundIdx.keys()] } },
    select: { playerId: true, matchId: true, totalPoints: true },
  })

  const addedIdx = new Map(picks.map((p) => [p.playerId, ROUND_INDEX[p.addedInRound] ?? 0]))
  const result: Record<string, number> = {}
  for (const p of picks) result[p.playerId] = 0
  for (const s of stats) {
    const mi = matchRoundIdx.get(s.matchId)
    const ai = addedIdx.get(s.playerId)
    if (mi === undefined || ai === undefined) continue
    if (mi >= ai) result[s.playerId] += s.totalPoints
  }
  return result
}
