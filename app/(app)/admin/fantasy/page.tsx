import { redirect } from "next/navigation"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "WK Manager statistieken — Admin" }

export default async function AdminFantasyPage() {
  const session = await auth()
  if (!session?.user?.isAdmin) redirect("/dashboard")

  const matches = await prisma.match.findMany({
    where: { status: "FINISHED" },
    include: {
      homeTeam: { select: { code: true, nameNl: true, name: true } },
      awayTeam: { select: { code: true, nameNl: true, name: true } },
      _count: { select: { playerStats: true } },
    },
    orderBy: { kickoff: "desc" },
  })

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <Link href="/admin" className="font-pixel" style={{ fontSize: "7px", color: "#7070a0" }}>◄ ADMIN</Link>
        <h1 className="font-pixel text-white" style={{ fontSize: "10px" }}>🎮 WK MANAGER — STATISTIEKEN</h1>
      </div>

      <p className="font-pixel mb-4" style={{ fontSize: "7px", color: "var(--c-text-3)", lineHeight: "1.9" }}>
        Voer per afgeronde wedstrijd de spelersstatistieken in. Punten en teamtotalen worden automatisch berekend.
      </p>

      <div className="pixel-card overflow-hidden">
        {matches.length === 0 ? (
          <p className="font-pixel p-5 text-center" style={{ fontSize: "8px", color: "var(--c-text-4)" }}>
            Nog geen afgeronde wedstrijden.
          </p>
        ) : (
          matches.map((m) => {
            const home = m.homeTeam?.nameNl ?? m.homeTeam?.name ?? "?"
            const away = m.awayTeam?.nameNl ?? m.awayTeam?.name ?? "?"
            const done = m._count.playerStats > 0
            return (
              <Link
                key={m.id}
                href={`/admin/fantasy/${m.id}`}
                className="px-5 py-3 flex items-center gap-3 transition-all hover:opacity-80"
                style={{ borderBottom: "1px solid var(--c-border)" }}
              >
                <span className="flex-1 text-right" style={{ fontSize: "8px", color: "var(--c-text)" }}>{home}</span>
                <span className="font-pixel shrink-0" style={{ fontSize: "9px", color: "#FFD700" }}>{m.homeScore}–{m.awayScore}</span>
                <span className="flex-1" style={{ fontSize: "8px", color: "var(--c-text)" }}>{away}</span>
                <span
                  className="font-pixel shrink-0 px-2 py-0.5"
                  style={{
                    fontSize: "6px",
                    background: done ? "#0a3d1f" : "#3a2500",
                    color: done ? "#4af56a" : "#ffaa44",
                    border: `1px solid ${done ? "#0a5a2a" : "#664400"}`,
                  }}
                >
                  {done ? `✓ ${m._count.playerStats}` : "INVOEREN"}
                </span>
              </Link>
            )
          })
        )}
      </div>
    </div>
  )
}
