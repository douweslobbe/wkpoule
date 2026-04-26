import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { PoolSubNav } from "./PoolSubNav"
import { CopyButton } from "@/components/CopyButton"
import { UserBadges } from "@/components/UserBadges"
import type { Metadata } from "next"

export async function generateMetadata({ params }: { params: Promise<{ poolId: string }> }): Promise<Metadata> {
  const { poolId } = await params
  const pool = await prisma.pool.findUnique({ where: { id: poolId }, select: { name: true } })
  return { title: pool ? `${pool.name} — WK Pool 2026` : "WK Pool 2026" }
}

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
      previousTotalPoints: null as number | null,
      snapshotAt: null as Date | null,
      lastCalculatedAt: new Date(),
    })),
  ]

  // Calculate previous ranking for movement indicators
  const prevRanked = ranked
    .filter((e) => e.previousTotalPoints !== null && e.previousTotalPoints !== undefined)
    .map((e) => ({ userId: e.userId, pts: e.previousTotalPoints as number }))
    .sort((a, b) => b.pts - a.pts)
  const prevRankMap = new Map(prevRanked.map((e, i) => [e.userId, i + 1]))

  const completedMatches = await prisma.match.count({ where: { status: "FINISHED" } })
  const totalMatches = 104

  // Achievements per user
  const achievements = await prisma.achievement.findMany({
    where: { poolId },
    orderBy: { earnedAt: "desc" },
  })
  const achievementsByUser = new Map<string, typeof achievements>()
  for (const a of achievements) {
    const list = achievementsByUser.get(a.userId) ?? []
    list.push(a)
    achievementsByUser.set(a.userId, list)
  }

  // Joker-gebruik per gebruiker (toont op leaderboard hoeveel jokers actief zijn)
  const jokerUsage = await prisma.prediction.groupBy({
    by: ["userId"],
    where: { userId: { in: members.map((m) => m.userId) }, isJoker: true },
    _count: { id: true },
  })
  const jokerUsageMap = new Map(jokerUsage.map((j) => [j.userId, j._count.id]))

  // Admin checklist data
  const memberCount = members.length
  const bonusQuestionCount = await prisma.bonusQuestion.count({ where: { poolId } })
  const bonusQuestionsScored = await prisma.bonusQuestion.count({ where: { poolId, correctAnswer: { not: null } } })

  // Pre-tournament readiness (only relevant before matches start)
  const championPicks = await prisma.championPick.findMany({ where: { poolId }, select: { userId: true } })
  const hasChampionPickSet = new Set(championPicks.map((p) => p.userId))

  // Bonus answers per user (for readiness view)
  const bonusQuestionIds = bonusQuestionCount > 0
    ? await prisma.bonusQuestion.findMany({ where: { poolId }, select: { id: true } }).then((qs) => qs.map((q) => q.id))
    : []
  const bonusAnswerCounts = bonusQuestionIds.length > 0
    ? await prisma.bonusAnswer.groupBy({
        by: ["userId"],
        where: { questionId: { in: bonusQuestionIds } },
        _count: { id: true },
      })
    : []
  const bonusAnswerMap = new Map(bonusAnswerCounts.map((b) => [b.userId, b._count.id]))

  // Predictions per user for progress (only group stage)
  const groupMatchCount = await prisma.match.count({ where: { stage: "GROUP" } })
  const predictionCounts = groupMatchCount > 0
    ? await prisma.prediction.groupBy({
        by: ["userId"],
        where: { userId: { in: allMemberIds }, match: { stage: "GROUP" } },
        _count: { id: true },
      })
    : []
  const predCountMap = new Map(predictionCounts.map((p) => [p.userId, p._count.id]))

  const latestMessage = await prisma.poolMessage.findFirst({
    where: { poolId },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  })

  return (
    <div>
      <PoolSubNav poolId={poolId} latestMessageAt={latestMessage?.createdAt.getTime()} />

      <div className="flex items-start justify-between mb-5 flex-wrap gap-3">
        <div>
          <h1 className="font-pixel text-white" style={{ fontSize: "10px" }}>{pool.name.toUpperCase()}</h1>
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            <span className="font-pixel" style={{ fontSize: "7px", color: "#4af56a" }}>CODE:</span>
            <span className="font-pixel font-bold tracking-widest px-2 py-0.5 text-sm" style={{ background: "#FFD700", color: "#000", border: "2px solid #000", boxShadow: "2px 2px 0 #000" }}>
              {pool.inviteCode}
            </span>
            <CopyButton text={pool.inviteCode} label="KOPIEER CODE" />
            <CopyButton
              text={`${process.env.NEXT_PUBLIC_BASE_URL ?? "https://wkpool2026.wesl.nl"}/pools/join?code=${pool.inviteCode}`}
              label="KOPIEER LINK"
            />
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

      {/* Pool bericht (description) */}
      {pool.description && (
        <div className="pixel-card p-4 mb-5 flex items-start gap-3" style={{ background: "#0d1a10", borderLeft: "4px solid #FFD700" }}>
          <span style={{ fontSize: "16px", flexShrink: 0 }}>📋</span>
          <p className="font-pixel" style={{ fontSize: "8px", color: "var(--c-text-2)", lineHeight: "2.1" }}>
            {pool.description}
          </p>
        </div>
      )}

      {/* Admin checklist (alleen voor admins, verdwijnt als alles gedaan is) */}
      {isAdmin && (() => {
        const checks = [
          {
            done: !!pool.description,
            label: "Poolbericht ingesteld",
            detail: pool.description ? "Afspraken zichtbaar voor leden" : "Stel de inzet of afspraken in via Beheer",
            link: `/admin/pools/${poolId}/bonus`,
          },
          {
            done: memberCount > 1,
            label: "Poolgenoten uitgenodigd",
            detail: memberCount > 1 ? `${memberCount} leden` : "Deel de uitnodigingscode hieronder",
            link: null,
          },
          {
            done: bonusQuestionCount > 0,
            label: "Bonusvragen toegevoegd",
            detail: bonusQuestionCount > 0 ? `${bonusQuestionCount} vragen klaarstaan` : "Kies uit de vragenbibliotheek",
            link: `/admin/pools/${poolId}/bonus`,
          },
        ]
        const allDone = checks.every((c) => c.done)
        if (allDone) return null
        return (
          <div className="pixel-card overflow-hidden mb-6">
            <div className="px-5 py-3" style={{ background: "#0d1a10", borderBottom: "3px solid #000" }}>
              <h2 className="font-pixel text-white" style={{ fontSize: "9px" }}>⚙ ADMIN CHECKLIST</h2>
              <p className="mt-1 font-pixel" style={{ fontSize: "7px", color: "#4af56a" }}>Zet je pool klaar voor het WK</p>
            </div>
            <div>
              {checks.map((c, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 px-5 py-3"
                  style={{ borderBottom: "1px solid var(--c-border)", opacity: c.done ? 0.5 : 1 }}
                >
                  <span className="font-pixel shrink-0" style={{ fontSize: "10px", color: c.done ? "#4af56a" : "#FF6200" }}>
                    {c.done ? "✓" : "○"}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="font-pixel" style={{ fontSize: "8px", color: c.done ? "var(--c-text-3)" : "var(--c-text)", textDecoration: c.done ? "line-through" : "none" }}>
                      {c.label}
                    </div>
                    <div className="font-pixel" style={{ fontSize: "7px", color: "var(--c-text-4)" }}>{c.detail}</div>
                  </div>
                  {!c.done && c.link && (
                    <Link
                      href={c.link}
                      className="pixel-btn shrink-0 px-2 py-1 font-pixel"
                      style={{ background: "#FF6200", color: "white", fontSize: "6px" }}
                    >
                      →
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
        )
      })()}

      {/* Leaderboard */}
      <div className="pixel-card overflow-hidden">
        <div className="px-5 py-3" style={{ background: "#0a3d1f", borderBottom: "3px solid #000" }}>
          <h2 className="font-pixel text-white" style={{ fontSize: "9px" }}>
            {completedMatches > 0 ? "📊 DE MEGALOMANE RANGLIJST" : "👥 WIE DOET ER MEE?"}
          </h2>
          {completedMatches > 0 ? (
            <p className="mt-1" style={{ color: "#4af56a", fontSize: "11px" }}>
              {completedMatches}/{totalMatches} wedstrijden gespeeld · prognose op basis van huidige score/wedstrijd
            </p>
          ) : (
            <p className="mt-1 font-pixel" style={{ fontSize: "7px", color: "var(--c-text-3)" }}>
              Ranglijst start op 11 juni · zie wie er al klaar is
            </p>
          )}
        </div>

        {/* Pre-tournament readiness view */}
        {completedMatches === 0 && ranked.length > 0 && (
          <div>
            <div className="hidden sm:grid px-5 py-2 font-bold uppercase"
              style={{
                gridTemplateColumns: "1fr 6rem 6rem 6rem",
                fontSize: "7px",
                color: "var(--c-text-3)",
                borderBottom: "2px solid var(--c-border)",
                fontFamily: "var(--font-pixel), monospace",
              }}>
              <span>Speler</span>
              <span className="text-center">⚽ Poulefase</span>
              <span className="text-center">🏆 Plaatje</span>
              <span className="text-center">✓ Klaar</span>
            </div>
            {members.map((m) => {
              const predsDone = predCountMap.get(m.userId) ?? 0
              const bonusDone = bonusAnswerMap.get(m.userId) ?? 0
              const champDone = hasChampionPickSet.has(m.userId)
              const isMe = m.userId === session.user.id
              const predPct = groupMatchCount > 0 ? Math.round((predsDone / groupMatchCount) * 100) : 0
              const bonusPct = bonusQuestionCount > 0 ? Math.round((bonusDone / bonusQuestionCount) * 100) : null
              const allReady = predPct === 100 && champDone && (bonusPct === null || bonusPct === 100)
              return (
                <div
                  key={m.userId}
                  className="flex sm:grid items-center gap-3 sm:gap-2 px-5 py-3"
                  style={{
                    gridTemplateColumns: "1fr 6rem 6rem 6rem",
                    borderBottom: "1px solid var(--c-border)",
                    borderLeft: isMe ? "3px solid #FF6200" : "3px solid transparent",
                    background: isMe ? "#1e0800" : "var(--c-surface-alt)",
                  }}
                >
                  <span className="font-pixel text-sm truncate flex items-center gap-1" style={{ color: isMe ? "#FF6200" : "var(--c-text)" }}>
                    {m.user.name}{isMe && <span style={{ color: "#FF6200", opacity: 0.6 }}> ◄</span>}
                    <UserBadges
                      achievements={achievementsByUser.get(m.userId) ?? []}
                      jokerCount={jokerUsageMap.get(m.userId) ?? 0}
                      size="xs"
                      max={3}
                    />
                  </span>
                  <div className="text-center shrink-0">
                    <div className="relative h-2 w-16 mx-auto mb-0.5" style={{ background: "var(--c-surface-deep)", border: "1px solid #333" }}>
                      <div style={{ width: `${predPct}%`, height: "100%", background: predPct === 100 ? "#16a34a" : "#FF6200" }} />
                    </div>
                    <span className="font-pixel" style={{ fontSize: "6px", color: "var(--c-text-4)" }}>{predsDone}/{groupMatchCount}</span>
                  </div>
                  <div className="text-center shrink-0">
                    {bonusPct !== null ? (
                      <>
                        <div className="relative h-2 w-16 mx-auto mb-0.5" style={{ background: "var(--c-surface-deep)", border: "1px solid #333" }}>
                          <div style={{ width: `${bonusPct}%`, height: "100%", background: bonusPct === 100 ? "#16a34a" : "#FFD700" }} />
                        </div>
                        <span className="font-pixel" style={{ fontSize: "6px", color: "var(--c-text-4)" }}>{bonusDone}/{bonusQuestionCount}</span>
                      </>
                    ) : (
                      <span className="font-pixel" style={{ fontSize: "6px", color: "var(--c-text-5)" }}>—</span>
                    )}
                  </div>
                  <div className="text-center shrink-0">
                    <span className="font-pixel" style={{ fontSize: "9px", color: allReady ? "#4af56a" : "var(--c-text-5)" }}>
                      {allReady ? "✓ KLAAR" : "○"}
                    </span>
                  </div>
                </div>
              )
            })}
            <div className="px-5 py-2 font-pixel" style={{ borderTop: "2px solid var(--c-border)", background: "var(--c-surface-deep)", fontSize: "7px", color: "var(--c-text-4)" }}>
              ⚽ = poulefase-voorspellingen · 🏆 = bonusvragen ingevuld · ✓ = alles klaar
            </div>
          </div>
        )}

        {(completedMatches > 0 || ranked.length === 0) && ranked.length === 0 ? (
          <p className="text-center py-10 text-sm" style={{ color: "var(--c-text-4)" }}>Nog geen scores</p>
        ) : completedMatches > 0 ? (
          <div>
            {/* Header row */}
            <div className="hidden sm:grid px-5 py-2 font-bold uppercase tracking-wide"
              style={{
                gridTemplateColumns: "2rem 1fr 7rem 7rem 5rem 5.5rem",
                fontSize: "9px",
                color: "var(--c-text-3)",
                borderBottom: "2px solid var(--c-border)",
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
                const prevRank = prevRankMap.get(entry.userId)
                const rankChange = prevRank !== undefined ? prevRank - (i + 1) : null

                const projectedMatchPts = completedMatches > 0
                  ? Math.round((entry.matchPoints / completedMatches) * totalMatches)
                  : null

                const projectedTotal = projectedMatchPts !== null
                  ? projectedMatchPts + entry.bonusPoints + entry.championPoints
                  : null

                const maxBonus = entry.bonusPoints + (bonusQuestionCount - bonusQuestionsScored) * 7
                const maxChampion = entry.championPoints > 0 ? entry.championPoints : (hasPick ? 15 : 0)
                const maxPossible = (projectedMatchPts ?? 0) + maxBonus + maxChampion

                return (
                  <div
                    key={entry.userId}
                    style={{
                      background: isMe ? "#1e1200" : "var(--c-surface-alt)",
                      borderBottom: "2px solid var(--c-border)",
                      borderLeft: isMe ? "3px solid #FF6200" : "3px solid transparent",
                    }}
                  >
                    {/* Desktop: grid layout */}
                    <div className="hidden sm:grid items-center gap-2 px-5 py-3"
                      style={{ gridTemplateColumns: "2rem 1fr 7rem 7rem 5rem 5.5rem" }}>
                      <span className="text-lg">{medal}</span>
                      <span className="font-bold text-sm truncate flex items-center gap-1.5 flex-wrap" style={{ color: isMe ? "#FF6200" : "var(--c-text)" }}>
                        {memberMap.get(entry.userId) ?? "?"}
                        {isMe && <span className="text-xs font-normal" style={{ color: "#FF6200", opacity: 0.7 }}>◄ jij</span>}
                        {rankChange !== null && rankChange !== 0 && (
                          <span className="font-pixel" style={{
                            fontSize: "7px",
                            color: rankChange > 0 ? "#4af56a" : "#ff4444",
                          }}>
                            {rankChange > 0 ? `↑${rankChange}` : `↓${Math.abs(rankChange)}`}
                          </span>
                        )}
                        <UserBadges
                          achievements={achievementsByUser.get(entry.userId) ?? []}
                          jokerCount={jokerUsageMap.get(entry.userId) ?? 0}
                        />
                      </span>
                      <span className="text-center text-sm" style={{ color: "var(--c-text-2)" }}>{entry.matchPoints}</span>
                      <span className="text-center text-sm" style={{ color: "var(--c-text-2)" }}>{entry.bonusPoints + entry.championPoints}</span>
                      <span className="text-center font-pixel"
                        style={{ color: isMe ? "#FF6200" : "#FFD700", fontSize: "11px" }}>
                        {entry.totalPoints}
                      </span>
                      <span className="text-center text-sm font-semibold" style={{ color: "#4499ff" }}>
                        {projectedTotal !== null ? (
                          <span title={`Max mogelijk: ${maxPossible}`}>
                            ~{projectedTotal}
                            {completedMatches < totalMatches && (
                              <span className="text-xs ml-0.5" style={{ color: "var(--c-text-5)" }}>/{maxPossible}</span>
                            )}
                          </span>
                        ) : (
                          <span style={{ color: "var(--c-text-5)", fontSize: "11px" }}>—</span>
                        )}
                      </span>
                    </div>

                    {/* Mobile: compact layout */}
                    <div className="sm:hidden flex items-center gap-3 px-4 py-3">
                      <span className="text-lg w-7">{medal}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm truncate flex items-center gap-1.5 flex-wrap" style={{ color: isMe ? "#FF6200" : "var(--c-text)" }}>
                          {memberMap.get(entry.userId) ?? "?"}
                          {isMe && <span className="text-xs font-normal" style={{ opacity: 0.6, color: "#FF6200" }}>◄</span>}
                          <UserBadges
                            achievements={achievementsByUser.get(entry.userId) ?? []}
                            jokerCount={jokerUsageMap.get(entry.userId) ?? 0}
                            size="xs"
                            max={3}
                          />
                          {rankChange !== null && rankChange !== 0 && (
                            <span className="font-pixel" style={{
                              fontSize: "7px",
                              color: rankChange > 0 ? "#4af56a" : "#ff4444",
                            }}>
                              {rankChange > 0 ? `↑${rankChange}` : `↓${Math.abs(rankChange)}`}
                            </span>
                          )}
                        </div>
                        <div className="text-xs mt-0.5" style={{ color: "var(--c-text-3)" }}>
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
              style={{ borderTop: "2px solid var(--c-border)", background: "var(--c-surface-deep)", fontSize: "10px", color: "var(--c-text-4)" }}>
              <span>⚽ wedstrijdpunten</span>
              <span>🏆 bonus + kampioen</span>
              {completedMatches > 0 && <span style={{ color: "#4499ff" }}>📈 prognose = huidig tempo × 104 wedstrijden</span>}
            </div>
          </div>
        ) : null}
      </div>

      {/* Multi-pool nudge */}
      <div
        className="mt-6 pixel-card p-4 flex items-center gap-4 flex-wrap"
        style={{ borderStyle: "dashed", borderColor: "var(--c-border-mid)", background: "transparent" }}
      >
        <span className="text-2xl" style={{ flexShrink: 0 }}>🏆</span>
        <div className="flex-1 min-w-0">
          <div className="font-pixel" style={{ fontSize: "8px", color: "#4af56a" }}>
            SPEEL OOK IN ANDERE POOLS
          </div>
          <div className="font-pixel mt-1" style={{ fontSize: "7px", color: "var(--c-text-4)", lineHeight: "1.8" }}>
            Maak een pool voor vrienden, familie of collega&apos;s. Voorspellingen tellen overal — je hoeft ze maar één keer in te vullen.
          </div>
        </div>
        <div className="flex gap-2 flex-wrap shrink-0">
          <Link
            href="/pools/new"
            className="font-pixel px-3 py-2"
            style={{ fontSize: "7px", background: "#4af56a", color: "#000", border: "2px solid #000", boxShadow: "2px 2px 0 #000" }}
          >
            + NIEUWE POOL
          </Link>
          <Link
            href="/pools/join"
            className="font-pixel px-3 py-2"
            style={{ fontSize: "7px", color: "var(--c-text-2)", border: "2px solid var(--c-border)" }}
          >
            MEEDOEN MET CODE
          </Link>
        </div>
      </div>
    </div>
  )
}
