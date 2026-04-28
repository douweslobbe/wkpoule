import { redirect } from "next/navigation"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { MatchStage } from "@prisma/client"
import { JOKER_QUOTA, jokersAllowedInStage } from "@/lib/jokers"
import { UserBadges } from "@/components/UserBadges"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Voorspellingen — WK Pool 2026" }
import { PoolSubNav } from "../pools/[poolId]/PoolSubNav"
import { CompactMatchRow } from "./CompactMatchRow"

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

export default async function PredictionsPage({
  searchParams,
}: {
  searchParams: Promise<{ stage?: string; pool?: string; view?: string }>
}) {
  const sp = await searchParams
  const session = await auth()
  if (!session?.user) redirect("/login")

  const stage = (sp.stage as MatchStage) ?? "GROUP"
  const activePoolId = sp.pool ?? null
  const viewUserId = sp.view ?? session.user.id

  // Alle poules van de gebruiker
  const myPools = await prisma.poolMembership.findMany({
    where: { userId: session.user.id },
    include: { pool: { select: { id: true, name: true } } },
    orderBy: { joinedAt: "asc" },
  })

  // Leden van de actieve poule (voor andere picks bekijken)
  let poolMembers: { userId: string; user: { id: string; name: string } }[] = []
  if (activePoolId) {
    const membership = await prisma.poolMembership.findUnique({
      where: { userId_poolId: { userId: session.user.id, poolId: activePoolId } },
    })
    if (membership) {
      poolMembers = await prisma.poolMembership.findMany({
        where: { poolId: activePoolId },
        include: { user: { select: { id: true, name: true } } },
        orderBy: { user: { name: "asc" } },
      })
    }
  }

  const matches = await prisma.match.findMany({
    where: { stage },
    include: { homeTeam: true, awayTeam: true },
    orderBy: { kickoff: "asc" },
  })

  const myPredictions = await prisma.prediction.findMany({
    where: { userId: session.user.id, matchId: { in: matches.map((m) => m.id) } },
  })
  const myPredMap = new Map(myPredictions.map((p) => [p.matchId, p]))

  // Joker-quota voor deze fase
  const jokersUsedInStage = await prisma.prediction.count({
    where: { userId: session.user.id, isJoker: true, match: { stage } },
  })
  const jokerAllowedHere = jokersAllowedInStage(stage)
  const jokersRemaining = Math.max(0, JOKER_QUOTA[stage] - jokersUsedInStage)

  // Achievements + joker-totaal voor poolgenoten (badges)
  const memberIdsForBadges = poolMembers.map((m) => m.userId)
  const memberAchievements = activePoolId && memberIdsForBadges.length > 0
    ? await prisma.achievement.findMany({ where: { poolId: activePoolId, userId: { in: memberIdsForBadges } } })
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
        where: { userId: { in: memberIdsForBadges }, isJoker: true },
        _count: { id: true },
      })
    : []
  const jokerCountByUser = new Map(memberJokerCounts.map((j) => [j.userId, j._count.id]))

  const viewPredictions =
    viewUserId !== session.user.id
      ? await prisma.prediction.findMany({
          where: { userId: viewUserId, matchId: { in: matches.map((m) => m.id) } },
        })
      : myPredictions
  const viewPredMap = new Map(viewPredictions.map((p) => [p.matchId, p]))

  const viewUser = viewUserId !== session.user.id
    ? poolMembers.find((m) => m.userId === viewUserId)?.user
    : null

  const now = new Date()

  // Voortgang voor deze fase
  const totalMatches = matches.length
  const filledIn = myPredictions.length
  const openMatches = matches.filter((m) => now <= new Date(m.kickoff.getTime() - 30 * 60 * 1000))
  const closingSoon = openMatches.filter(
    (m) => new Date(m.kickoff.getTime() - 30 * 60 * 1000).getTime() - now.getTime() < 24 * 3_600_000
  )
  const missedOpen = openMatches.filter((m) => !myPredMap.get(m.id)).length

  // Gebruik eerste pool als geen pool geselecteerd
  const navPoolId = activePoolId ?? myPools[0]?.pool.id ?? ""

  const latestMessage = navPoolId ? await prisma.poolMessage.findFirst({
    where: { poolId: navPoolId },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  }) : null

  return (
    <div>
      {/* Pool navigatie tabs — altijd zichtbaar */}
      {navPoolId && <PoolSubNav poolId={navPoolId} latestMessageAt={latestMessage?.createdAt.getTime()} />}

      {/* Picks van andere poolgenoten bekijken */}
      {activePoolId && poolMembers.length > 1 && (
        <div className="mb-3">
          <div className="flex items-center gap-2 no-scrollbar" style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" } as React.CSSProperties}>
            <span className="font-pixel shrink-0" style={{ fontSize: "7px", color: "var(--c-text-4)" }}>BEKIJK:</span>
            <Link
              href={`/predictions?stage=${stage}&pool=${activePoolId}&view=${session.user.id}`}
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
                  href={`/predictions?stage=${stage}&pool=${activePoolId}&view=${m.userId}`}
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
            href={`/predictions?stage=${s}${activePoolId ? `&pool=${activePoolId}` : ""}${viewUserId !== session.user.id ? `&view=${viewUserId}` : ""}`}
            className={`px-2.5 py-2 text-xs font-bold shrink-0 ${stage === s ? "pixel-tab-active" : "pixel-tab-inactive"}`}
            style={{ fontFamily: "var(--font-pixel), monospace", fontSize: "7px", whiteSpace: "nowrap" }}
          >
            {STAGE_LABELS[s]}
          </Link>
        ))}
      </div>

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

      {/* Voortgangsbalk — alleen bij eigen view en als er wedstrijden zijn */}
      {viewUserId === session.user.id && totalMatches > 0 && (
        <div className="pixel-card overflow-hidden mb-4">
          <div className="px-4 py-3 flex items-center gap-4 flex-wrap">
            {/* Progress bar */}
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
                    imageRendering: "pixelated",
                  }}
                />
              </div>
            </div>
            {/* Waarschuwing: wedstrijden die binnenkort sluiten maar nog niet ingevuld */}
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
