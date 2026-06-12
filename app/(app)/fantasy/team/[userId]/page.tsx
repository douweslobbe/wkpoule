import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { FANTASY_DEADLINE, FANTASY_ROUND_LABELS, POSITION_LIMITS, type FantasyRound } from "@/lib/fantasy"
import { getCurrentTransferRound, getSquadPlayerPoints } from "@/lib/fantasy-server"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Team bekijken — WK Manager 2026" }

type PlayerPosition = "GK" | "DEF" | "MID" | "FWD"
const POS_ORDER: PlayerPosition[] = ["GK", "DEF", "MID", "FWD"]
const POS_LABELS: Record<PlayerPosition, string> = { GK: "Keepers", DEF: "Verdedigers", MID: "Middenvelders", FWD: "Aanvallers" }
const POS_COLORS: Record<PlayerPosition, string> = { GK: "#FFD700", DEF: "#4499ff", MID: "#4af56a", FWD: "#ff6644" }

const PLAYER_TEAM_SELECT = { select: { code: true, nameNl: true, name: true, flagUrl: true } } as const

export default async function FantasyTeamPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params
  const session = await auth()
  if (!session?.user) redirect("/login")

  const isOwn = userId === session.user.id

  const team = await prisma.fantasyTeam.findUnique({
    where: { userId },
    include: {
      user: { select: { name: true } },
      picks: { include: { player: { include: { team: PLAYER_TEAM_SELECT } } } },
    },
  })
  if (!team) notFound()

  const header = (
    <div className="flex items-center gap-3 mb-5 flex-wrap">
      <Link href="/fantasy" className="font-pixel" style={{ fontSize: "7px", color: "#7070a0" }}>◄ WK MANAGER</Link>
      <h1 className="font-pixel text-white" style={{ fontSize: "10px" }}>🏟 {team.nickname.toUpperCase()}</h1>
    </div>
  )

  // Vóór het toernooi zijn andermans teams verborgen
  if (!isOwn && new Date() < FANTASY_DEADLINE) {
    return (
      <div className="max-w-2xl mx-auto">
        {header}
        <div className="pixel-card p-6 text-center">
          <p className="font-pixel" style={{ fontSize: "8px", color: "#FFD700", lineHeight: "2" }}>🔒 NOG VERBORGEN</p>
          <p className="font-pixel mt-2" style={{ fontSize: "7px", color: "var(--c-text-3)", lineHeight: "1.9" }}>
            Teams van anderen worden zichtbaar zodra het toernooi begint.
          </p>
        </div>
      </div>
    )
  }

  // Tijdens een open transfervenster tonen we andermans team zoals het was bij
  // aanvang van die ronde — transfers van deze ronde blijven verborgen tot de
  // eerste wedstrijd gespeeld is.
  let displayPlayers = team.picks.map((p) => p.player)
  let snapshotNote: string | null = null

  if (!isOwn) {
    const transferRound = await getCurrentTransferRound()
    if (transferRound) {
      const transfersThisRound = await prisma.fantasyTransfer.findMany({
        where: { fantasyTeamId: team.id, round: transferRound.round },
      })
      if (transfersThisRound.length > 0) {
        const inIds = new Set(transfersThisRound.map((t) => t.playerInId))
        const outIds = transfersThisRound.map((t) => t.playerOutId)
        const kept = team.picks.map((p) => p.player).filter((pl) => !inIds.has(pl.id))
        const outPlayers = await prisma.player.findMany({
          where: { id: { in: outIds } },
          include: { team: PLAYER_TEAM_SELECT },
        })
        displayPlayers = [...kept, ...outPlayers]
      }
      snapshotNote = `Getoond zoals bij aanvang van ${FANTASY_ROUND_LABELS[transferRound.round]} — transfers van deze ronde zijn pas zichtbaar na de eerste wedstrijd.`
    }
  }

  // Punten per speler (huidige picks gebruiken hun addedInRound; teruggedraaide
  // transfer-spelers vallen terug op vanaf het begin)
  const pickRoundById = new Map(team.picks.map((p) => [p.playerId, p.addedInRound]))
  const playerPoints = await getSquadPlayerPoints(
    displayPlayers.map((pl) => ({ playerId: pl.id, addedInRound: pickRoundById.get(pl.id) ?? "GROUP_1" })),
  )

  const byPos = POS_ORDER.reduce((acc, pos) => {
    acc[pos] = displayPlayers.filter((p) => p.position === pos)
    return acc
  }, {} as Record<PlayerPosition, typeof displayPlayers>)

  return (
    <div className="max-w-2xl mx-auto">
      {header}

      <div className="pixel-card overflow-hidden mb-4">
        <div className="px-5 py-3" style={{ background: "#0a3d1f", borderBottom: "3px solid #000" }}>
          <div className="font-pixel text-white" style={{ fontSize: "9px" }}>{team.nickname.toUpperCase()}</div>
          <div className="font-pixel mt-0.5" style={{ fontSize: "7px", color: "#FFD700" }}>
            {team.user.name} · {team.totalPoints} punten
          </div>
        </div>

        {snapshotNote && !isOwn && (
          <div className="px-5 py-2" style={{ background: "#1a1200", borderBottom: "2px solid var(--c-border)" }}>
            <p className="font-pixel" style={{ fontSize: "6px", color: "#FFD700", lineHeight: "1.8" }}>👁 {snapshotNote}</p>
          </div>
        )}

        {POS_ORDER.map((pos) => (
          <div key={pos}>
            <div className="px-5 py-2 flex items-center justify-between" style={{ background: "var(--c-surface-deep)", borderBottom: "1px solid var(--c-border)" }}>
              <span className="font-pixel" style={{ fontSize: "7px", color: POS_COLORS[pos] }}>{POS_LABELS[pos].toUpperCase()}</span>
              <span className="font-pixel" style={{ fontSize: "6px", color: "var(--c-text-4)" }}>{byPos[pos].length}/{POSITION_LIMITS[pos]}</span>
            </div>
            {byPos[pos].map((pl) => (
              <div key={pl.id} className="px-5 py-2.5 flex items-center gap-3" style={{ borderBottom: "1px solid var(--c-border)" }}>
                {pl.team.flagUrl ? (
                  <Image src={pl.team.flagUrl} alt={pl.team.code} width={20} height={14} className="shrink-0" style={{ border: "1px solid var(--c-border)", objectFit: "cover" }} />
                ) : (
                  <span className="font-pixel shrink-0" style={{ fontSize: "7px", color: "var(--c-text-4)", minWidth: "20px" }}>{pl.team.code}</span>
                )}
                <span className="flex-1" style={{ fontSize: "8px", color: "var(--c-text)" }}>{pl.nameNl ?? pl.name}</span>
                {pl.shirtNumber && (
                  <span className="font-pixel shrink-0" style={{ fontSize: "6px", color: "var(--c-text-4)" }}>#{pl.shirtNumber}</span>
                )}
                <span className="font-pixel shrink-0" style={{ fontSize: "8px", minWidth: "26px", textAlign: "right", color: (playerPoints[pl.id] ?? 0) > 0 ? "#FFD700" : "var(--c-text-5)" }}>{playerPoints[pl.id] ?? 0} pt</span>
                <span className="font-pixel shrink-0 px-1.5 py-0.5" style={{ fontSize: "6px", color: POS_COLORS[pos], border: `1px solid ${POS_COLORS[pos]}44` }}>{pos}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
