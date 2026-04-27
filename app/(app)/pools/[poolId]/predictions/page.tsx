import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { PredictionForm } from "./PredictionForm"
import { MatchStage } from "@prisma/client"
import { PoolSubNav } from "../PoolSubNav"
import { PixelFlag } from "@/components/PixelFlag"
import { DeadlineDisplay } from "@/components/DeadlineDisplay"

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
  "GROUP", "ROUND_OF_32", "ROUND_OF_16", "QUARTER_FINAL", "SEMI_FINAL", "THIRD_PLACE", "FINAL"
]

export default async function PredictionsPage({
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

  // Check that viewUser is in the same pool
  const viewMembership = await prisma.poolMembership.findFirst({
    where: { poolId, userId: viewUserId },
    include: { user: { select: { name: true } } },
  })

  const matches = await prisma.match.findMany({
    where: { stage },
    include: { homeTeam: true, awayTeam: true },
    orderBy: [{ kickoff: "asc" }],
  })

  const myPredictions = await prisma.prediction.findMany({
    where: { userId: session.user.id, matchId: { in: matches.map((m) => m.id) } },
  })
  const myPredMap = new Map(myPredictions.map((p) => [p.matchId, p]))

  const viewPredictions =
    viewUserId !== session.user.id
      ? await prisma.prediction.findMany({
          where: { userId: viewUserId, matchId: { in: matches.map((m) => m.id) } },
        })
      : myPredictions
  const viewPredMap = new Map(viewPredictions.map((p) => [p.matchId, p]))

  const poolMembers = await prisma.poolMembership.findMany({
    where: { poolId },
    include: { user: { select: { id: true, name: true } } },
    orderBy: { user: { name: "asc" } },
  })

  const latestMessage = await prisma.poolMessage.findFirst({
    where: { poolId },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  })

  // Totaal over alle fases (alleen eigen view)
  const [totalMatchesAll, totalPredictionsAll] = viewUserId === session.user.id
    ? await Promise.all([
        prisma.match.count(),
        prisma.prediction.count({ where: { userId: session.user.id } }),
      ])
    : [0, 0]

  const now = new Date()

  // Voortgang voor deze fase
  const totalMatches = matches.length
  const filledIn = myPredictions.length
  const openMatches = matches.filter((m) => now <= new Date(m.kickoff.getTime() - 30 * 60 * 1000))
  const closingSoonNotFilled = openMatches.filter((m) => {
    const dl = new Date(m.kickoff.getTime() - 30 * 60 * 1000)
    return dl.getTime() - now.getTime() < 24 * 3_600_000 && !myPredMap.get(m.id)
  }).length

  return (
    <div>
      <PoolSubNav poolId={poolId} latestMessageAt={latestMessage?.createdAt.getTime()} />

      {/* Wie bekijken we? */}
      <div className="flex gap-2 mb-4 no-scrollbar" style={{ overflowX: "auto" } as React.CSSProperties}>
        <Link
          href={`/pools/${poolId}/predictions?stage=${stage}&view=${session.user.id}`}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            viewUserId === session.user.id
              ? "bg-orange-500 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          Mijn voorspellingen
        </Link>
        {poolMembers
          .filter((m) => m.userId !== session.user.id)
          .map((m) => (
            <Link
              key={m.userId}
              href={`/pools/${poolId}/predictions?stage=${stage}&view=${m.userId}`}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                viewUserId === m.userId
                  ? "bg-orange-500 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {m.user.name}
            </Link>
          ))}
      </div>

      {/* Stage tabs */}
      <div className="flex gap-1 mb-5 no-scrollbar" style={{ overflowX: "auto" } as React.CSSProperties}>
        {STAGE_ORDER.map((s) => (
          <Link
            key={s}
            href={`/pools/${poolId}/predictions?stage=${s}&view=${viewUserId}`}
            className={`shrink-0 px-3 py-1.5 text-xs font-bold ${stage === s ? "pixel-tab-active" : "pixel-tab-inactive"}`}
            style={{ whiteSpace: "nowrap" }}
          >
            {STAGE_LABELS[s]}
          </Link>
        ))}
      </div>

      {/* Voortgang — totaal + per fase */}
      {viewUserId === session.user.id && totalMatchesAll > 0 && (
        <div className="pixel-card overflow-hidden mb-4">
          {/* Totaal over alles */}
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

          {/* Per fase */}
          {totalMatches > 0 && (
            <div className="px-4 py-3 flex items-center gap-4 flex-wrap">
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-pixel" style={{ fontSize: "7px", color: "var(--c-text-3)" }}>
                    {STAGE_LABELS[stage].toUpperCase()}
                  </span>
                  <span className="font-pixel" style={{ fontSize: "7px", color: filledIn === totalMatches ? "#4af56a" : "var(--c-text-2)" }}>
                    {filledIn}/{totalMatches}
                  </span>
                </div>
                <div className="relative h-3 w-full" style={{ background: "var(--c-surface-deep)", border: "2px solid #000" }}>
                  <div
                    className="h-full transition-all"
                    style={{
                      width: `${Math.round((filledIn / totalMatches) * 100)}%`,
                      background: filledIn === totalMatches ? "#16a34a" : "#FF6200",
                    }}
                  />
                </div>
              </div>
              {closingSoonNotFilled > 0 && (
                <span className="font-pixel shrink-0" style={{ fontSize: "7px", color: "#FFD700" }}>
                  ⏱ {closingSoonNotFilled} sluiten snel
                </span>
              )}
              {filledIn === totalMatches && totalMatches > 0 && (
                <span className="font-pixel shrink-0" style={{ fontSize: "7px", color: "#4af56a" }}>✓ FASE KLAAR</span>
              )}
            </div>
          )}
        </div>
      )}

      {matches.length === 0 ? (
        <div className="pixel-card p-10 text-center text-gray-500">
          Nog geen wedstrijden gepland voor deze ronde.
        </div>
      ) : (
        <div className="space-y-3">
          {matches.map((match) => {
            const deadline = new Date(match.kickoff.getTime() - 30 * 60 * 1000)
            const locked = now > deadline
            const finished = match.status === "FINISHED"
            const myPred = myPredMap.get(match.id)
            const viewPred = viewPredMap.get(match.id)
            const isOwnView = viewUserId === session.user.id

            return (
              <div
                key={match.id}
                className="pixel-card p-4 rounded-none"
              >
                {/* Match header */}
                <div className="flex items-center justify-between mb-3 text-xs text-gray-400">
                  <span>
                    {match.groupName && <span className="mr-1">{match.groupName} ·</span>}
                    {new Date(match.kickoff).toLocaleString("nl-NL", {
                      weekday: "short", day: "numeric", month: "short",
                      hour: "2-digit", minute: "2-digit",
                    })}
                  </span>
                  <span className="text-xs font-bold">
                    {locked ? (
                      <span className="font-pixel" style={{ fontSize: "9px", color: "#cc2222" }}>🔒 VERGRENDELD</span>
                    ) : (
                      <DeadlineDisplay deadline={deadline} />
                    )}
                  </span>
                </div>

                <div className="flex items-center gap-3 mt-3">
                  {/* Thuis */}
                  <div className="flex-1 flex items-center gap-2">
                    {match.homeTeam?.code && (
                      <PixelFlag code={match.homeTeam.code} size="md" />
                    )}
                    <span className="font-bold text-sm text-gray-900">
                      {match.homeTeam?.nameNl ?? match.homeTeam?.name ?? "?"}
                    </span>
                  </div>

                  {/* Score */}
                  <div className="shrink-0 text-center">
                    {finished ? (
                      <div className="flex items-center gap-1 font-bold text-lg">
                        <span className="w-8 text-center py-1 font-pixel" style={{ background: "#1a1a2e", color: "#FFD700", fontSize: "13px" }}>{match.homeScore}</span>
                        <span className="text-gray-400">–</span>
                        <span className="w-8 text-center py-1 font-pixel" style={{ background: "#1a1a2e", color: "#FFD700", fontSize: "13px" }}>{match.awayScore}</span>
                      </div>
                    ) : (
                      <span className="font-pixel text-gray-400" style={{ fontSize: "10px" }}>VS</span>
                    )}
                  </div>

                  {/* Uit */}
                  <div className="flex-1 flex items-center justify-end gap-2">
                    <span className="font-bold text-sm text-gray-900">
                      {match.awayTeam?.nameNl ?? match.awayTeam?.name ?? "?"}
                    </span>
                    {match.awayTeam?.code && (
                      <PixelFlag code={match.awayTeam.code} size="md" />
                    )}
                  </div>
                </div>

                {/* Voorspelling */}
                {isOwnView && !locked ? (
                  <PredictionForm
                    matchId={match.id}
                    initialHome={myPred?.homeScore}
                    initialAway={myPred?.awayScore}
                  />
                ) : (
                  <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-center gap-2 text-sm">
                    {viewPred ? (
                      <>
                        <span className="text-gray-500">Voorspelling:</span>
                        <span className="font-semibold text-orange-600">
                          {viewPred.homeScore} – {viewPred.awayScore}
                        </span>
                        {viewPred.pointsAwarded !== null && (
                          <span className="bg-green-100 text-green-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                            +{viewPred.pointsAwarded} pt
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-gray-400 italic">Geen voorspelling</span>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
