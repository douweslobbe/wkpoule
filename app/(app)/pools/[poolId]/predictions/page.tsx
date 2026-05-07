import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { MatchStage } from "@prisma/client"
import { JOKER_QUOTA, jokersAllowedInStage } from "@/lib/jokers"
import { UserBadges } from "@/components/UserBadges"
import { CompactMatchRow } from "@/components/CompactMatchRow"
import { DeadlineCountdown } from "@/components/DeadlineCountdown"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Voorspellingen — WK Pool 2026" }

const STAGE_LABELS: Record<MatchStage, string> = {
  GROUP: "Groepsfase",
  ROUND_OF_32: "Ronde van 32",
  ROUND_OF_16: "Ronde van 16",
  QUARTER_FINAL: "Kwartfinale",
  SEMI_FINAL: "Halve finale",
  THIRD_PLACE: "Derde plaats",
  FINAL: "Finale",
}

const STAGE_ORDER: MatchStage[] = [
  "GROUP", "ROUND_OF_32", "ROUND_OF_16", "QUARTER_FINAL", "SEMI_FINAL", "THIRD_PLACE", "FINAL",
]

export default async function PoolPredictionsPage({
  params,
  searchParams,
}: {
  params: Promise<{ poolId: string }>
  searchParams: Promise<{ stage?: string; view?: string }>
}) {
  const { poolId } = await params
  const sp = await searchParams
  const session = await auth()
  if (!session?.user) redirect("/login")

  const membership = await prisma.poolMembership.findUnique({
    where: { userId_poolId: { userId: session.user.id, poolId } },
  })
  if (!membership) notFound()

  const stage = (sp.stage as MatchStage) ?? "GROUP"
  const viewUserId = sp.view ?? session.user.id

  const poolMembers = await prisma.poolMembership.findMany({
    where: { poolId },
    include: { user: { select: { id: true, name: true } } },
    orderBy: { user: { name: "asc" } },
  })

  const matches = await prisma.match.findMany({
    where: { stage },
    include: { homeTeam: true, awayTeam: true },
    orderBy: { kickoff: "asc" },
  })

  // Tel wedstrijden per fase (voor tab-indicator)
  const matchCountsByStage = await prisma.match.groupBy({
    by: ["stage"],
    _count: { id: true },
  })
  const matchCountMap = Object.fromEntries(matchCountsByStage.map((s) => [s.stage, s._count.id]))

  // Predictions voor deze pool + fase
  const myPredictions = await prisma.prediction.findMany({
    where: { userId: session.user.id, poolId, matchId: { in: matches.map((m) => m.id) } },
  })
  const myPredMap = new Map(myPredictions.map((p) => [p.matchId, p]))

  const viewPredictions =
    viewUserId !== session.user.id
      ? await prisma.prediction.findMany({
          where: { userId: viewUserId, poolId, matchId: { in: matches.map((m) => m.id) } },
        })
      : myPredictions
  const viewPredMap = new Map(viewPredictions.map((p) => [p.matchId, p]))

  const viewUser = viewUserId !== session.user.id
    ? poolMembers.find((m) => m.userId === viewUserId)?.user
    : null

  // Joker-quota voor deze pool + fase
  const jokersUsedInStage = await prisma.prediction.count({
    where: { userId: session.user.id, poolId, isJoker: true, match: { stage } },
  })
  const jokerAllowedHere = jokersAllowedInStage(stage)
  const jokersRemaining = Math.max(0, JOKER_QUOTA[stage] - jokersUsedInStage)

  // Voortgang totaal over alle fases (voor deze pool)
  const [totalMatchesAll, totalPredictionsAll] = viewUserId === session.user.id
    ? await Promise.all([
        prisma.match.count(),
        prisma.prediction.count({ where: { userId: session.user.id, poolId } }),
      ])
    : [0, 0]

  // Achievements + joker-badge voor poolgenoten
  const memberIdsForBadges = poolMembers.map((m) => m.userId)
  const memberAchievements = memberIdsForBadges.length > 0
    ? await prisma.achievement.findMany({ where: { poolId, userId: { in: memberIdsForBadges } } })
    : []
  const achievementsByUser = new Map<string, typeof memberAchievements>()
  for (const a of memberAchievements) {
    const list = achievementsByUser.get(a.userId) ?? []
    list.push(a)
    achievementsByUser.set(a.userId, list)
  }
  const memberJokerCounts = memberIdsForBadges.length > 0
    ? await prisma.prediction.groupBy({
        by: ["userId"],
        where: { userId: { in: memberIdsForBadges }, poolId, isJoker: true },
        _count: { id: true },
      })
    : []
  const jokerCountByUser = new Map(memberJokerCounts.map((j) => [j.userId, j._count.id]))

  const now = new Date()
  const totalMatches = matches.length
  const filledIn = myPredictions.length
  const openMatches = matches.filter((m) => now <= new Date(m.kickoff.getTime() - 30 * 60 * 1000))
  const closingSoon = openMatches.filter(
    (m) => new Date(m.kickoff.getTime() - 30 * 60 * 1000).getTime() - now.getTime() < 24 * 3_600_000
  )
  const missedOpen = openMatches.filter((m) => !myPredMap.get(m.id)).length

  return (
    <div>
      {/* Picks van andere poolgenoten bekijken */}
      {poolMembers.length > 1 && (
        <div className="mb-3">
          <div className="flex items-center gap-2 no-scrollbar" style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" } as React.CSSProperties}>
            <span className="font-pixel shrink-0" style={{ fontSize: "7px", color: "var(--c-text-4)" }}>BEKIJK:</span>
            <Link
              href={`/pools/${poolId}/predictions?stage=${stage}&view=${session.user.id}`}
              className={`shrink-0 px-2.5 py-2 text-xs font-bold transition-all ${viewUserId === session.user.id ? "pixel-tab-active" : "pixel-tab-inactive"}`}
              style={{ fontFamily: "var(--font-pixel), monospace", fontSize: "7px", whiteSpace: "nowrap" }}
            >
              🙋 Mijn picks
            </Link>
            {poolMembers
              .filter((m) => m.userId !== session.user.id)
              .map((m) => (
                <Link
                  key={m.userId}
                  href={`/pools/${poolId}/predictions?stage=${stage}&view=${m.userId}`}
                  className={`shrink-0 px-2 py-2 text-xs font-bold transition-all inline-flex items-center gap-1 ${viewUserId === m.userId ? "pixel-tab-active" : "pixel-tab-inactive"}`}
                  style={{ fontFamily: "var(--font-pixel), monospace", fontSize: "7px", whiteSpace: "nowrap" }}
                >
                  {m.user.name}
                  <UserBadges
                    achievements={achievementsByUser.get(m.userId) ?? []}
                    jokerCount={jokerCountByUser.get(m.userId) ?? 0}
                    size="xs"
                    max={3}
                  />
                </Link>
              ))}
          </div>
          {viewUser && (
            <div className="mt-2 px-2 py-1 font-bold inline-flex items-center gap-2" style={{ background: "#1a1200", border: "2px solid #FFD700", color: "#FFD700", fontSize: "11px", boxShadow: "2px 2px 0 #000" }}>
              👁 Picks van {viewUser.name}
              <UserBadges
                achievements={achievementsByUser.get(viewUser.id) ?? []}
                jokerCount={jokerCountByUser.get(viewUser.id) ?? 0}
                size="sm"
                max={5}
              />
            </div>
          )}
        </div>
      )}

      {/* Fase-tabs */}
      <div className="flex gap-1.5 mb-4 no-scrollbar" style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" } as React.CSSProperties}>
        {STAGE_ORDER.map((s) => (
          <Link
            key={s}
            href={`/pools/${poolId}/predictions?stage=${s}${viewUserId !== session.user.id ? `&view=${viewUserId}` : ""}`}
            className={`px-2.5 py-2 text-xs font-bold shrink-0 ${stage === s ? "pixel-tab-active" : "pixel-tab-inactive"} ${!matchCountMap[s] ? "opacity-40" : ""}`}
            style={{ fontFamily: "var(--font-pixel), monospace", fontSize: "7px", whiteSpace: "nowrap" }}
            title={!matchCountMap[s] ? "Wedstrijden worden later toegevoegd" : undefined}
          >
            {STAGE_LABELS[s]}
          </Link>
        ))}
      </div>

      {/* Deadline countdown — alleen voor eigen picks */}
      {viewUserId === session.user.id && (
        <DeadlineCountdown
          matches={matches.map((m) => ({
            id: m.id,
            homeTeam: m.homeTeam?.nameNl ?? m.homeTeam?.name ?? "?",
            awayTeam: m.awayTeam?.nameNl ?? m.awayTeam?.name ?? "?",
            kickoff: m.kickoff.toISOString(),
            hasPrediction: myPredMap.has(m.id),
          }))}
        />
      )}

      {/* Joker-quota banner */}
      {viewUserId === session.user.id && jokerAllowedHere && totalMatches > 0 && (
        <div className="pixel-card overflow-hidden mb-4 flex items-center gap-3 px-4 py-3" style={{ background: "#1a1200", borderLeft: "4px solid #FFD700" }}>
          <span style={{ fontSize: "16px" }}>★</span>
          <div className="flex-1 min-w-0">
            <div className="font-pixel" style={{ fontSize: "8px", color: "#FFD700", lineHeight: "1.8" }}>
              LUCKY SHOT — JOKERS DEZE RONDE
            </div>
            <div className="font-pixel mt-1" style={{ fontSize: "7px", color: "var(--c-text-3)", lineHeight: "1.9" }}>
              Zet een joker in op een wedstrijd → punten tellen dubbel
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {Array.from({ length: JOKER_QUOTA[stage] }).map((_, i) => {
              const used = i < jokersUsedInStage
              return (
                <span
                  key={i}
                  className="font-pixel"
                  style={{
                    width: "18px",
                    height: "18px",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "10px",
                    background: used ? "#FFD700" : "var(--c-surface-deep)",
                    color: used ? "#000" : "var(--c-text-5)",
                    border: `2px solid ${used ? "#000" : "var(--c-border-bright)"}`,
                    boxShadow: used ? "1px 1px 0 #000" : "none",
                  }}
                >
                  {used ? "★" : "○"}
                </span>
              )
            })}
            <span className="font-pixel ml-2" style={{ fontSize: "8px", color: jokersRemaining > 0 ? "#4af56a" : "var(--c-text-4)" }}>
              {jokersRemaining}/{JOKER_QUOTA[stage]}
            </span>
          </div>
        </div>
      )}

      {/* Voortgangsbalk */}
      {viewUserId === session.user.id && totalMatches > 0 && (
        <div className="pixel-card overflow-hidden mb-4">
          {/* Totaal over alle fases */}
          {totalMatchesAll > 0 && (
            <div
              className="px-4 py-2 flex items-center gap-3"
              style={{ borderBottom: "2px solid var(--c-border)", background: "var(--c-surface-deep)" }}
            >
              <span className="font-pixel" style={{ fontSize: "6px", color: "var(--c-text-4)" }}>
                TOTAAL ALLE FASES
              </span>
              <div className="flex-1 relative h-2" style={{ background: "#0a0a1a", border: "1px solid #1a1a3a" }}>
                <div
                  className="h-full"
                  style={{
                    width: `${Math.round((totalPredictionsAll / totalMatchesAll) * 100)}%`,
                    background: totalPredictionsAll === totalMatchesAll ? "#16a34a" : "#FF6200",
                    transition: "width 0.3s",
                  }}
                />
              </div>
              <span className="font-pixel shrink-0" style={{ fontSize: "7px", color: totalPredictionsAll === totalMatchesAll ? "#4af56a" : "#FF6200" }}>
                {totalPredictionsAll}/{totalMatchesAll}
              </span>
              {totalPredictionsAll === totalMatchesAll && (
                <span className="font-pixel shrink-0" style={{ fontSize: "6px", color: "#4af56a" }}>🏆 VOLLEDIG!</span>
              )}
            </div>
          )}

          {/* Per fase */}
          <div className="px-4 py-3 flex items-center gap-4 flex-wrap">
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-pixel" style={{ fontSize: "7px", color: "var(--c-text-3)" }}>
                  {STAGE_LABELS[stage].toUpperCase()} VOORSPELLINGEN
                </span>
                <span className="font-pixel" style={{ fontSize: "7px", color: filledIn === totalMatches ? "#4af56a" : "var(--c-text-2)" }}>
                  {filledIn}/{totalMatches}
                </span>
              </div>
              <div className="relative h-3 w-full" style={{ background: "var(--c-surface-deep)", border: "2px solid #000" }}>
                <div
                  className="h-full transition-all"
                  style={{
                    width: totalMatches > 0 ? `${Math.round((filledIn / totalMatches) * 100)}%` : "0%",
                    background: filledIn === totalMatches ? "#16a34a" : "#FF6200",
                  }}
                />
              </div>
            </div>
            {closingSoon.length > 0 && missedOpen > 0 && (
              <span className="font-pixel shrink-0" style={{ fontSize: "7px", color: "#FFD700" }}>
                ⏱ {missedOpen} nog in te vullen{closingSoon.filter((m) => !myPredMap.get(m.id)).length > 0 ? ` · ${closingSoon.filter((m) => !myPredMap.get(m.id)).length} sluiten snel` : ""}
              </span>
            )}
            {filledIn === totalMatches && totalMatches > 0 && (
              <span className="font-pixel shrink-0" style={{ fontSize: "7px", color: "#4af56a" }}>
                ✓ ALLES INGEVULD
              </span>
            )}
          </div>
        </div>
      )}

      {/* Wedstrijdlijst */}
      {matches.length === 0 ? (
        <div className="pixel-card overflow-hidden">
          <div className="px-5 py-3" style={{ background: "#0a3d1f", borderBottom: "3px solid #000" }}>
            <h2 className="font-pixel text-white" style={{ fontSize: "9px" }}>
              {stage === "GROUP" ? "📅 GEEN WEDSTRIJDEN" : "⏳ NOG NIET BEGONNEN"}
            </h2>
          </div>
          <div className="p-6 text-center space-y-3">
            {stage === "GROUP" ? (
              <p className="font-pixel" style={{ fontSize: "8px", color: "var(--c-text-3)" }}>
                Nog geen groepswedstrijden bekend.
              </p>
            ) : (
              <>
                <p className="font-pixel" style={{ fontSize: "8px", color: "var(--c-text-2)", lineHeight: "2" }}>
                  De <span style={{ color: "#FFD700" }}>{STAGE_LABELS[stage].toLowerCase()}</span> is nog niet begonnen.
                </p>
                <p style={{ fontSize: "9px", color: "var(--c-text-3)", lineHeight: "1.8" }}>
                  Voorspellingen voor de knock-outronden kun je invullen zodra de teams
                  bekend zijn — dus nadat de vorige ronde gespeeld is. Kom dan terug!
                </p>
                <p className="font-pixel mt-2" style={{ fontSize: "7px", color: "#4af56a" }}>
                  ⟳ KOMENDE TERUG GEDURENDE HET TOERNOOI
                </p>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="pixel-card overflow-hidden">
          {matches.map((match) => {
            const deadline = new Date(match.kickoff.getTime() - 30 * 60 * 1000)
            const locked = now > deadline
            const myPred = myPredMap.get(match.id)
            const viewPred = viewPredMap.get(match.id)
            const isOwnView = viewUserId === session.user.id

            return (
              <div key={match.id}>
                <CompactMatchRow
                  match={{
                    id: match.id,
                    stage: match.stage,
                    groupName: match.groupName,
                    kickoff: match.kickoff,
                    status: match.status,
                    homeScore: match.homeScore,
                    awayScore: match.awayScore,
                    homeTeam: match.homeTeam ? {
                      code: match.homeTeam.code,
                      nameNl: match.homeTeam.nameNl,
                      name: match.homeTeam.name,
                    } : null,
                    awayTeam: match.awayTeam ? {
                      code: match.awayTeam.code,
                      nameNl: match.awayTeam.nameNl,
                      name: match.awayTeam.name,
                    } : null,
                  }}
                  poolId={poolId}
                  myPred={myPred ? {
                    homeScore: myPred.homeScore,
                    awayScore: myPred.awayScore,
                    pointsAwarded: myPred.pointsAwarded,
                    isJoker: myPred.isJoker,
                  } : undefined}
                  viewPred={viewPred ? {
                    homeScore: viewPred.homeScore,
                    awayScore: viewPred.awayScore,
                    pointsAwarded: viewPred.pointsAwarded,
                    isJoker: viewPred.isJoker,
                  } : undefined}
                  isOwnView={isOwnView}
                  locked={locked}
                  jokerAllowed={jokerAllowedHere}
                  jokersRemaining={jokersRemaining}
                />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
