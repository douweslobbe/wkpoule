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
    const hasChampion = lb.some((e) => e.userId === session.user.id && e.championPoints === 0)
    const maxPossible = (projectedMatchPts ?? 0) + maxBonus + (myEntry?.championPoints === 0 ? 15 : myEntry?.championPoints ?? 0)

    return { pool, role, myEntry, rank, total, projectedTotal, maxPossible, bonusTotal, bonusScored }
  })

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-pixel text-white mb-1" style={{ fontSize: "10px" }}>
          WELKOM, {session.user.name.toUpperCase()}!
        </h1>
        <p className="text-green-300 text-xs">
          {completedMatches > 0
            ? `${completedMatches}/${TOTAL_MATCHES} wedstrijden gespeeld`
            : "WK 2026 start 11 juni · Zet alvast je voorspellingen klaar!"}
        </p>
      </div>

      {memberships.length === 0 ? (
        <div className="pixel-card p-10 text-center">
          <div className="text-5xl mb-4">⚽</div>
          <h2 className="font-pixel mb-3" style={{ fontSize: "9px", color: "#1a1a2e" }}>GEEN POULES</h2>
          <p className="text-gray-500 text-sm mb-6">
            Maak een nieuwe poule aan of doe mee via een uitnodigingscode.
          </p>
          <div className="flex gap-3 justify-center">
            <Link href="/pools/new" className="pixel-btn px-5 py-2.5 text-sm font-bold"
              style={{ background: "#FF6200", color: "white" }}>
              Poule aanmaken
            </Link>
            <Link href="/pools/join" className="pixel-btn px-5 py-2.5 text-sm font-bold"
              style={{ background: "#fefef2", color: "#1a1a2e" }}>
              Meedoen met code
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Mijn standings per poule */}
          <div className="pixel-card overflow-hidden mb-6">
            <div className="px-5 py-3" style={{ background: "#0a3d1f", borderBottom: "3px solid #1a1a2e" }}>
              <h2 className="font-pixel text-white" style={{ fontSize: "9px" }}>📊 MIJN TUSSENSTANDEN</h2>
              {completedMatches > 0 && (
                <p className="text-green-300 text-xs mt-1">Prognose = huidig tempo × 104 wedstrijden</p>
              )}
            </div>

            {/* Header */}
            <div className="hidden sm:grid px-5 py-2 text-xs font-bold text-gray-400 uppercase border-b-2 border-gray-200"
              style={{ gridTemplateColumns: "1fr 4rem 4.5rem 4.5rem 4.5rem 5rem 5rem" }}>
              <span>Poule</span>
              <span className="text-center">Positie</span>
              <span className="text-center">⚽</span>
              <span className="text-center">❓</span>
              <span className="text-center">🏆</span>
              <span className="text-center font-pixel" style={{ fontSize: "7px" }}>TOTAAL</span>
              <span className="text-center text-blue-400">📈 Prognose</span>
            </div>

            <div className="divide-y-2 divide-gray-200">
              {poolStandings.map(({ pool, role, myEntry, rank, total, projectedTotal, maxPossible }) => (
                <Link
                  key={pool.id}
                  href={`/pools/${pool.id}`}
                  className="block hover:bg-yellow-50 transition-colors"
                >
                  {/* Desktop */}
                  <div className="hidden sm:grid px-5 py-3 items-center gap-2"
                    style={{ gridTemplateColumns: "1fr 4rem 4.5rem 4.5rem 4.5rem 5rem 5rem" }}>
                    <div>
                      <span className="font-bold text-sm text-gray-900">{pool.name}</span>
                      {role === "ADMIN" && (
                        <span className="ml-2 text-xs px-1.5 py-0.5 font-pixel"
                          style={{ background: "#FFD700", color: "#1a1a2e", fontSize: "6px" }}>
                          ADMIN
                        </span>
                      )}
                    </div>
                    <div className="text-center">
                      {rank ? (
                        <span className="font-pixel text-sm" style={{ color: rank === 1 ? "#FFD700" : rank <= 3 ? "#FF6200" : "#1a1a2e", fontSize: "11px" }}>
                          {rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : `#${rank}`}
                          <span className="text-xs font-normal text-gray-400">/{total}</span>
                        </span>
                      ) : (
                        <span className="text-gray-300 text-xs">—</span>
                      )}
                    </div>
                    <span className="text-center text-sm text-gray-700">{myEntry?.matchPoints ?? 0}</span>
                    <span className="text-center text-sm text-gray-700">{myEntry?.bonusPoints ?? 0}</span>
                    <span className="text-center text-sm text-gray-700">{myEntry?.championPoints ?? 0}</span>
                    <span className="text-center font-pixel" style={{ color: "#FF6200", fontSize: "11px" }}>
                      {myEntry?.totalPoints ?? 0}
                    </span>
                    <span className="text-center text-sm font-semibold text-blue-600">
                      {projectedTotal !== null ? (
                        <span title={`Max mogelijk: ${maxPossible}`}>
                          ~{projectedTotal}
                          {completedMatches < TOTAL_MATCHES && (
                            <span className="text-xs text-gray-400 ml-0.5">/{maxPossible}</span>
                          )}
                        </span>
                      ) : (
                        <span className="text-gray-300 text-xs">—</span>
                      )}
                    </span>
                  </div>

                  {/* Mobile */}
                  <div className="sm:hidden px-4 py-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm text-gray-900 truncate">{pool.name}</div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        ⚽{myEntry?.matchPoints ?? 0} + ❓{myEntry?.bonusPoints ?? 0} + 🏆{myEntry?.championPoints ?? 0}
                      </div>
                    </div>
                    <div className="text-right">
                      {rank && (
                        <div className="text-xs text-gray-500">#{rank}/{total}</div>
                      )}
                      <div className="font-pixel" style={{ color: "#FF6200", fontSize: "11px" }}>
                        {myEntry?.totalPoints ?? 0}pt
                      </div>
                      {projectedTotal !== null && (
                        <div className="text-xs text-blue-500">~{projectedTotal}</div>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            <div className="px-5 py-3 border-t-2 border-gray-200 bg-gray-50 text-xs text-gray-500 flex flex-wrap gap-4">
              <span>⚽ wedstrijdpunten · ❓ bonuspunten · 🏆 kampioenspunten</span>
              {completedMatches === 0 && <span>Prognose beschikbaar zodra wedstrijden gespeeld zijn</span>}
            </div>
          </div>

          {/* Snelle acties */}
          <div className="grid gap-3 sm:grid-cols-3 mb-6">
            <Link href="/predictions" className="pixel-card p-4 flex items-center gap-3 hover:bg-yellow-50 transition-colors">
              <span className="text-2xl">⚽</span>
              <div>
                <div className="font-pixel" style={{ fontSize: "8px", color: "#1a1a2e" }}>DE WEDSTRIJDEN</div>
                <div className="text-xs text-gray-500 mt-0.5">Voorspellingen invullen</div>
                <div className="text-xs text-green-600 font-semibold mt-0.5">Geldt voor alle poules</div>
              </div>
            </Link>

            {memberships.slice(0, 1).map(({ pool }) => (
              <Link key={pool.id} href={`/pools/${pool.id}/bonus`} className="pixel-card p-4 flex items-center gap-3 hover:bg-yellow-50 transition-colors">
                <span className="text-2xl">🏆</span>
                <div>
                  <div className="font-pixel" style={{ fontSize: "8px", color: "#1a1a2e" }}>HET GROTE PLAATJE</div>
                  <div className="text-xs text-gray-500 mt-0.5">Bonus & kampioen kiezen</div>
                </div>
              </Link>
            ))}

            <Link href="/pools/new" className="pixel-card p-4 flex items-center gap-3 hover:bg-yellow-50 transition-colors"
              style={{ borderStyle: "dashed" }}>
              <span className="text-2xl">+</span>
              <div>
                <div className="font-pixel" style={{ fontSize: "8px", color: "#1a1a2e" }}>NIEUWE POULE</div>
                <div className="text-xs text-gray-500 mt-0.5">Aanmaken of meedoen</div>
              </div>
            </Link>
          </div>

          {/* Code meedoen link */}
          <div className="text-center">
            <Link href="/pools/join" className="text-sm font-bold hover:underline" style={{ color: "#FFD700" }}>
              Meedoen met een bestaande poule via uitnodigingscode →
            </Link>
          </div>
        </>
      )}
    </div>
  )
}
