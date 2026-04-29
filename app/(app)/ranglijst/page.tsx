import { redirect } from "next/navigation"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "De Megalomane Ranglijst — WK Pool 2026" }

export default async function RanglijstPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const memberships = await prisma.poolMembership.findMany({
    where: { userId: session.user.id },
    include: {
      pool: {
        include: {
          _count: { select: { memberships: true } },
        },
      },
    },
    orderBy: { joinedAt: "asc" },
  })

  // Per pool: leaderboard entries + naam-map via members
  const poolIds = memberships.map((m) => m.pool.id)

  const [allEntries, allMembers] = await Promise.all([
    prisma.leaderboardEntry.findMany({
      where: { poolId: { in: poolIds } },
      orderBy: { totalPoints: "desc" },
    }),
    prisma.poolMembership.findMany({
      where: { poolId: { in: poolIds } },
      include: { user: { select: { id: true, name: true } } },
    }),
  ])

  // Naam-map: poolId + userId → name
  const nameMap = new Map<string, string>()
  for (const m of allMembers) {
    nameMap.set(`${m.poolId}:${m.userId}`, m.user.name ?? "—")
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <Link href="/arena" className="font-pixel" style={{ fontSize: "7px", color: "#7070a0" }}>
          ◄ DE ARENA
        </Link>
        <h1 className="font-pixel text-white" style={{ fontSize: "10px" }}>
          📊 DE MEGALOMANE RANGLIJST
        </h1>
      </div>

      <div className="space-y-5">
        {memberships.map(({ pool }) => {
          const poolEntries = allEntries
            .filter((e) => e.poolId === pool.id)
            .sort((a, b) => b.totalPoints - a.totalPoints)

          const myRank = poolEntries.findIndex((e) => e.userId === session.user.id) + 1

          return (
            <div key={pool.id} className="pixel-card overflow-hidden">
              <div
                className="px-5 py-3 flex items-center justify-between"
                style={{ background: "#0a1220", borderBottom: "3px solid #000" }}
              >
                <h2 className="font-pixel text-white" style={{ fontSize: "9px" }}>
                  {pool.name.toUpperCase()}
                </h2>
                {myRank > 0 && (
                  <span className="font-pixel" style={{
                    fontSize: "8px",
                    color: myRank === 1 ? "#FFD700" : myRank <= 3 ? "#FF6200" : "var(--c-text-3)",
                  }}>
                    Jij: #{myRank}/{pool._count.memberships}
                  </span>
                )}
              </div>

              {poolEntries.length === 0 ? (
                <div className="px-5 py-4">
                  <p className="font-pixel" style={{ fontSize: "7px", color: "var(--c-text-5)" }}>
                    Nog geen punten gescoord.
                  </p>
                </div>
              ) : (
                <div>
                  {poolEntries.slice(0, 10).map((entry, i) => {
                    const isMe = entry.userId === session.user.id
                    const rank = i + 1
                    const name = nameMap.get(`${pool.id}:${entry.userId}`) ?? "—"
                    return (
                      <div
                        key={entry.id}
                        className="flex items-center gap-3 px-5 py-2.5"
                        style={{
                          borderBottom: "1px solid var(--c-border)",
                          background: isMe ? "#0d1a0d" : "transparent",
                          borderLeft: isMe ? "3px solid #4af56a" : "3px solid transparent",
                        }}
                      >
                        <span className="font-pixel shrink-0" style={{
                          fontSize: "9px", minWidth: "2rem",
                          color: rank === 1 ? "#FFD700" : rank === 2 ? "#aaaaaa" : rank === 3 ? "#cd7f32" : "var(--c-text-5)",
                        }}>
                          {rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : `#${rank}`}
                        </span>
                        <span className="flex-1 font-pixel truncate" style={{
                          fontSize: "8px",
                          color: isMe ? "#4af56a" : "var(--c-text-2)",
                          fontWeight: isMe ? "bold" : "normal",
                        }}>
                          {name}{isMe ? " ◄" : ""}
                        </span>
                        <span className="font-pixel shrink-0" style={{ fontSize: "9px", color: "#FFD700" }}>
                          {entry.totalPoints} pt
                        </span>
                      </div>
                    )
                  })}
                  {poolEntries.length > 10 && (
                    <div className="px-5 py-2 text-right" style={{ borderTop: "1px solid var(--c-border)", background: "var(--c-surface-deep)" }}>
                      <Link href={`/pools/${pool.id}`} className="font-pixel" style={{ fontSize: "7px", color: "#FF6200" }}>
                        Volledige ranglijst →
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}

        {memberships.length === 0 && (
          <div className="pixel-card p-10 text-center">
            <p className="font-pixel" style={{ fontSize: "8px", color: "var(--c-text-4)" }}>
              Geen pools gevonden.{" "}
              <Link href="/arena" style={{ color: "#FF6200" }}>Ga naar De Arena →</Link>
            </p>
          </div>
        )}

        {/* Survivor & Bracket komen later */}
        <div className="pixel-card overflow-hidden" style={{ borderColor: "#2d2d50", borderStyle: "dashed" }}>
          <div className="px-5 py-4 text-center">
            <p className="font-pixel" style={{ fontSize: "7px", color: "var(--c-text-4)" }}>
              🚧 BINNENKORT: WK Survivor ranglijst & Bracket posities
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
