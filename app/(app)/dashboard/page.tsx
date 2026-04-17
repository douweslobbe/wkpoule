import { redirect } from "next/navigation"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const pools = await prisma.poolMembership.findMany({
    where: { userId: session.user.id },
    include: {
      pool: {
        include: {
          _count: { select: { memberships: true } },
          leaderboard: {
            where: { userId: session.user.id },
            take: 1,
          },
        },
      },
    },
    orderBy: { joinedAt: "asc" },
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Welkom, {session.user.name}! 👋
        </h1>
      </div>

      {pools.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-10 text-center">
          <div className="text-5xl mb-4">⚽</div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Nog geen poules</h2>
          <p className="text-gray-500 mb-6">
            Maak een nieuwe poule aan of doe mee via een uitnodigingscode.
          </p>
          <div className="flex gap-3 justify-center">
            <Link
              href="/pools/new"
              className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-5 py-2.5 rounded-lg transition-colors"
            >
              Poule aanmaken
            </Link>
            <Link
              href="/pools/join"
              className="bg-white hover:bg-gray-50 text-gray-700 font-semibold px-5 py-2.5 rounded-lg border border-gray-300 transition-colors"
            >
              Meedoen met code
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-6">
            {pools.map(({ pool, role }) => {
              const entry = pool.leaderboard[0]
              return (
                <Link
                  key={pool.id}
                  href={`/pools/${pool.id}`}
                  className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold text-gray-900 text-lg leading-tight">{pool.name}</h3>
                    {role === "ADMIN" && (
                      <span className="text-xs bg-orange-100 text-orange-700 rounded px-1.5 py-0.5 font-medium ml-2 shrink-0">
                        Admin
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>{pool._count.memberships} deelnemers</span>
                    {entry && (
                      <span className="font-semibold text-orange-600">{entry.totalPoints} punten</span>
                    )}
                  </div>
                </Link>
              )
            })}

            <Link
              href="/pools/new"
              className="bg-white rounded-2xl shadow-sm border-2 border-dashed border-gray-300 p-5 hover:border-orange-400 hover:bg-orange-50 transition-colors flex items-center justify-center gap-2 text-gray-500 hover:text-orange-600"
            >
              <span className="text-2xl">+</span>
              <span className="font-medium">Nieuwe poule</span>
            </Link>
          </div>

          <div className="text-center">
            <Link href="/pools/join" className="text-sm text-orange-600 hover:underline">
              Meedoen met een bestaande poule via uitnodigingscode
            </Link>
          </div>
        </>
      )}
    </div>
  )
}
