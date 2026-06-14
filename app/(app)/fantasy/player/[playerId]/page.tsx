import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Speler — WK Manager 2026" }

const POS_COLORS: Record<string, string> = { GK: "#FFD700", DEF: "#4499ff", MID: "#4af56a", FWD: "#ff6644" }

// Bouwt de losse onderdelen waarvoor punten zijn toegekend in een wedstrijd.
function statChips(s: {
  minutesPlayed: number; goals: number; assists: number; cleanSheet: boolean
  goalsConceded: number; shotsSaved: number; penaltySaved: number; penaltyMissed: number
  yellowCards: number; redCards: number; ownGoals: number; bonusPoints: number
  position: string
}): string[] {
  const c: string[] = []
  if (s.minutesPlayed > 0) c.push(`${s.minutesPlayed}'`)
  if (s.goals > 0) c.push(`⚽${s.goals > 1 ? `×${s.goals}` : ""}`)
  if (s.assists > 0) c.push(`🅰${s.assists > 1 ? `×${s.assists}` : ""}`)
  if (s.cleanSheet && s.minutesPlayed >= 60 && (s.position === "GK" || s.position === "DEF" || s.position === "MID")) c.push("🛡 clean sheet")
  if (s.shotsSaved >= 3 && s.position === "GK") c.push(`🧤×${s.shotsSaved}`)
  if (s.penaltySaved > 0) c.push("🥅 pen. gestopt")
  if (s.penaltyMissed > 0) c.push("❌ pen. gemist")
  if ((s.position === "GK" || s.position === "DEF") && s.goalsConceded >= 2) c.push(`tegen: ${s.goalsConceded}`)
  if (s.yellowCards > 0) c.push("🟨")
  if (s.redCards > 0) c.push("🟥")
  if (s.ownGoals > 0) c.push(`OG${s.ownGoals > 1 ? `×${s.ownGoals}` : ""}`)
  if (s.bonusPoints !== 0) c.push(`★${s.bonusPoints > 0 ? "+" : ""}${s.bonusPoints}`)
  return c
}

export default async function FantasyPlayerPage({ params }: { params: Promise<{ playerId: string }> }) {
  const { playerId } = await params
  const session = await auth()
  if (!session?.user) redirect("/login")

  const player = await prisma.player.findUnique({
    where: { id: playerId },
    include: { team: { select: { code: true, nameNl: true, name: true, flagUrl: true } } },
  })
  if (!player) notFound()

  const stats = await prisma.fantasyPlayerStats.findMany({
    where: { playerId },
    include: {
      match: {
        select: {
          kickoff: true, homeScore: true, awayScore: true,
          homeTeam: { select: { code: true } },
          awayTeam: { select: { code: true } },
        },
      },
    },
    orderBy: { match: { kickoff: "asc" } },
  })

  const total = stats.reduce((sum, s) => sum + s.totalPoints, 0)

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <Link href="/fantasy" className="font-pixel" style={{ fontSize: "7px", color: "#7070a0" }}>◄ WK MANAGER</Link>
      </div>

      <div className="pixel-card p-4 mb-4 flex items-center gap-3" style={{ borderLeft: `4px solid ${POS_COLORS[player.position] ?? "#fff"}` }}>
        {player.team.flagUrl && (
          <Image src={player.team.flagUrl} alt={player.team.code} width={28} height={20} style={{ border: "1px solid var(--c-border)", objectFit: "cover" }} />
        )}
        <div className="flex-1 min-w-0">
          <div className="font-pixel" style={{ fontSize: "10px", color: "var(--c-text)" }}>{player.nameNl ?? player.name}</div>
          <div className="font-pixel mt-1" style={{ fontSize: "7px", color: "var(--c-text-4)" }}>
            <span style={{ color: POS_COLORS[player.position] ?? "#fff" }}>{player.position}</span> · {player.team.nameNl ?? player.team.name}
            {player.shirtNumber ? ` · #${player.shirtNumber}` : ""}
          </div>
        </div>
        <div className="text-right">
          <div className="font-pixel" style={{ fontSize: "16px", color: "#FFD700" }}>{total}</div>
          <div className="font-pixel" style={{ fontSize: "6px", color: "var(--c-text-4)" }}>PUNTEN</div>
        </div>
      </div>

      <div className="pixel-card overflow-hidden">
        <div className="px-5 py-3" style={{ background: "#0a3d1f", borderBottom: "3px solid #000" }}>
          <h2 className="font-pixel text-white" style={{ fontSize: "9px" }}>PER WEDSTRIJD</h2>
        </div>
        {stats.length === 0 ? (
          <p className="font-pixel p-5 text-center" style={{ fontSize: "8px", color: "var(--c-text-4)" }}>
            Nog geen punten — deze speler heeft nog niet gespeeld of de statistieken zijn nog niet ingevoerd.
          </p>
        ) : (
          stats.map((s) => {
            const m = s.match
            const chips = statChips({ ...s, position: player.position })
            return (
              <div key={s.id} className="px-5 py-3" style={{ borderBottom: "1px solid var(--c-border)" }}>
                <div className="flex items-center gap-2">
                  <span className="font-pixel flex-1" style={{ fontSize: "8px", color: "var(--c-text-2)" }}>
                    {m.homeTeam?.code ?? "?"} <span style={{ color: "var(--c-text-4)" }}>{m.homeScore}–{m.awayScore}</span> {m.awayTeam?.code ?? "?"}
                  </span>
                  <span className="font-pixel" style={{ fontSize: "10px", color: s.totalPoints > 0 ? "#FFD700" : s.totalPoints < 0 ? "#ff4444" : "var(--c-text-5)" }}>
                    {s.totalPoints > 0 ? "+" : ""}{s.totalPoints} pt
                  </span>
                </div>
                {chips.length > 0 && (
                  <div className="font-pixel mt-1 flex gap-2 flex-wrap" style={{ fontSize: "7px", color: "var(--c-text-4)" }}>
                    {chips.map((c, i) => <span key={i}>{c}</span>)}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
