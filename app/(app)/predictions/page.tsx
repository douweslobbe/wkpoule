import { redirect } from "next/navigation"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { MatchStage } from "@prisma/client"
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
  const myPredCount = myPredictions.length

  // Gebruik eerste pool als geen pool geselecteerd
  const navPoolId = activePoolId ?? myPools[0]?.pool.id ?? ""

  return (
    <div>
      {/* Pool navigatie tabs — altijd zichtbaar */}
      {navPoolId && <PoolSubNav poolId={navPoolId} />}

      {/* Poule-kiezer voor anderen bekijken */}
      {myPools.length > 0 && (
        <div className="mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold shrink-0" style={{ fontFamily: "var(--font-pixel)", fontSize: "7px", color: "#555577" }}>
              BEKIJK:
            </span>
            <Link
              href={`/predictions?stage=${stage}${activePoolId ? `&pool=${activePoolId}` : ""}&view=${session.user.id}`}
              className={`px-2.5 py-1 text-xs font-bold transition-all ${
                viewUserId === session.user.id ? "pixel-tab-active" : "pixel-tab-inactive"
              }`}
              style={{ fontFamily: "var(--font-pixel), monospace", fontSize: "7px" }}
            >
              🙋 Mijn picks
            </Link>

            {myPools.map(({ pool }) => (
              <span key={pool.id} className="flex items-center gap-1">
                <Link
                  href={`/predictions?stage=${stage}&pool=${pool.id}&view=${session.user.id}`}
                  className={`px-2 py-1 text-xs font-bold transition-all ${
                    activePoolId === pool.id ? "pixel-tab-active" : "pixel-tab-inactive"
                  }`}
                  style={{ fontFamily: "var(--font-pixel), monospace", fontSize: "7px" }}
                >
                  {pool.name}
                </Link>
                {/* Leden van deze poule */}
                {activePoolId === pool.id &&
                  poolMembers
                    .filter((m) => m.userId !== session.user.id)
                    .map((m) => (
                      <Link
                        key={m.userId}
                        href={`/predictions?stage=${stage}&pool=${pool.id}&view=${m.userId}`}
                        className={`px-2 py-1 text-xs font-bold transition-all ${
                          viewUserId === m.userId ? "pixel-tab-active" : "pixel-tab-inactive"
                        }`}
                        style={{ fontFamily: "var(--font-pixel), monospace", fontSize: "7px" }}
                      >
                        {m.user.name}
                      </Link>
                    ))}
              </span>
            ))}
          </div>

          {viewUser && (
            <div className="mt-2 px-2 py-1 font-bold inline-block" style={{ background: "#1a1200", border: "2px solid #FFD700", color: "#FFD700", fontSize: "11px", boxShadow: "2px 2px 0 #000" }}>
              👁 Picks van {viewUser.name}
            </div>
          )}
        </div>
      )}

      {/* Fase-tabs */}
      <div className="flex gap-1.5 flex-wrap mb-4">
        {STAGE_ORDER.map((s) => (
          <Link
            key={s}
            href={`/predictions?stage=${s}${activePoolId ? `&pool=${activePoolId}` : ""}${viewUserId !== session.user.id ? `&view=${viewUserId}` : ""}`}
            className={`px-2.5 py-1.5 text-xs font-bold ${stage === s ? "pixel-tab-active" : "pixel-tab-inactive"}`}
            style={{ fontFamily: "var(--font-pixel), monospace", fontSize: "7px" }}
          >
            {STAGE_LABELS[s]}
          </Link>
        ))}
      </div>

      {/* Wedstrijdlijst */}
      {matches.length === 0 ? (
        <div className="pixel-card p-8 text-center text-sm" style={{ color: "#444466" }}>
          Nog geen wedstrijden gepland voor deze ronde.
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
                  } : undefined}
                  viewPred={viewPred ? {
                    homeScore: viewPred.homeScore,
                    awayScore: viewPred.awayScore,
                    pointsAwarded: viewPred.pointsAwarded,
                  } : undefined}
                  isOwnView={isOwnView}
                  locked={locked}
                />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
