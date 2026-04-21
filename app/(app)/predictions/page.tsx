import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { PredictionForm } from "../pools/[poolId]/predictions/PredictionForm"
import { MatchStage } from "@prisma/client"
import { PixelFlag } from "@/components/PixelFlag"

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

  // Load all pools the user is in (for the pool picker)
  const myPools = await prisma.poolMembership.findMany({
    where: { userId: session.user.id },
    include: { pool: { select: { id: true, name: true } } },
    orderBy: { joinedAt: "asc" },
  })

  // Members to show depends on active pool
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

  const viewUser = viewUserId !== session.user.id
    ? poolMembers.find(m => m.userId === viewUserId)?.user
    : null

  const now = new Date()
  const myPredCount = myPredictions.length

  return (
    <div>
      {/* Header */}
      <div className="pixel-card mb-5 p-4" style={{ background: "#0a3d1f" }}>
        <h1 className="font-pixel text-white mb-1" style={{ fontSize: "9px" }}>⚽ DE WEDSTRIJDEN</h1>
        <p className="text-green-300 text-xs">
          Jouw voorspellingen gelden voor <strong className="text-yellow-300">alle poules tegelijk</strong> —
          je vult ze maar één keer in.
          {myPredCount > 0 && <span className="ml-1 text-green-400">({myPredCount} ingevuld)</span>}
        </p>
      </div>

      {/* Pool picker voor anderen bekijken */}
      {myPools.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-bold text-gray-400 uppercase mb-2 font-pixel" style={{ fontSize: "7px" }}>
            Bekijk voorspellingen van:
          </p>
          <div className="flex gap-2 flex-wrap">
            <Link
              href={`/predictions?stage=${stage}&pool=${activePoolId ?? ""}&view=${session.user.id}`}
              className={`px-3 py-1.5 text-xs font-bold transition-all ${
                viewUserId === session.user.id ? "pixel-tab-active" : "pixel-tab-inactive"
              }`}
              style={{ fontFamily: "var(--font-pixel), monospace", fontSize: "7px" }}
            >
              🙋 Mijn picks
            </Link>

            {/* Pool selector */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {myPools.map(({ pool }) => (
                <Link
                  key={pool.id}
                  href={`/predictions?stage=${stage}&pool=${pool.id}&view=${activePoolId === pool.id ? viewUserId : session.user.id}`}
                  className={`px-2.5 py-1.5 text-xs font-bold transition-all ${
                    activePoolId === pool.id ? "pixel-tab-active" : "pixel-tab-inactive"
                  }`}
                  style={{ fontFamily: "var(--font-pixel), monospace", fontSize: "7px" }}
                >
                  {pool.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Members of active pool */}
          {activePoolId && poolMembers.length > 0 && (
            <div className="flex gap-2 flex-wrap mt-2 pl-2 border-l-4" style={{ borderColor: "#FF6200" }}>
              {poolMembers
                .filter(m => m.userId !== session.user.id)
                .map(m => (
                  <Link
                    key={m.userId}
                    href={`/predictions?stage=${stage}&pool=${activePoolId}&view=${m.userId}`}
                    className={`px-2.5 py-1 text-xs font-bold transition-all ${
                      viewUserId === m.userId ? "pixel-tab-active" : "pixel-tab-inactive"
                    }`}
                    style={{ fontFamily: "var(--font-pixel), monospace", fontSize: "7px" }}
                  >
                    {m.user.name}
                  </Link>
                ))}
            </div>
          )}
        </div>
      )}

      {/* Stage tabs */}
      <div className="flex gap-1.5 flex-wrap mb-5">
        {STAGE_ORDER.map((s) => (
          <Link
            key={s}
            href={`/predictions?stage=${s}${activePoolId ? `&pool=${activePoolId}` : ""}${viewUserId !== session.user.id ? `&view=${viewUserId}` : ""}`}
            className={`px-3 py-1.5 text-xs font-bold ${stage === s ? "pixel-tab-active" : "pixel-tab-inactive"}`}
            style={{ fontFamily: "var(--font-pixel), monospace", fontSize: "7px" }}
          >
            {STAGE_LABELS[s]}
          </Link>
        ))}
      </div>

      {viewUser && (
        <div className="mb-4 px-3 py-2 text-xs font-bold" style={{ background: "#FFD700", border: "2px solid #1a1a2e", color: "#1a1a2e" }}>
          👁 Je bekijkt de picks van <strong>{viewUser.name}</strong>
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
              <div key={match.id} className="pixel-card p-4 rounded-none">
                {/* Match header */}
                <div className="flex items-center justify-between mb-3 text-xs text-gray-400">
                  <span>
                    {match.groupName && <span className="mr-1 font-bold">{match.groupName} ·</span>}
                    {new Date(match.kickoff).toLocaleString("nl-NL", {
                      weekday: "short", day: "numeric", month: "short",
                      hour: "2-digit", minute: "2-digit",
                    })}
                  </span>
                  <span className={`text-xs font-bold ${locked ? "text-red-400" : "text-green-400"}`}>
                    {locked ? "🔒 VERGRENDELD" : `Sluit: ${deadline.toLocaleString("nl-NL", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}`}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {/* Thuis */}
                  <div className="flex-1 flex items-center gap-2">
                    {match.homeTeam?.code && <PixelFlag code={match.homeTeam.code} size="md" />}
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
                    {match.awayTeam?.code && <PixelFlag code={match.awayTeam.code} size="md" />}
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
                  <div className="mt-3 pt-3 border-t-2 border-gray-100 flex items-center justify-center gap-3 text-sm">
                    {isOwnView && myPred && (
                      <span className="text-xs text-gray-400">Jouw pick (vergrendeld):</span>
                    )}
                    {viewPred ? (
                      <>
                        {!isOwnView && <span className="text-gray-500 text-xs">Voorspelling:</span>}
                        <span className="font-pixel" style={{ color: "#FF6200", fontSize: "11px" }}>
                          {viewPred.homeScore} – {viewPred.awayScore}
                        </span>
                        {viewPred.pointsAwarded !== null && (
                          <span className="font-pixel text-xs px-2 py-0.5" style={{ background: viewPred.pointsAwarded > 0 ? "#16a34a" : "#6b7280", color: "white" }}>
                            +{viewPred.pointsAwarded}pt
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-gray-400 italic text-xs">Geen voorspelling</span>
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
