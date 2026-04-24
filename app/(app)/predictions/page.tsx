import { redirect } from "next/navigation"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { MatchStage } from "@prisma/client"
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
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-pixel shrink-0" style={{ fontSize: "7px", color: "var(--c-text-4)" }}>BEKIJK:</span>
            <Link
              href={`/predictions?stage=${stage}&pool=${activePoolId}&view=${session.user.id}`}
              className={`px-2.5 py-1 text-xs font-bold transition-all ${viewUserId === session.user.id ? "pixel-tab-active" : "pixel-tab-inactive"}`}
              style={{ fontFamily: "var(--font-pixel), monospace", fontSize: "7px" }}
            >
              🙋 Mijn picks
            </Link>
            {poolMembers
              .filter((m) => m.userId !== session.user.id)
              .map((m) => (
                <Link
                  key={m.userId}
                  href={`/predictions?stage=${stage}&pool=${activePoolId}&view=${m.userId}`}
                  className={`px-2 py-1 text-xs font-bold transition-all ${viewUserId === m.userId ? "pixel-tab-active" : "pixel-tab-inactive"}`}
                  style={{ fontFamily: "var(--font-pixel), monospace", fontSize: "7px" }}
                >
                  {m.user.name}
                </Link>
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
