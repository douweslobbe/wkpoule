import { redirect } from "next/navigation"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { SyncButton } from "./SyncButton"
import { RecalcButton } from "./RecalcButton"

export default async function AdminPage() {
  const session = await auth()
  if (!session?.user?.isAdmin) redirect("/dashboard")

  const [matchCount, teamCount, userCount, poolCount] = await Promise.all([
    prisma.match.count(),
    prisma.team.count(),
    prisma.user.count(),
    prisma.pool.count(),
  ])

  const recentMatches = await prisma.match.findMany({
    where: { status: "FINISHED" },
    include: { homeTeam: true, awayTeam: true },
    orderBy: { kickoff: "desc" },
    take: 10,
  })

  const pools = await prisma.pool.findMany({
    include: { _count: { select: { memberships: true } } },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Admin Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Wedstrijden", value: matchCount },
          { label: "Teams", value: teamCount },
          { label: "Gebruikers", value: userCount },
          { label: "Poules", value: poolCount },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <div className="text-3xl font-bold text-orange-500">{s.value}</div>
            <div className="text-sm text-gray-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Acties */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 mb-6">
        <h2 className="font-semibold text-gray-900 mb-4">Acties</h2>
        <div className="flex gap-3 flex-wrap">
          <SyncButton />
          <RecalcButton />
        </div>
        <p className="text-xs text-gray-400 mt-3">
          Sync haalt teams en wedstrijden op van football-data.org. Herberekening herberekent alle punten.
        </p>
      </div>

      {/* Poules */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-6">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Poules</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {pools.map((pool) => (
            <div key={pool.id} className="flex items-center px-5 py-3 gap-3">
              <div className="flex-1">
                <span className="font-medium text-gray-800">{pool.name}</span>
                <span className="ml-2 font-mono text-xs text-gray-400">{pool.inviteCode}</span>
              </div>
              <span className="text-sm text-gray-500">{pool._count.memberships} leden</span>
              <Link
                href={`/admin/pools/${pool.id}/bonus`}
                className="text-sm text-orange-600 hover:underline"
              >
                Bonusvragen
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* Recente wedstrijden */}
      {recentMatches.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Recente uitslagen</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {recentMatches.map((m) => (
              <div key={m.id} className="flex items-center px-5 py-2.5 gap-3 text-sm">
                <span className="flex-1 text-gray-700">
                  {m.homeTeam?.nameNl ?? m.homeTeam?.name ?? "TBD"}
                </span>
                <span className="font-semibold">
                  {m.homeScore} – {m.awayScore}
                </span>
                <span className="flex-1 text-right text-gray-700">
                  {m.awayTeam?.nameNl ?? m.awayTeam?.name ?? "TBD"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
