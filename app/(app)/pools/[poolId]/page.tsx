import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { PoolSubNav } from "./PoolSubNav"

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
          <div className="mt-2 flex items-center gap-2">
            <span className="text-xs text-green-300">CODE:</span>
            <span className="font-mono font-bold tracking-widest px-2 py-0.5 text-sm" style={{ background: "#FFD700", color: "#1a1a2e", border: "2px solid #1a1a2e" }}>
              {pool.inviteCode}
            </span>
          </div>
        </div>
        {isAdmin && (
          <Link
            href={`/admin/pools/${poolId}/bonus`}
            className="pixel-btn px-3 py-1.5 text-xs font-bold"
            style={{ background: "#fefef2", color: "#1a1a2e" }}
          >
            ⚙ BEHEER
          </Link>
        )}
      </div>

      {/* Leaderboard */}
      <div className="pixel-card overflow-hidden">
        <div className="px-5 py-3" style={{ background: "#0a3d1f", borderBottom: "3px solid #1a1a2e" }}>
          <h2 className="font-pixel text-white" style={{ fontSize: "9px" }}>📊 DE MEGALOMANE RANGLIJST</h2>
          {completedMatches > 0 && (
            <p className="text-green-300 text-xs mt-1">
              {completedMatches}/{totalMatches} wedstrijden gespeeld · prognose op basis van huidige score/wedstrijd
            </p>
          )}
        </div>

        {ranked.length === 0 ? (
          <p className="text-center text-gray-500 py-10 text-sm">Nog geen scores</p>
        ) : (
          <div>
            {/* Header row */}
            <div className="hidden sm:grid px-5 py-2 text-xs font-bold text-gray-400 uppercase tracking-wide border-b-2 border-gray-200"
              style={{ gridTemplateColumns: "2rem 1fr 7rem 7rem 5rem 5.5rem" }}>
              <span>#</span>
              <span>Speler</span>
              <span className="text-center">⚽ De Wedstrijden</span>
              <span className="text-center">🏆 Het Grote Plaatje</span>
              <span className="text-center font-pixel" style={{ fontSize: "7px" }}>TOTAAL</span>
              <span className="text-center text-blue-400">📈 Prognose</span>
            </div>

            <div className="divide-y-2 divide-gray-200">
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
                    className={`px-5 py-3 ${isMe ? "bg-yellow-50" : "bg-background"}`}
                  >
                    {/* Desktop: grid layout */}
                    <div className="hidden sm:grid items-center gap-2"
                      style={{ gridTemplateColumns: "2rem 1fr 7rem 7rem 5rem 5.5rem" }}>
                      <span className="text-lg">{medal}</span>
                      <span className={`font-bold text-sm truncate ${isMe ? "" : "text-gray-800"}`}
                        style={{ color: isMe ? "#FF6200" : undefined }}>
                        {memberMap.get(entry.userId) ?? "?"}
                        {isMe && <span className="ml-1 text-xs font-normal opacity-60">◄ jij</span>}
                      </span>
                      <span className="text-center text-sm text-gray-700">{entry.matchPoints}</span>
                      <span className="text-center text-sm text-gray-700">{entry.bonusPoints + entry.championPoints}</span>
                      <span className="text-center font-pixel"
                        style={{ color: isMe ? "#FF6200" : "#1a1a2e", fontSize: "11px" }}>
                        {entry.totalPoints}
                      </span>
                      <span className="text-center text-sm font-semibold text-blue-600">
                        {projectedTotal !== null ? (
                          <span title={`Max mogelijk: ${maxPossible}`}>
                            ~{projectedTotal}
                            {completedMatches < totalMatches && (
                              <span className="text-xs text-gray-400 ml-0.5">/{maxPossible}</span>
                            )}
                          </span>
                        ) : (
                          <span className="text-gray-300 text-xs">—</span>
                        )}
                      </span>
                    </div>

                    {/* Mobile: compact layout */}
                    <div className="sm:hidden flex items-center gap-3">
                      <span className="text-lg w-7">{medal}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm truncate" style={{ color: isMe ? "#FF6200" : "#1a1a2e" }}>
                          {memberMap.get(entry.userId) ?? "?"}
                          {isMe && <span className="ml-1 text-xs font-normal opacity-60">◄</span>}
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          ⚽{entry.matchPoints} + ❓{entry.bonusPoints} + 🏆{entry.championPoints}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-pixel" style={{ color: isMe ? "#FF6200" : "#1a1a2e", fontSize: "11px" }}>
                          {entry.totalPoints}
                        </div>
                        {projectedTotal !== null && (
                          <div className="text-xs text-blue-500">~{projectedTotal}</div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Legend */}
            <div className="px-5 py-3 border-t-2 border-gray-200 bg-gray-50 text-xs text-gray-500 flex gap-4 flex-wrap">
              <span>⚽ wedstrijdpunten</span>
              <span>🏆 bonuspunten + kampioenspunten</span>
              {completedMatches > 0 && <span className="text-blue-500">📈 prognose = huidig tempo × 104 wedstrijden</span>}
              {completedMatches === 0 && <span>Prognose beschikbaar zodra wedstrijden gespeeld zijn (start 11 juni)</span>}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
