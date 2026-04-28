import { redirect } from "next/navigation"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Dashboard — WK Pool 2026" }

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

  // Komende wedstrijden zonder voorspelling (deadline binnen 7 dagen)
  const now = new Date()
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  const upcomingMatches = await prisma.match.findMany({
    where: {
      status: "SCHEDULED",
      kickoff: { lte: new Date(in7Days.getTime() + 30 * 60 * 1000) },
    },
    include: { homeTeam: true, awayTeam: true },
    orderBy: { kickoff: "asc" },
    take: 10,
  })
  // Voorspellingen per match én pool — match is "gedaan" als alle pools een voorspelling hebben
  const myPoolIds = memberships.map((m) => m.pool.id)
  const myPredictions = await prisma.prediction.findMany({
    where: { userId: session.user.id, matchId: { in: upcomingMatches.map((m) => m.id) } },
    select: { matchId: true, poolId: true },
  })
  // Bouw een Map: matchId → Set van poolIds met voorspelling
  const predByMatch = new Map<string, Set<string>>()
  for (const p of myPredictions) {
    const s = predByMatch.get(p.matchId) ?? new Set()
    s.add(p.poolId)
    predByMatch.set(p.matchId, s)
  }

  const upcomingWithDeadline = upcomingMatches.map((m) => {
    const predictedPools = predByMatch.get(m.id) ?? new Set()
    const missingPools = myPoolIds.filter((id) => !predictedPools.has(id))
    return {
      ...m,
      deadline: new Date(m.kickoff.getTime() - 30 * 60 * 1000),
      hasPred: missingPools.length === 0,
      missingPools,
    }
  }).filter((m) => m.deadline > now)

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
        <p className="font-pixel mt-1" style={{ fontSize: "7px", color: completedMatches > 0 ? "#4af56a" : "var(--c-text-3)" }}>
          {completedMatches > 0
            ? `${completedMatches}/${TOTAL_MATCHES} WEDSTRIJDEN GESPEELD`
            : "WK 2026 START 11 JUNI · ZET ALVAST JE VOORSPELLINGEN KLAAR!"}
        </p>
      </div>

      {memberships.length === 0 ? (
        <div className="pixel-card p-10 text-center">
          <div className="text-5xl mb-4">⚽</div>
          <h2 className="font-pixel mb-3" style={{ fontSize: "9px", color: "#FFD700" }}>GEEN POOLS</h2>
          <p className="text-sm mb-6" style={{ color: "var(--c-text-3)" }}>
            Maak een nieuwe pool aan of doe mee via een uitnodigingscode.
          </p>
          <div className="flex gap-3 justify-center">
            <Link href="/pools/new" className="pixel-btn px-5 py-2.5 text-sm font-bold"
              style={{ background: "#FF6200", color: "white" }}>
              Pool aanmaken
            </Link>
            <Link href="/pools/join" className="pixel-btn px-5 py-2.5 text-sm font-bold"
              style={{ background: "var(--c-border)", color: "var(--c-text)", border: "2px solid #333360" }}>
              Meedoen met code
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Mijn standings per pool */}
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
                color: "var(--c-text-3)",
                borderBottom: "2px solid var(--c-border)",
                fontFamily: "var(--font-pixel), monospace",
              }}>
              <span>Pool</span>
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
                  className="block pool-row"
                  style={{ borderBottom: "2px solid var(--c-border)" }}
                >
                  {/* Desktop */}
                  <div className="hidden sm:grid px-5 py-3 items-center gap-2"
                    style={{ gridTemplateColumns: "1fr 4rem 7rem 7rem 5rem 5.5rem" }}>
                    <div>
                      <span className="font-bold text-sm" style={{ color: "var(--c-text)" }}>{pool.name}</span>
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
                          color: rank === 1 ? "#FFD700" : rank <= 3 ? "#FF6200" : "var(--c-text-2)",
                          fontSize: "11px",
                        }}>
                          {rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : `#${rank}`}
                          <span style={{ fontSize: "9px", color: "var(--c-text-4)" }}>/{total}</span>
                        </span>
                      ) : (
                        <span style={{ color: "var(--c-text-5)", fontSize: "11px" }}>—</span>
                      )}
                    </div>
                    <span className="text-center text-sm" style={{ color: "var(--c-text-2)" }}>{myEntry?.matchPoints ?? 0}</span>
                    <span className="text-center text-sm" style={{ color: "var(--c-text-2)" }}>{(myEntry?.bonusPoints ?? 0) + (myEntry?.championPoints ?? 0)}</span>
                    <span className="text-center font-pixel" style={{ color: "#FFD700", fontSize: "11px" }}>
                      {myEntry?.totalPoints ?? 0}
                    </span>
                    <span className="text-center text-sm font-semibold" style={{ color: "#4499ff" }}>
                      {projectedTotal !== null ? (
                        <span title={`Max mogelijk: ${maxPossible}`}>
                          ~{projectedTotal}
                          {completedMatches < TOTAL_MATCHES && (
                            <span className="text-xs ml-0.5" style={{ color: "var(--c-text-5)" }}>/{maxPossible}</span>
                          )}
                        </span>
                      ) : (
                        <span style={{ color: "var(--c-text-5)", fontSize: "11px" }}>—</span>
                      )}
                    </span>
                  </div>

                  {/* Mobile */}
                  <div className="sm:hidden px-4 py-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm truncate" style={{ color: "var(--c-text)" }}>{pool.name}</div>
                      <div className="text-xs mt-0.5" style={{ color: "var(--c-text-4)" }}>
                        ⚽{myEntry?.matchPoints ?? 0} + 🏆{(myEntry?.bonusPoints ?? 0) + (myEntry?.championPoints ?? 0)}
                      </div>
                    </div>
                    <div className="text-right">
                      {rank && (
                        <div style={{ fontSize: "10px", color: "var(--c-text-3)" }}>#{rank}/{total}</div>
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
              style={{ borderTop: "2px solid var(--c-border)", background: "var(--c-surface-deep)", fontSize: "10px", color: "var(--c-text-4)" }}>
              <span>⚽ wedstrijdpunten · 🏆 bonus + kampioen</span>
              {completedMatches === 0 && <span>Prognose beschikbaar zodra wedstrijden gespeeld zijn</span>}
            </div>
          </div>

          {/* Komende deadlines */}
          {upcomingWithDeadline.length > 0 && (
            <div className="pixel-card overflow-hidden mb-6">
              <div className="px-5 py-3" style={{ background: "#1a0a00", borderBottom: "3px solid #000" }}>
                <h2 className="font-pixel text-white" style={{ fontSize: "9px" }}>⏱ KOMENDE DEADLINES</h2>
                <p className="mt-1 font-pixel" style={{ fontSize: "7px", color: "#FF6200" }}>
                  Wedstrijden waarvoor de invoertijd binnenkort sluit
                </p>
              </div>
              <div>
                {upcomingWithDeadline.map((m) => {
                  const diffMs = m.deadline.getTime() - now.getTime()
                  const hours = Math.floor(diffMs / 3_600_000)
                  const minutes = Math.floor((diffMs % 3_600_000) / 60_000)
                  const isUrgent = diffMs < 3_600_000
                  const timeLabel = hours > 0
                    ? `${hours}u ${minutes}min`
                    : `${minutes}min`

                  return (
                    <div
                      key={m.id}
                      className="flex items-center gap-3 px-4 py-2.5"
                      style={{
                        borderBottom: "1px solid var(--c-border)",
                        borderLeft: m.hasPred ? "3px solid #16a34a" : "3px solid #FF6200",
                        background: m.hasPred ? "transparent" : (isUrgent ? "#1a0500" : "transparent"),
                      }}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-pixel truncate" style={{ fontSize: "8px", color: "var(--c-text)" }}>
                          {m.homeTeam?.nameNl ?? m.homeTeam?.name ?? "?"} – {m.awayTeam?.nameNl ?? m.awayTeam?.name ?? "?"}
                        </div>
                        <div className="font-pixel mt-0.5" style={{ fontSize: "7px", color: "var(--c-text-4)" }}>
                          {new Date(m.kickoff).toLocaleString("nl-NL", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        {m.hasPred ? (
                          <span className="font-pixel" style={{ fontSize: "7px", color: "#4af56a" }}>✓ INGEVULD</span>
                        ) : (
                          <span className="font-pixel" style={{ fontSize: "7px", color: isUrgent ? "#ff4444" : "#FFD700" }}>
                            {isUrgent ? "⚠ " : "⏱ "}{timeLabel}
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="px-5 py-2 text-right" style={{ borderTop: "1px solid var(--c-border)", background: "var(--c-surface-deep)" }}>
                <Link href={`/pools/${memberships[0]?.pool.id}/predictions`} className="font-pixel" style={{ fontSize: "7px", color: "#FF6200" }}>
                  Alle voorspellingen invullen →
                </Link>
              </div>
            </div>
          )}

          {/* Snelle acties */}
          <div className="grid gap-3 sm:grid-cols-3 mb-6">
            <Link href={`/pools/${memberships[0]?.pool.id}/predictions`} className="pixel-card p-4 flex items-center gap-3 transition-colors"
              style={{ borderLeft: "4px solid #FF6200" }}>
              <span className="text-2xl">⚽</span>
              <div>
                <div className="font-pixel" style={{ fontSize: "8px", color: "#FF6200" }}>DE WEDSTRIJDEN</div>
                <div className="text-xs mt-0.5" style={{ color: "var(--c-text-3)" }}>Voorspellingen invullen</div>
              </div>
            </Link>

            {memberships.slice(0, 1).map(({ pool }) => (
              <Link key={pool.id} href={`/pools/${pool.id}/bonus`} className="pixel-card p-4 flex items-center gap-3 transition-colors"
                style={{ borderLeft: "4px solid #FFD700" }}>
                <span className="text-2xl">🏆</span>
                <div>
                  <div className="font-pixel" style={{ fontSize: "8px", color: "#FFD700" }}>HET GROTE PLAATJE</div>
                  <div className="text-xs mt-0.5" style={{ color: "var(--c-text-3)" }}>Bonus & kampioen kiezen</div>
                </div>
              </Link>
            ))}

            <Link href="/pools/new" className="pixel-card p-4 flex items-center gap-3 transition-colors"
              style={{ borderStyle: "dashed", borderLeft: "4px dashed var(--c-border-mid)" }}>
              <span className="text-2xl" style={{ color: "#4af56a" }}>+</span>
              <div>
                <div className="font-pixel" style={{ fontSize: "8px", color: "#4af56a" }}>NIEUWE POOL</div>
                <div className="text-xs mt-0.5" style={{ color: "var(--c-text-4)" }}>Aanmaken of meedoen</div>
              </div>
            </Link>
          </div>

          {/* Multi-pool aanmoediging — prominent als je ≤2 pools hebt */}
          {memberships.length <= 2 && (
            <div
              className="pixel-card overflow-hidden mb-6"
              style={{ borderColor: "#4af56a", borderWidth: "2px" }}
            >
              <div className="px-5 py-3" style={{ background: "#071f0e", borderBottom: "3px solid #000" }}>
                <h2 className="font-pixel text-white" style={{ fontSize: "9px" }}>
                  🏆 SPEEL IN MEERDERE POOLS
                </h2>
                <p className="mt-1 font-pixel" style={{ fontSize: "7px", color: "#4af56a" }}>
                  Maak een pool voor elk gezelschap — elke pool heeft zijn eigen stand en uitdagingen!
                </p>
              </div>
              <div className="grid sm:grid-cols-3 gap-0" style={{ borderBottom: "none" }}>
                {[
                  { emoji: "👨‍👩‍👧‍👦", label: "Familie", desc: "Wie voorspelt het beste thuis?" },
                  { emoji: "🤝", label: "Vrienden", desc: "Oude rivaliteiten, nieuwe inzetten" },
                  { emoji: "💼", label: "Collega's", desc: "Kantoor-kampioen worden?" },
                ].map((item, i) => (
                  <Link
                    key={item.label}
                    href="/pools/new"
                    className="flex items-center gap-3 px-5 py-4 transition-colors"
                    style={{
                      borderRight: i < 2 ? "2px solid var(--c-border)" : "none",
                      borderBottom: "none",
                    }}
                  >
                    <span style={{ fontSize: "24px", flexShrink: 0 }}>{item.emoji}</span>
                    <div>
                      <div className="font-pixel" style={{ fontSize: "8px", color: "#FFD700" }}>
                        POOL: {item.label.toUpperCase()}
                      </div>
                      <div className="font-pixel mt-0.5" style={{ fontSize: "6px", color: "var(--c-text-4)" }}>
                        {item.desc}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
              <div className="px-5 py-2 flex items-center justify-between flex-wrap gap-2"
                style={{ background: "var(--c-surface-deep)", borderTop: "2px solid var(--c-border)" }}>
                <span className="font-pixel" style={{ fontSize: "6px", color: "var(--c-text-4)" }}>
                  Of doe mee met een bestaande pool via een uitnodigingscode
                </span>
                <Link href="/pools/join" className="font-pixel" style={{ fontSize: "7px", color: "#FF6200" }}>
                  Meedoen met code →
                </Link>
              </div>
            </div>
          )}

          {/* Subtiele link als je al 3+ pools hebt */}
          {memberships.length > 2 && (
            <div className="text-center mb-4">
              <Link href="/pools/join" className="font-pixel" style={{ fontSize: "7px", color: "#555580" }}>
                + Nog een pool aanmaken of meedoen met code →
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  )
}
