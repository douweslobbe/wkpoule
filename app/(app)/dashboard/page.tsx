import { redirect } from "next/navigation"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const TOTAL_MATCHES = 104

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  // Laad alle pools inclusief ranglijst-info
  const memberships = await prisma.poolMembership.findMany({
    where: { userId: session.user.id },
    include: {
      pool: {
        include: {
          _count: { select: { memberships: true } },
          leaderboard: {
            orderBy: { totalPoints: "desc" },
          },
          bonusQuestions: {
            select: { id: true, correctAnswer: true },
          },
        },
      },
    },
    orderBy: { joinedAt: "asc" },
  })

  const completedMatches = await prisma.match.count({ where: { status: "FINISHED" } })

  // Bereken positie per pool
  const poolStandings = memberships.map(({ pool, role }) => {
    const lb = pool.leaderboard
    const myEntry = lb.find((e) => e.userId === session.user.id)
    const rank = myEntry ? lb.findIndex((e) => e.userId === session.user.id) + 1 : null
    const total = pool._count.memberships

    const bonusTotal = pool.bonusQuestions.length
    const bonusScored = pool.bonusQuestions.filter((q) => q.correctAnswer).length

    const projectedMatchPts =
      completedMatches > 0 && myEntry
        ? Math.round((myEntry.matchPoints / completedMatches) * TOTAL_MATCHES)
        : null

    const projectedTotal =
      projectedMatchPts !== null && myEntry
        ? projectedMatchPts + myEntry.bonusPoints + myEntry.championPoints
        : null

    const maxBonus = myEntry ? myEntry.bonusPoints + (bonusTotal - bonusScored) * 7 : bonusTotal * 7
    const maxPossible = (projectedMatchPts ?? 0) + maxBonus + (myEntry?.championPoints === 0 ? 15 : myEntry?.championPoints ?? 0)

    return { pool, role, myEntry, rank, total, projectedTotal, maxPossible, bonusTotal, bonusScored }
  })

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-pixel text-white mb-1" style={{ fontSize: "10px" }}>
          WELKOM, <span style={{ color: "#FFD700" }}>{session.user.name?.toUpperCase()}!</span>
        </h1>
        <p className="font-pixel mt-1" style={{ fontSize: "7px", color: completedMatches > 0 ? "#4af56a" : "#555577" }}>
          {completedMatches > 0
            ? `${completedMatches}/${TOTAL_MATCHES} WEDSTRIJDEN GESPEELD`
            : "WK 2026 START 11 JUNI · ZET ALVAST JE VOORSPELLINGEN KLAAR!"}
        </p>
      </div>

      {memberships.length === 0 ? (
        <div className="pixel-card p-10 text-center">
          <div className="text-5xl mb-4">⚽</div>
          <h2 className="font-pixel mb-3" style={{ fontSize: "9px", color: "#FFD700" }}>GEEN POULES</h2>
          <p className="text-sm mb-6" style={{ color: "#666688" }}>
            Maak een nieuwe poule aan of doe mee via een uitnodigingscode.
          </p>
          <div className="flex gap-3 justify-center">
            <Link href="/pools/new" className="pixel-btn px-5 py-2.5 text-sm font-bold"
              style={{ background: "#FF6200", color: "white" }}>
              Poule aanmaken
            </Link>
            <Link href="/pools/join" className="pixel-btn px-5 py-2.5 text-sm font-bold"
              style={{ background: "#1a1d30", color: "#e0e0f0", border: "2px solid #333360" }}>
              Meedoen met code
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Mijn standings per poule */}
          <div className="pixel-card overflow-hidden mb-6">
            <div className="px-5 py-3" style={{ background: "#0a3d1f", borderBottom: "3px solid #000" }}>
              <h2 className="font-pixel text-white" style={{ fontSize: "9px" }}>📊 MIJN TUSSENSTANDEN</h2>
              {completedMatches > 0 && (
                <p className="mt-1" style={{ fontSize: "10px", color: "#4af56a" }}>Prognose = huidig tempo × 104 wedstrijden</p>
              )}
            </div>

            {/* Header */}
            <div className="hidden sm:grid px-5 py-2 font-bold uppercase"
              style={{
                gridTemplateColumns: "1fr 4rem 7rem 7rem 5rem 5.5rem",
                fontSize: "8px",
                color: "#555577",
                borderBottom: "2px solid #1a1d30",
                fontFamily: "var(--font-pixel), monospace",
              }}>
              <span>Poule</span>
              <span className="text-center">Positie</span>
              <span className="text-center">⚽ Wedstr.</span>
              <span className="text-center">🏆 Plaatje</span>
              <span className="text-center">TOTAAL</span>
              <span className="text-center" style={{ color: "#4499ff" }}>📈 Prognose</span>
            </div>

            <div>
              {poolStandings.map(({ pool, role, myEntry, rank, total, projectedTotal, maxPossible }) => (
                <Link
                  key={pool.id}
                  href={`/pools/${pool.id}`}
                  className="block transition-colors"
                  style={{ borderBottom: "2px solid #1a1d30" }}
                >
                  {/* Desktop */}
                  <div className="hidden sm:grid px-5 py-3 items-center gap-2"
                    style={{ gridTemplateColumns: "1fr 4rem 7rem 7rem 5rem 5.5rem" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#1a1d30")}
                    onMouseLeave={e => (e.currentTarget.style.background = "")}>
                    <div>
                      <span className="font-bold text-sm" style={{ color: "#e0e0f0" }}>{pool.name}</span>
                      {role === "ADMIN" && (
                        <span className="ml-2 px-1.5 py-0.5 font-pixel"
                          style={{ background: "#FFD700", color: "#000", fontSize: "6px" }}>
                          ADMIN
                        </span>
                      )}
                    </div>
                    <div className="text-center">
                      {rank ? (
                        <span className="font-pixel" style={{
                          color: rank === 1 ? "#FFD700" : rank <= 3 ? "#FF6200" : "#9999cc",
                          fontSize: "11px",
                        }}>
                          {rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : `#${rank}`}
                          <span style={{ fontSize: "9px", color: "#444466" }}>/{total}</span>
                        </span>
                      ) : (
                        <span style={{ color: "#333355", fontSize: "11px" }}>—</span>
                      )}
                    </div>
                    <span className="text-center text-sm" style={{ color: "#9999cc" }}>{myEntry?.matchPoints ?? 0}</span>
                    <span className="text-center text-sm" style={{ color: "#9999cc" }}>{(myEntry?.bonusPoints ?? 0) + (myEntry?.championPoints ?? 0)}</span>
                    <span className="text-center font-pixel" style={{ color: "#FFD700", fontSize: "11px" }}>
                      {myEntry?.totalPoints ?? 0}
                    </span>
                    <span className="text-center text-sm font-semibold" style={{ color: "#4499ff" }}>
                      {projectedTotal !== null ? (
                        <span title={`Max mogelijk: ${maxPossible}`}>
                          ~{projectedTotal}
                          {completedMatches < TOTAL_MATCHES && (
                            <span className="text-xs ml-0.5" style={{ color: "#333366" }}>/{maxPossible}</span>
                          )}
                        </span>
                      ) : (
                        <span style={{ color: "#333355", fontSize: "11px" }}>—</span>
                      )}
                    </span>
                  </div>

                  {/* Mobile */}
                  <div className="sm:hidden px-4 py-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm truncate" style={{ color: "#e0e0f0" }}>{pool.name}</div>
                      <div className="text-xs mt-0.5" style={{ color: "#444466" }}>
                        ⚽{myEntry?.matchPoints ?? 0} + 🏆{(myEntry?.bonusPoints ?? 0) + (myEntry?.championPoints ?? 0)}
                      </div>
                    </div>
                    <div className="text-right">
                      {rank && (
                        <div style={{ fontSize: "10px", color: "#555577" }}>#{rank}/{total}</div>
                      )}
                      <div className="font-pixel" style={{ color: "#FFD700", fontSize: "11px" }}>
                        {myEntry?.totalPoints ?? 0}pt
                      </div>
                      {projectedTotal !== null && (
                        <div className="text-xs" style={{ color: "#4499ff" }}>~{projectedTotal}</div>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            <div className="px-5 py-3 flex flex-wrap gap-4"
              style={{ borderTop: "2px solid #1a1d30", background: "#0d0f1a", fontSize: "10px", color: "#444466" }}>
              <span>⚽ wedstrijdpunten · 🏆 bonus + kampioen</span>
              {completedMatches === 0 && <span>Prognose beschikbaar zodra wedstrijden gespeeld zijn</span>}
            </div>
          </div>

          {/* Snelle acties */}
          <div className="grid gap-3 sm:grid-cols-3 mb-6">
            <Link href="/predictions" className="pixel-card p-4 flex items-center gap-3 transition-colors"
              style={{ borderLeft: "4px solid #FF6200" }}>
              <span className="text-2xl">⚽</span>
              <div>
                <div className="font-pixel" style={{ fontSize: "8px", color: "#FF6200" }}>DE WEDSTRIJDEN</div>
                <div className="text-xs mt-0.5" style={{ color: "#666688" }}>Voorspellingen invullen</div>
                <div className="text-xs font-semibold mt-0.5" style={{ color: "#4af56a" }}>Geldt voor alle poules</div>
              </div>
            </Link>

            {memberships.slice(0, 1).map(({ pool }) => (
              <Link key={pool.id} href={`/pools/${pool.id}/bonus`} className="pixel-card p-4 flex items-center gap-3 transition-colors"
                style={{ borderLeft: "4px solid #FFD700" }}>
                <span className="text-2xl">🏆</span>
                <div>
                  <div className="font-pixel" style={{ fontSize: "8px", color: "#FFD700" }}>HET GROTE PLAATJE</div>
                  <div className="text-xs mt-0.5" style={{ color: "#666688" }}>Bonus & kampioen kiezen</div>
                </div>
              </Link>
            ))}

            <Link href="/pools/new" className="pixel-card p-4 flex items-center gap-3 transition-colors"
              style={{ borderStyle: "dashed", borderLeft: "4px dashed #2d2d50" }}>
              <span className="text-2xl" style={{ color: "#4af56a" }}>+</span>
              <div>
                <div className="font-pixel" style={{ fontSize: "8px", color: "#4af56a" }}>NIEUWE POULE</div>
                <div className="text-xs mt-0.5" style={{ color: "#444466" }}>Aanmaken of meedoen</div>
              </div>
            </Link>
          </div>

          {/* Code meedoen link */}
          <div className="text-center">
            <Link href="/pools/join" className="font-bold text-sm hover:underline" style={{ color: "#FFD700" }}>
              Meedoen met een bestaande poule via uitnodigingscode →
            </Link>
          </div>
        </>
      )}
    </div>
  )
}
