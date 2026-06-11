import { redirect } from "next/navigation"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { FANTASY_DEADLINE, MAX_TRANSFERS_PER_ROUND, FANTASY_ROUND_LABELS, type FantasyRound } from "@/lib/fantasy"
import { getCurrentTransferRound } from "@/lib/fantasy-server"
import { TransferPicker } from "./TransferPicker"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Transfers — WK Manager 2026" }

const PLAYER_INCLUDE = {
  team: { select: { id: true, code: true, nameNl: true, name: true, flagUrl: true } },
} as const

export default async function FantasyTransfersPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  // Vóór het toernooi pas je je team onbeperkt aan via de select-pagina
  if (new Date() < FANTASY_DEADLINE) redirect("/fantasy/select")

  const team = await prisma.fantasyTeam.findUnique({
    where: { userId: session.user.id },
    include: { picks: { include: { player: { include: PLAYER_INCLUDE } } } },
  })
  if (!team) redirect("/fantasy")

  const transferRound = await getCurrentTransferRound()

  function fmtDeadline(d: Date) {
    return d.toLocaleString("nl-NL", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
  }

  const usedTransfers = transferRound
    ? await prisma.fantasyTransfer.count({ where: { fantasyTeamId: team.id, round: transferRound.round } })
    : 0
  const remaining = Math.max(0, MAX_TRANSFERS_PER_ROUND - usedTransfers)

  const allPlayers = transferRound
    ? await prisma.player.findMany({
        where: { isActive: true },
        include: PLAYER_INCLUDE,
        orderBy: [{ team: { code: "asc" } }, { position: "asc" }, { shirtNumber: "asc" }],
      })
    : []

  const squad = team.picks.map((pick) => ({
    id: pick.player.id,
    name: pick.player.name,
    nameNl: pick.player.nameNl,
    position: pick.player.position,
    shirtNumber: pick.player.shirtNumber,
    team: {
      code: pick.player.team.code,
      nameNl: pick.player.team.nameNl,
      name: pick.player.team.name,
      flagUrl: pick.player.team.flagUrl,
    },
  }))

  const players = allPlayers.map((p) => ({
    id: p.id,
    name: p.name,
    nameNl: p.nameNl,
    position: p.position,
    shirtNumber: p.shirtNumber,
    team: { code: p.team.code, nameNl: p.team.nameNl, name: p.team.name, flagUrl: p.team.flagUrl },
  }))

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <Link href="/fantasy" className="font-pixel" style={{ fontSize: "7px", color: "#7070a0" }}>
          ◄ WK MANAGER
        </Link>
        <h1 className="font-pixel text-white" style={{ fontSize: "10px" }}>⇄ TRANSFERS</h1>
      </div>

      {!transferRound ? (
        <div className="pixel-card p-6 text-center">
          <p className="font-pixel" style={{ fontSize: "8px", color: "#FFD700", lineHeight: "2" }}>
            🔒 GEEN TRANSFERVENSTER OPEN
          </p>
          <p className="font-pixel mt-2" style={{ fontSize: "7px", color: "var(--c-text-3)", lineHeight: "1.9" }}>
            Vanaf de halve finale liggen de teams vast. Er zijn geen transfers meer mogelijk.
          </p>
          <Link href="/fantasy" className="font-pixel inline-block mt-4 px-4 py-2" style={{ fontSize: "7px", background: "#1a5a2a", color: "white", border: "2px solid #000" }}>
            ◄ TERUG NAAR JE TEAM
          </Link>
        </div>
      ) : (
        <>
          <div className="pixel-card p-4 mb-4" style={{ background: "#0d1a10", borderLeft: "4px solid #FFD700" }}>
            <div className="font-pixel" style={{ fontSize: "8px", color: "#FFD700" }}>
              TRANSFERVENSTER: {FANTASY_ROUND_LABELS[transferRound.round as FantasyRound].toUpperCase()}
            </div>
            <div className="font-pixel mt-1" style={{ fontSize: "7px", color: "var(--c-text-3)", lineHeight: "1.9" }}>
              Max {MAX_TRANSFERS_PER_ROUND} transfers · deadline {fmtDeadline(transferRound.deadline)}
              {usedTransfers > 0 && ` · ${usedTransfers} al gebruikt`}
            </div>
          </div>

          {remaining === 0 ? (
            <div className="pixel-card p-6 text-center">
              <p className="font-pixel" style={{ fontSize: "8px", color: "#4af56a", lineHeight: "2" }}>
                ✓ JE TRANSFERS VOOR DEZE RONDE ZIJN GEBRUIKT
              </p>
              <Link href="/fantasy" className="font-pixel inline-block mt-3 px-4 py-2" style={{ fontSize: "7px", background: "#1a5a2a", color: "white", border: "2px solid #000" }}>
                ◄ TERUG NAAR JE TEAM
              </Link>
            </div>
          ) : (
            <TransferPicker round={transferRound.round} remaining={remaining} squad={squad} allPlayers={players} />
          )}
        </>
      )}
    </div>
  )
}
