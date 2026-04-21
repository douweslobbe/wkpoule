import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { PoolSubNav } from "./PoolSubNav"
import { CopyButton } from "./CopyButton"

export default async function PoolPage({ params }: { params: Promise<{ poolId: string }> }) {
  const { poolId } = await params
  const session = await auth()
  if (!session?.user) redirect("/login")

  const membership = await prisma.poolMembership.findUnique({
    where: { userId_poolId: { userId: session.user.id, poolId } },
    include: { pool: true },
  })
  if (!membership) notFound()

  const pool = membership.pool
  const isAdmin = membership.role === "ADMIN"

  const leaderboard = await prisma.leaderboardEntry.findMany({
    where: { poolId },
    orderBy: { totalPoints: "desc" },
  })

  const members = await prisma.poolMembership.findMany({
    where: { poolId },
    include: { user: { select: { id: true, name: true } } },
  })

  const memberMap = new Map(members.map((m) => [m.userId, m.user.name]))

  // Build ranked list (include members without points yet)
  const allMemberIds = members.map((m) => m.userId)
  const inLeaderboard = new Set(leaderboard.map((e) => e.userId))
  const missing = allMemberIds.filter((id) => !inLeaderboard.has(id))

  const ranked = [
    ...leaderboard,
    ...missing.map((userId) => ({
      id: userId,
      userId,
      poolId,
      totalPoints: 0,
      matchPoints: 0,
      bonusPoints: 0,
      championPoints: 0,
      lastCalculatedAt: new Date(),
    })),
  ]

  const completedMatches = await prisma.match.count({ where: { status: "FINISHED" } })
  const totalMatches = 104

  const bonusQuestionsTotal = await prisma.bonusQuestion.count({ where: { poolId } })
  const bonusQuestionsScored = await prisma.bonusQuestion.count({ where: { poolId, correctAnswer: { not: null } } })

  const championPicks = await prisma.championPick.findMany({
    where: { poolId },
    select: { userId: true },
  })
  const hasChampionPickSet = new Set(championPicks.map(p => p.userId))

  return (
    <div>
      <PoolSubNav poolId={poolId} />

      <div className="flex items-start justify-between mb-5 flex-wrap gap-3">
        <div>
          <h1 className="font-pixel text-white" style={{ fontSize: "10px" }}>{pool.name.toUpperCase()}</h1>
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            <span className="font-pixel" style={{ fontSize: "7px", color: "#4af56a" }}>CODE:</span>
            <span className="font-pixel font-bold tracking-widest px-2 py-0.5 text-sm" style={{ background: "#FFD700", color: "#000", border: "2px solid #000", boxShadow: "2px 2px 0 #000" }}>
              {pool.inviteCode}
            </span>
            <CopyButton text={pool.inviteCode} />
          </div>
        </div>
        {isAdmin && (
          <Link
            href={`/admin/pools/${poolId}/bonus`}
            className="pixel-btn px-3 py-1.5 text-xs font-bold"
            style={{ background: "#FFD700", color: "#000", fontFamily: "var(--font-pixel)", fontSize: "7px" }}
          >
            ⚙ BEHEER
          </Link>
        )}
      </div>

      {/* Leaderboard */}
      <div className="pixel-card overflow-hidden">
        <div className="px-5 py-3" style={{ background: "#0a3d1f", borderBottom: "3px solid #000" }}>
          <h2 className="font-pixel text-white" style={{ fontSize: "9px" }}>📊 DE MEGALOMANE RANGLIJST</h2>
          {completedMatches > 0 && (
            <p className="mt-1" style={{ color: "#4af56a", fontSize: "11px" }}>
              {completedMatches}/{totalMatches} wedstrijden gespeeld · prognose op basis van huidige score/wedstrijd
            </p>
          )}
        </div>

        {ranked.length === 0 ? (
          <p className="text-center py-10 text-sm" style={{ color: "#444466" }}>Nog geen scores</p>
        ) : (
          <div>
            {/* Header row */}
            <div className="hidden sm:grid px-5 py-2 font-bold uppercase tracking-wide"
              style={{
                gridTemplateColumns: "2rem 1fr 7rem 7rem 5rem 5.5rem",
                fontSize: "9px",
                color: "#555577",
                borderBottom: "2px solid #1a1d30",
                fontFamily: "var(--font-pixel), monospace",
              }}>
              <span>#</span>
              <span>Speler</span>
              <span className="text-center">⚽ Wedstr.</span>
              <span className="text-center">🏆 Plaatje</span>
              <span className="text-center">TOTAAL</span>
              <span className="text-center" style={{ color: "#4499ff" }}>📈 Prognose</span>
            </div>

            <div style={{ borderTop: "none" }}>
              {ranked.map((entry, i) => {
                const isMe = entry.userId === session.user.id
                const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`
                const hasPick = hasChampionPickSet.has(entry.userId)

                const projectedMatchPts = completedMatches > 0
                  ? Math.round((entry.matchPoints / completedMatches) * totalMatches)
                  : null

                const projectedTotal = projectedMatchPts !== null
                  ? projectedMatchPts + entry.bonusPoints + entry.championPoints
                  : null

                const maxBonus = entry.bonusPoints + (bonusQuestionsTotal - bonusQuestionsScored) * 7
                const maxChampion = entry.championPoints > 0 ? entry.championPoints : (hasPick ? 15 : 0)
                const maxPossible = (projectedMatchPts ?? 0) + maxBonus + maxChampion

                return (
                  <div
                    key={entry.userId}
                    style={{
                      background: isMe ? "#1e1200" : "#161928",
                      borderBottom: "2px solid #1a1d30",
                      borderLeft: isMe ? "3px solid #FF6200" : "3px solid transparent",
                    }}
                  >
                    {/* Desktop: grid layout */}
                    <div className="hidden sm:grid items-center gap-2 px-5 py-3"
                      style={{ gridTemplateColumns: "2rem 1fr 7rem 7rem 5rem 5.5rem" }}>
                      <span className="text-lg">{medal}</span>
                      <span className="font-bold text-sm truncate" style={{ color: isMe ? "#FF6200" : "#e0e0f0" }}>
                        {memberMap.get(entry.userId) ?? "?"}
                        {isMe && <span className="ml-1 text-xs font-normal" style={{ color: "#FF6200", opacity: 0.7 }}>◄ jij</span>}
                      </span>
                      <span className="text-center text-sm" style={{ color: "#9999cc" }}>{entry.matchPoints}</span>
                      <span className="text-center text-sm" style={{ color: "#9999cc" }}>{entry.bonusPoints + entry.championPoints}</span>
                      <span className="text-center font-pixel"
                        style={{ color: isMe ? "#FF6200" : "#FFD700", fontSize: "11px" }}>
                        {entry.totalPoints}
                      </span>
                      <span className="text-center text-sm font-semibold" style={{ color: "#4499ff" }}>
                        {projectedTotal !== null ? (
                          <span title={`Max mogelijk: ${maxPossible}`}>
                            ~{projectedTotal}
                            {completedMatches < totalMatches && (
                              <span className="text-xs ml-0.5" style={{ color: "#333366" }}>/{maxPossible}</span>
                            )}
                          </span>
                        ) : (
                          <span style={{ color: "#333355", fontSize: "11px" }}>—</span>
                        )}
                      </span>
                    </div>

                    {/* Mobile: compact layout */}
                    <div className="sm:hidden flex items-center gap-3 px-4 py-3">
                      <span className="text-lg w-7">{medal}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm truncate" style={{ color: isMe ? "#FF6200" : "#e0e0f0" }}>
                          {memberMap.get(entry.userId) ?? "?"}
                          {isMe && <span className="ml-1 text-xs font-normal" style={{ opacity: 0.6, color: "#FF6200" }}>◄</span>}
                        </div>
                        <div className="text-xs mt-0.5" style={{ color: "#555577" }}>
                          ⚽{entry.matchPoints} + 🏆{entry.bonusPoints + entry.championPoints}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-pixel" style={{ color: isMe ? "#FF6200" : "#FFD700", fontSize: "11px" }}>
                          {entry.totalPoints}
                        </div>
                        {projectedTotal !== null && (
                          <div className="text-xs" style={{ color: "#4499ff" }}>~{projectedTotal}</div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Legend */}
            <div className="px-5 py-3 flex gap-4 flex-wrap"
              style={{ borderTop: "2px solid #1a1d30", background: "#0d0f1a", fontSize: "10px", color: "#444466" }}>
              <span>⚽ wedstrijdpunten</span>
              <span>🏆 bonus + kampioen</span>
              {completedMatches > 0 && <span style={{ color: "#4499ff" }}>📈 prognose = huidig tempo × 104 wedstrijden</span>}
              {completedMatches === 0 && <span>Prognose beschikbaar zodra wedstrijden gespeeld zijn (start 11 juni)</span>}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
