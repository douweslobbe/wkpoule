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

// ─── Punten per speelronde (WK Manager) ───────────────────────────────────────

const BREAKDOWN_ROUND_ORDER: FantasyRound[] = [
  "GROUP_1", "GROUP_2", "GROUP_3",
  "ROUND_OF_32", "ROUND_OF_16", "QUARTER_FINAL", "SEMI_FINAL", "FINAL",
]

export type FantasyRoundBreakdown = {
  round: FantasyRound
  points: number
  players: { playerId: string; name: string; teamCode: string; points: number }[]
}[]

/**
 * Punten per speelronde voor één fantasy-team, mét de spelers die scoorden.
 * Gebruikt dezelfde eerlijke per-ronde-selectie als de totaaltelling
 * (recalcFantasyTeams): transfers van latere rondes worden teruggedraaid, zodat
 * de rondetotalen exact optellen tot het teamtotaal.
 */
export async function getFantasyRoundBreakdown(fantasyTeamId: string): Promise<FantasyRoundBreakdown> {
  const team = await prisma.fantasyTeam.findUnique({
    where: { id: fantasyTeamId },
    include: {
      picks: { select: { playerId: true } },
      transfers: { select: { round: true, playerOutId: true, playerInId: true } },
    },
  })
  if (!team) return []

  const finished = await prisma.match.findMany({
    where: { status: "FINISHED" },
    select: { id: true, stage: true, matchday: true },
  })
  const matchesByRound = new Map<string, string[]>()
  for (const m of finished) {
    const r = m.stage === "THIRD_PLACE" ? "FINAL" : matchToSurvivorRound({ stage: m.stage, matchday: m.matchday })
    if (!r) continue
    if (!matchesByRound.has(r)) matchesByRound.set(r, [])
    matchesByRound.get(r)!.push(m.id)
  }
  const allMatchIds = [...matchesByRound.values()].flat()
  if (allMatchIds.length === 0) return []

  const stats = await prisma.fantasyPlayerStats.findMany({
    where: { matchId: { in: allMatchIds } },
    select: { playerId: true, matchId: true, totalPoints: true },
  })
  const pointsByMatch = new Map<string, Map<string, number>>()
  for (const s of stats) {
    let mm = pointsByMatch.get(s.matchId)
    if (!mm) { mm = new Map(); pointsByMatch.set(s.matchId, mm) }
    mm.set(s.playerId, (mm.get(s.playerId) ?? 0) + s.totalPoints)
  }

  const currentSquad = new Set(team.picks.map((p) => p.playerId))
  const relevantPlayerIds = new Set<string>(currentSquad)
  for (const t of team.transfers) { relevantPlayerIds.add(t.playerOutId); relevantPlayerIds.add(t.playerInId) }
  const players = await prisma.player.findMany({
    where: { id: { in: [...relevantPlayerIds] } },
    select: { id: true, name: true, nameNl: true, team: { select: { code: true } } },
  })
  const playerInfo = new Map(players.map((p) => [p.id, { name: p.nameNl ?? p.name, teamCode: p.team.code }]))

  const result: FantasyRoundBreakdown = []
  for (const round of BREAKDOWN_ROUND_ORDER) {
    const matchIds = matchesByRound.get(round)
    if (!matchIds || matchIds.length === 0) continue

    const ri = ROUND_INDEX[round] ?? 99
    const squad = new Set(currentSquad)
    for (const t of team.transfers) {
      if ((ROUND_INDEX[t.round] ?? 99) > ri) {
        squad.delete(t.playerInId)
        squad.add(t.playerOutId)
      }
    }

    const perPlayer = new Map<string, number>()
    for (const matchId of matchIds) {
      const mp = pointsByMatch.get(matchId)
      if (!mp) continue
      for (const playerId of squad) {
        const pts = mp.get(playerId)
        if (pts === undefined) continue
        perPlayer.set(playerId, (perPlayer.get(playerId) ?? 0) + pts)
      }
    }

    const playerList = [...perPlayer.entries()]
      .filter(([, points]) => points > 0)
      .map(([playerId, points]) => ({
        playerId,
        points,
        name: playerInfo.get(playerId)?.name ?? "?",
        teamCode: playerInfo.get(playerId)?.teamCode ?? "",
      }))
      .sort((a, b) => b.points - a.points)

    const points = [...perPlayer.values()].reduce((s, p) => s + p, 0)
    result.push({ round, points, players: playerList })
  }
  return result
}
