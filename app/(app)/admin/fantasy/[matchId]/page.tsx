import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { FantasyStatsForm } from "../FantasyStatsForm"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Statistieken invoeren — Admin" }

export default async function AdminFantasyMatchPage({ params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = await params
  const session = await auth()
  if (!session?.user?.isAdmin) redirect("/dashboard")

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      homeTeam: { select: { id: true, code: true, nameNl: true, name: true } },
      awayTeam: { select: { id: true, code: true, nameNl: true, name: true } },
    },
  })
  if (!match) notFound()

  const teamIds = [match.homeTeamId, match.awayTeamId].filter(Boolean) as string[]

  // Spelers die ooit in een team zaten (huidige picks + transferhistorie),
  // gefilterd op de twee teams van deze wedstrijd.
  const candidateIds = new Set<string>()
  ;(await prisma.fantasyPick.findMany({ select: { playerId: true } })).forEach((p) => candidateIds.add(p.playerId))
  ;(await prisma.fantasyTransfer.findMany({ select: { playerOutId: true, playerInId: true } })).forEach((t) => {
    candidateIds.add(t.playerOutId)
    candidateIds.add(t.playerInId)
  })

  const playerRows = candidateIds.size > 0 && teamIds.length > 0
    ? await prisma.player.findMany({
        where: { id: { in: [...candidateIds] }, teamId: { in: teamIds } },
        include: { team: { select: { code: true } } },
        orderBy: [{ position: "asc" }, { shirtNumber: "asc" }],
      })
    : []

  const players = playerRows.map((p) => ({
    id: p.id,
    name: p.nameNl ?? p.name,
    position: p.position,
    teamCode: p.team.code,
  }))

  const existingStats = await prisma.fantasyPlayerStats.findMany({
    where: { matchId, playerId: { in: players.map((p) => p.id) } },
  })
  const initial: Record<string, {
    minutesPlayed: number; goals: number; assists: number; shotsSaved: number
    penaltySaved: number; penaltyMissed: number; yellowCards: number; redCards: number
    ownGoals: number; bonusPoints: number
  }> = {}
  for (const s of existingStats) {
    initial[s.playerId] = {
      minutesPlayed: s.minutesPlayed, goals: s.goals, assists: s.assists, shotsSaved: s.shotsSaved,
      penaltySaved: s.penaltySaved, penaltyMissed: s.penaltyMissed, yellowCards: s.yellowCards,
      redCards: s.redCards, ownGoals: s.ownGoals, bonusPoints: s.bonusPoints,
    }
  }

  const home = match.homeTeam?.nameNl ?? match.homeTeam?.name ?? "?"
  const away = match.awayTeam?.nameNl ?? match.awayTeam?.name ?? "?"

  return (
    <div>
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <Link href="/admin/fantasy" className="font-pixel" style={{ fontSize: "7px", color: "#7070a0" }}>◄ STATISTIEKEN</Link>
        <h1 className="font-pixel text-white" style={{ fontSize: "10px" }}>🎮 STATISTIEKEN INVOEREN</h1>
      </div>

      <div className="pixel-card p-4 mb-4 text-center" style={{ background: "#0d1a10" }}>
        <div className="font-pixel" style={{ fontSize: "9px", color: "var(--c-text)" }}>
          {home} <span style={{ color: "#FFD700" }}>{match.homeScore} – {match.awayScore}</span> {away}
        </div>
      </div>

      <div className="pixel-card overflow-hidden">
        <div className="px-5 py-3" style={{ background: "#0a3d1f", borderBottom: "3px solid #000" }}>
          <h2 className="font-pixel text-white" style={{ fontSize: "9px" }}>SPELERS ({players.length})</h2>
        </div>
        <div className="p-4">
          <FantasyStatsForm matchId={match.id} players={players} initial={initial} />
        </div>
      </div>
    </div>
  )
}
