import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

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

  return (
    <div>
      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{pool.name}</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Uitnodigingscode:{" "}
            <span className="font-mono font-semibold tracking-widest bg-orange-100 text-orange-800 px-2 py-0.5 rounded">
              {pool.inviteCode}
            </span>
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link
            href={`/pools/${poolId}/predictions`}
            className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
          >
            Voorspellingen
          </Link>
          <Link
            href={`/pools/${poolId}/bonus`}
            className="bg-white hover:bg-gray-50 text-gray-700 font-semibold px-4 py-2 rounded-lg text-sm border border-gray-300 transition-colors"
          >
            Bonusvragen
          </Link>
          <Link
            href={`/pools/${poolId}/champion`}
            className="bg-white hover:bg-gray-50 text-gray-700 font-semibold px-4 py-2 rounded-lg text-sm border border-gray-300 transition-colors"
          >
            Kampioen 🏆
          </Link>
          {isAdmin && (
            <Link
              href={`/admin/pools/${poolId}/bonus`}
              className="bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
            >
              Beheer
            </Link>
          )}
        </div>
      </div>

      {/* Leaderboard */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Ranglijst</h2>
        </div>

        {ranked.length === 0 ? (
          <p className="text-center text-gray-500 py-10">Nog geen scores</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {ranked.map((entry, i) => {
              const isMe = entry.userId === session.user.id
              const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`
              return (
                <div
                  key={entry.userId}
                  className={`flex items-center px-5 py-3.5 gap-4 ${isMe ? "bg-orange-50" : ""}`}
                >
                  <span className="w-8 text-center text-lg">{medal}</span>
                  <span className={`flex-1 font-medium ${isMe ? "text-orange-700" : "text-gray-800"}`}>
                    {memberMap.get(entry.userId) ?? "Onbekend"}
                    {isMe && <span className="ml-1.5 text-xs text-orange-500">(jij)</span>}
                  </span>
                  <div className="flex items-center gap-3 text-sm text-right">
                    <div className="hidden sm:block text-gray-400">
                      <span title="Wedstrijdpunten">{entry.matchPoints}w</span>
                      {" + "}
                      <span title="Bonuspunten">{entry.bonusPoints}b</span>
                      {" + "}
                      <span title="Kampioenspunten">{entry.championPoints}k</span>
                    </div>
                    <span className={`font-bold text-base ${isMe ? "text-orange-600" : "text-gray-900"}`}>
                      {entry.totalPoints}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
