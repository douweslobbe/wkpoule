import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ChampionForm } from "./ChampionForm"

const TOURNAMENT_START = new Date("2026-06-11T20:00:00Z")

export default async function ChampionPage({ params }: { params: Promise<{ poolId: string }> }) {
  const { poolId } = await params
  const session = await auth()
  if (!session?.user) redirect("/login")

  const membership = await prisma.poolMembership.findUnique({
    where: { userId_poolId: { userId: session.user.id, poolId } },
    include: { pool: true },
  })
  if (!membership) notFound()

  const teams = await prisma.team.findMany({ orderBy: { name: "asc" } })
  const myPick = await prisma.championPick.findUnique({
    where: { userId_poolId: { userId: session.user.id, poolId } },
    include: { team: true },
  })

  const locked = new Date() > TOURNAMENT_START

  // Show all picks after tournament start
  const allPicks = locked
    ? await prisma.championPick.findMany({
        where: { poolId },
        include: {
          team: true,
          user: { select: { name: true } },
        },
      })
    : []

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <Link href={`/pools/${poolId}`} className="text-sm text-gray-500 hover:text-gray-700">
          ← {membership.pool.name}
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Kampioen kiezen</h1>
      </div>

      <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 mb-5 text-sm text-orange-800">
        <strong>15 punten</strong> voor de juiste kampioen. Deadline:{" "}
        <strong>
          {TOURNAMENT_START.toLocaleString("nl-NL", {
            weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit",
          })}
        </strong>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 mb-5">
        {locked ? (
          <div className="text-center">
            <div className="text-4xl mb-2">🔒</div>
            <p className="text-gray-600 font-medium">Termijn verlopen</p>
            {myPick && (
              <div className="mt-3 flex items-center justify-center gap-2">
                {myPick.team.flagUrl && (
                  <img src={myPick.team.flagUrl} alt="" className="w-8 h-6 object-contain" />
                )}
                <span className="font-semibold text-orange-700">
                  {myPick.team.nameNl ?? myPick.team.name}
                </span>
                {myPick.pointsAwarded !== null && (
                  <span className={`text-sm font-semibold px-2 py-0.5 rounded-full ${
                    myPick.pointsAwarded > 0 ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                  }`}>
                    {myPick.pointsAwarded > 0 ? `+${myPick.pointsAwarded} pt` : "0 pt"}
                  </span>
                )}
              </div>
            )}
          </div>
        ) : (
          <ChampionForm
            poolId={poolId}
            teams={teams.map((t) => ({
              id: t.id,
              name: t.nameNl ?? t.name,
              code: t.code,
              flagUrl: t.flagUrl ?? undefined,
            }))}
            currentTeamId={myPick?.teamId}
          />
        )}
      </div>

      {/* Anderen hun picks (na deadline) */}
      {locked && allPicks.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800">Alle picks</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {allPicks.map((pick) => (
              <div key={pick.id} className="flex items-center gap-3 px-5 py-3">
                {pick.team.flagUrl && (
                  <img src={pick.team.flagUrl} alt="" className="w-7 h-5 object-contain" />
                )}
                <span className="flex-1 text-gray-700 text-sm">{pick.user.name}</span>
                <span className="font-medium text-gray-900 text-sm">
                  {pick.team.nameNl ?? pick.team.name}
                </span>
                {pick.pointsAwarded !== null && (
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    pick.pointsAwarded! > 0 ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                  }`}>
                    {pick.pointsAwarded! > 0 ? `+${pick.pointsAwarded}` : "0"}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
