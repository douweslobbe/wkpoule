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
          <h2 className="font-pixel text-white" style={{ fontSize: "9px" }}>📊 RANGLIJST</h2>
        </div>

        {ranked.length === 0 ? (
          <p className="text-center text-gray-500 py-10 text-sm">Nog geen scores</p>
        ) : (
          <div className="divide-y-2 divide-gray-200">
            {ranked.map((entry, i) => {
              const isMe = entry.userId === session.user.id
              const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`
              return (
                <div
                  key={entry.userId}
                  className={`flex items-center px-5 py-3.5 gap-4 ${isMe ? "bg-yellow-50" : "bg-background"}`}
                >
                  <span className="w-8 text-center text-lg">{medal}</span>
                  <span className={`flex-1 font-bold text-sm ${isMe ? "text-orange" : "text-gray-800"}`} style={{ color: isMe ? "#FF6200" : undefined }}>
                    {memberMap.get(entry.userId) ?? "Onbekend"}
                    {isMe && <span className="ml-1.5 text-xs font-normal text-orange-500"> ◄ jij</span>}
                  </span>
                  <div className="flex items-center gap-3 text-sm text-right">
                    <div className="hidden sm:block text-gray-400 text-xs">
                      <span title="Wedstrijdpunten">{entry.matchPoints}w</span>
                      {" + "}
                      <span title="Bonuspunten">{entry.bonusPoints}b</span>
                      {" + "}
                      <span title="Kampioenspunten">{entry.championPoints}k</span>
                    </div>
                    <span className={`font-pixel text-sm ${isMe ? "" : ""}`} style={{ color: isMe ? "#FF6200" : "#1a1a2e", fontSize: "11px" }}>
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
