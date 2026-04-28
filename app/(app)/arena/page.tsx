import { redirect } from "next/navigation"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "De Arena — WK Pool 2026" }

export default async function ArenaPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const memberships = await prisma.poolMembership.findMany({
    where: { userId: session.user.id },
    include: {
      pool: {
        include: {
          _count: { select: { memberships: true } },
          leaderboard: { orderBy: { totalPoints: "desc" } },
        },
      },
    },
    orderBy: { joinedAt: "asc" },
  })

  // Unread prikbord per pool
  const poolIds = memberships.map((m) => m.pool.id)
  const latestMsgs = poolIds.length > 0
    ? await prisma.poolMessage.groupBy({
        by: ["poolId"],
        where: { poolId: { in: poolIds } },
        _max: { createdAt: true },
      })
    : []
  const latestMessages: Record<string, number> = Object.fromEntries(
    latestMsgs.map((m) => [m.poolId, m._max.createdAt?.getTime() ?? 0])
  )

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="font-pixel mb-1" style={{ fontSize: "6px", color: "#4a7a4a", letterSpacing: "4px" }}>
          JOUW WK POOLS
        </div>
        <h1 className="font-pixel" style={{ fontSize: "14px", color: "#FFD700", textShadow: "3px 3px 0 #000, -1px -1px 0 #000", letterSpacing: "2px" }}>
          🏟️ DE ARENA
        </h1>
        <p className="font-pixel mt-2" style={{ fontSize: "7px", color: "var(--c-text-3)" }}>
          Jouw slagveld — pools tegen vrienden, familie en collega&apos;s
        </p>
      </div>

      {memberships.length === 0 ? (
        /* Lege staat */
        <div className="pixel-card p-10 text-center">
          <div className="text-5xl mb-4">🏟️</div>
          <h2 className="font-pixel mb-3" style={{ fontSize: "9px", color: "#FFD700" }}>
            DE ARENA IS LEEG
          </h2>
          <p className="mb-6" style={{ color: "var(--c-text-3)", fontSize: "9px" }}>
            Geen pools gevonden. Maak er een aan of doe mee via een uitnodigingscode.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link href="/pools/new" className="pixel-btn px-5 py-2.5 font-bold"
              style={{ background: "#FF6200", color: "white" }}>
              Pool aanmaken
            </Link>
            <Link href="/pools/join" className="pixel-btn px-5 py-2.5 font-bold"
              style={{ background: "var(--c-border)", color: "var(--c-text)", border: "2px solid #333360" }}>
              Meedoen met code
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Pool kaartjes */}
          <div className="space-y-4 mb-6">
            {memberships.map(({ pool, role }) => {
              const lb = pool.leaderboard
              const myEntry = lb.find((e) => e.userId === session.user.id)
              const rank = myEntry ? lb.findIndex((e) => e.userId === session.user.id) + 1 : null
              const total = pool._count.memberships
              const latestAt = latestMessages[pool.id] ?? 0

              return (
                <div
                  key={pool.id}
                  className="pixel-card overflow-hidden"
                  style={{ borderColor: "#2d2d50" }}
                >
                  {/* Pool header */}
                  <div
                    className="px-5 py-4 flex items-center justify-between gap-4 flex-wrap"
                    style={{ background: "#0a1220", borderBottom: "3px solid #000" }}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <h2 className="font-pixel text-white truncate" style={{ fontSize: "11px" }}>
                        {pool.name.toUpperCase()}
                      </h2>
                      {role === "ADMIN" && (
                        <span className="shrink-0 px-1.5 py-0.5 font-pixel"
                          style={{ background: "#FFD700", color: "#000", fontSize: "6px" }}>
                          ADMIN
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      {/* Rank badge */}
                      {rank ? (
                        <div className="text-center">
                          <div className="font-pixel" style={{
                            fontSize: "13px",
                            color: rank === 1 ? "#FFD700" : rank <= 3 ? "#FF6200" : "var(--c-text-2)",
                          }}>
                            {rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : `#${rank}`}
                          </div>
                          <div className="font-pixel" style={{ fontSize: "6px", color: "var(--c-text-5)" }}>
                            VAN {total}
                          </div>
                        </div>
                      ) : (
                        <div className="font-pixel text-center" style={{ fontSize: "7px", color: "var(--c-text-5)" }}>
                          {total} spelers
                        </div>
                      )}
                      {/* Punten */}
                      {myEntry && (
                        <div className="text-center">
                          <div className="font-pixel" style={{ fontSize: "13px", color: "#FFD700" }}>
                            {myEntry.totalPoints}
                          </div>
                          <div className="font-pixel" style={{ fontSize: "6px", color: "var(--c-text-5)" }}>
                            PUNTEN
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Navigatieknoppen */}
                  <div className="grid grid-cols-2 sm:grid-cols-4">
                    {[
                      { href: `/pools/${pool.id}/predictions`, icon: "⚽", label: "DE WEDSTRIJDEN", color: "#FF6200" },
                      { href: `/pools/${pool.id}/bonus`,       icon: "🏆", label: "HET GROTE PLAATJE", color: "#FFD700" },
                      { href: `/pools/${pool.id}/prikbord`,    icon: "📌", label: "HET PRIKBORD", color: "#4499ff", unread: latestAt > 0 },
                      { href: `/pools/${pool.id}`,             icon: "📊", label: "DE RANGLIJST", color: "#4af56a" },
                    ].map((btn, i) => (
                      <Link
                        key={btn.href}
                        href={btn.href}
                        className="relative flex flex-col items-center justify-center gap-1 py-4 px-2 transition-all"
                        style={{
                          borderRight: i < 3 ? "2px solid var(--c-border)" : "none",
                          borderTop: "none",
                          background: "transparent",
                        }}
                      >
                        <span style={{ fontSize: "20px" }}>{btn.icon}</span>
                        <span className="font-pixel text-center" style={{ fontSize: "6px", color: btn.color, lineHeight: "1.6" }}>
                          {btn.label}
                        </span>
                        {btn.unread && (
                          <span style={{
                            position: "absolute", top: "6px", right: "6px",
                            width: "7px", height: "7px",
                            background: "#ff4444", border: "1px solid #000",
                          }} />
                        )}
                      </Link>
                    ))}
                  </div>

                  {/* Admin shortcut */}
                  {role === "ADMIN" && (
                    <div
                      className="px-5 py-2 flex justify-end"
                      style={{ borderTop: "1px solid var(--c-border)", background: "var(--c-surface-deep)" }}
                    >
                      <Link
                        href={`/admin/pools/${pool.id}/bonus`}
                        className="font-pixel"
                        style={{ fontSize: "6px", color: "#FFD700" }}
                      >
                        ⚙ BEHEER POOL →
                      </Link>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Nieuwe pool */}
          <div
            className="pixel-card overflow-hidden"
            style={{ borderStyle: "dashed", borderColor: "#2d2d50" }}
          >
            <div className="grid sm:grid-cols-2 divide-x divide-[var(--c-border)]">
              <Link
                href="/pools/new"
                className="flex items-center gap-4 px-6 py-5 transition-colors"
              >
                <span className="text-3xl" style={{ color: "#4af56a" }}>+</span>
                <div>
                  <div className="font-pixel" style={{ fontSize: "8px", color: "#4af56a" }}>NIEUWE POOL</div>
                  <div className="font-pixel mt-1" style={{ fontSize: "6px", color: "var(--c-text-4)" }}>
                    Maak een pool voor familie, vrienden of collega&apos;s
                  </div>
                </div>
              </Link>
              <Link
                href="/pools/join"
                className="flex items-center gap-4 px-6 py-5 transition-colors"
              >
                <span className="text-3xl">🔑</span>
                <div>
                  <div className="font-pixel" style={{ fontSize: "8px", color: "#FF6200" }}>MEEDOEN MET CODE</div>
                  <div className="font-pixel mt-1" style={{ fontSize: "6px", color: "var(--c-text-4)" }}>
                    Iemand heeft je uitgenodigd? Voer hier de code in
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
