import { redirect } from "next/navigation"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { FANTASY_DEADLINE, FANTASY_ROUND_LABELS, POSITION_LIMITS, type FantasyRound } from "@/lib/fantasy"
import { FantasyTeamView } from "./FantasyTeamView"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Fantasy WK — WK Pool 2026",
}

const POSITION_ORDER = ["GK", "DEF", "MID", "FWD"] as const

export default async function FantasyPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const canRegister = new Date() < FANTASY_DEADLINE
  const daysLeft = Math.ceil((FANTASY_DEADLINE.getTime() - Date.now()) / (1000 * 60 * 60 * 24))

  const fantasyTeam = await prisma.fantasyTeam.findUnique({
    where: { userId: session.user.id },
    include: {
      picks: {
        include: {
          player: {
            include: {
              team: { select: { id: true, code: true, nameNl: true, name: true, flagUrl: true } },
            },
          },
        },
      },
      transfers: { orderBy: { createdAt: "desc" }, take: 20 },
    },
  })

  // Leaderboard (top 10)
  const allTeams = await prisma.fantasyTeam.findMany({
    orderBy: { totalPoints: "desc" },
    take: 10,
    select: {
      id: true,
      nickname: true,
      totalPoints: true,
      userId: true,
    },
  })

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <h1 className="font-pixel text-white" style={{ fontSize: "10px" }}>
          ⚽ FANTASY WK 2026
        </h1>
        {canRegister && (
          <span className="font-pixel px-2 py-0.5" style={{
            fontSize: "6px",
            background: daysLeft <= 7 ? "#FFD700" : "#0a3d1f",
            color: daysLeft <= 7 ? "#000" : "#4af56a",
            border: `1px solid ${daysLeft <= 7 ? "#aa9900" : "#0a5a2a"}`,
          }}>
            {daysLeft <= 7
              ? `⚠ ${daysLeft} dag${daysLeft === 1 ? "" : "en"} tot deadline`
              : `Open tot 11 jun · nog ${daysLeft} dagen`}
          </span>
        )}
      </div>

      {/* Geen team aangemeld */}
      {!fantasyTeam && (
        <div className="pixel-card overflow-hidden mb-6">
          <div className="px-5 py-3" style={{ background: "#0a3d1f", borderBottom: "3px solid #000" }}>
            <h2 className="font-pixel text-white" style={{ fontSize: "9px" }}>🏟 STEL JE TEAM SAMEN</h2>
            <p className="mt-1 font-pixel" style={{ fontSize: "7px", color: "#4a7a4a" }}>
              Kies 15 spelers (2 GK · 5 DEF · 5 MID · 3 FWD) — max 2 per land
            </p>
          </div>
          <div className="p-5">
            {canRegister ? (
              <>
                <p className="font-pixel mb-4" style={{ fontSize: "7px", color: "var(--c-text-3)", lineHeight: "1.8" }}>
                  Stel je selectie samen vóór <strong>11 juni 2026 22:00</strong>.
                  Per speelronde kun je daarna 2 transfers doorvoeren t/m de kwartfinales.
                </p>
                <Link
                  href="/fantasy/select"
                  className="font-pixel px-4 py-2 inline-block transition-all hover:opacity-80"
                  style={{
                    background: "#0a5a2a",
                    color: "white",
                    border: "2px solid #000",
                    boxShadow: "2px 2px 0 #000",
                    fontSize: "8px",
                  }}
                >
                  ▶ TEAM AANMAKEN
                </Link>
              </>
            ) : (
              <p className="font-pixel" style={{ fontSize: "7px", color: "#ff4444" }}>
                🔒 De deadline is verstreken — je kunt geen team meer aanmaken.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Team aangemeld */}
      {fantasyTeam && (
        <FantasyTeamView
          team={fantasyTeam}
          canTransfer={canRegister}
        />
      )}

      {/* Ranglijst */}
      <div className="pixel-card overflow-hidden mt-6">
        <div className="px-5 py-3" style={{ background: "#0a1f3d", borderBottom: "3px solid #000" }}>
          <h2 className="font-pixel text-white" style={{ fontSize: "9px" }}>📊 RANGLIJST</h2>
          <p className="mt-1 font-pixel" style={{ fontSize: "7px", color: "#4499ff" }}>
            Top 10 Fantasy WK teams
          </p>
        </div>

        {allTeams.length === 0 ? (
          <div className="p-5 text-center">
            <p className="font-pixel" style={{ fontSize: "7px", color: "var(--c-text-4)" }}>
              Nog geen teams aangemeld. Wees de eerste!
            </p>
          </div>
        ) : (
          <div>
            {allTeams.map((t, i) => (
              <div
                key={t.id}
                className="px-5 py-3 flex items-center gap-3"
                style={{
                  borderBottom: "1px solid var(--c-border)",
                  background: t.userId === session.user.id ? "rgba(74, 245, 106, 0.05)" : undefined,
                }}
              >
                <span
                  className="font-pixel shrink-0"
                  style={{
                    fontSize: "8px",
                    color: i === 0 ? "#FFD700" : i === 1 ? "#C0C0C0" : i === 2 ? "#CD7F32" : "var(--c-text-4)",
                    minWidth: "20px",
                  }}
                >
                  {i + 1}
                </span>
                <span className="font-pixel flex-1" style={{ fontSize: "8px", color: t.userId === session.user.id ? "#4af56a" : "var(--c-text)" }}>
                  {t.nickname}
                  {t.userId === session.user.id && (
                    <span className="ml-2" style={{ color: "#4af56a", fontSize: "6px" }}>◄ JIJ</span>
                  )}
                </span>
                <span className="font-pixel" style={{ fontSize: "9px", color: "#FFD700" }}>
                  {t.totalPoints} pt
                </span>
              </div>
            ))}
          </div>
        )}

        {allTeams.length >= 10 && (
          <div className="px-5 py-3 text-center">
            <Link href="/fantasy/ranglijst" className="font-pixel" style={{ fontSize: "7px", color: "#4499ff" }}>
              Alle teams bekijken →
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
