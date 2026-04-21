import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ChampionForm } from "./ChampionForm"
import { PixelFlag } from "@/components/PixelFlag"

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

  const allPicks = locked
    ? await prisma.championPick.findMany({
        where: { poolId },
        include: { team: true, user: { select: { name: true } } },
      })
    : []

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <Link href={`/pools/${poolId}`} className="font-pixel" style={{ fontSize: "7px", color: "#7070a0" }}>
          ◄ {membership.pool.name.toUpperCase()}
        </Link>
        <h1 className="font-pixel text-white" style={{ fontSize: "10px" }}>KAMPIOEN KIEZEN</h1>
      </div>

      <div className="pixel-card p-4 mb-5" style={{ background: "#1a1200", borderLeft: "4px solid #FFD700" }}>
        <p style={{ color: "#9999cc", fontSize: "8px", fontFamily: "var(--font-pixel), monospace", lineHeight: "2" }}>
          <span style={{ color: "#FFD700", fontWeight: "bold" }}>15 punten</span> voor de juiste kampioen · Deadline:{" "}
          <span style={{ color: "#FF6200", fontWeight: "bold" }}>
            {TOURNAMENT_START.toLocaleString("nl-NL", {
              weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit",
            })}
          </span>
        </p>
      </div>

      <div className="pixel-card overflow-hidden mb-5">
        <div className="px-5 py-3" style={{ background: "#1a1200", borderBottom: "3px solid #000" }}>
          <h2 className="font-pixel" style={{ fontSize: "9px", color: "#FFD700" }}>🏆 JOUW KEUZE</h2>
        </div>
        <div className="p-5">
          {locked ? (
            <div className="text-center">
              <div className="text-4xl mb-3">🔒</div>
              <p className="font-pixel" style={{ fontSize: "8px", color: "#555577" }}>TERMIJN VERLOPEN</p>
              {myPick && (
                <div className="mt-4 flex items-center justify-center gap-3 p-3" style={{
                  background: "#1e1200", border: "2px solid #FF6200",
                }}>
                  <PixelFlag code={myPick.team.code} size="md" />
                  <span className="font-pixel" style={{ fontSize: "9px", color: "#FF6200" }}>
                    {myPick.team.nameNl ?? myPick.team.name}
                  </span>
                  {myPick.pointsAwarded !== null && (
                    <span className={myPick.pointsAwarded > 0 ? "pixel-badge-green" : "pixel-badge-gray"}>
                      {myPick.pointsAwarded > 0 ? `+${myPick.pointsAwarded} pt` : "0 pt"}
                    </span>
                  )}
                </div>
              )}
            </div>
          ) : (
            <ChampionForm
              poolId={poolId}
              teams={teams.map((t) => ({ id: t.id, name: t.nameNl ?? t.name, code: t.code, flagUrl: t.flagUrl ?? undefined }))}
              currentTeamId={myPick?.teamId}
            />
          )}
        </div>
      </div>

      {locked && allPicks.length > 0 && (
        <div className="pixel-card overflow-hidden">
          <div className="px-5 py-3" style={{ background: "#0a3d1f", borderBottom: "3px solid #000" }}>
            <h2 className="font-pixel text-white" style={{ fontSize: "9px" }}>ALLE PICKS</h2>
          </div>
          <div>
            {allPicks.map((pick) => (
              <div key={pick.id} className="flex items-center gap-3 px-5 py-3" style={{ borderBottom: "1px solid #1a1d30" }}>
                <PixelFlag code={pick.team.code} size="sm" />
                <span className="flex-1" style={{ color: "#8888aa", fontSize: "9px" }}>{pick.user.name}</span>
                <span className="font-bold" style={{ color: "#e0e0f0", fontSize: "9px" }}>
                  {pick.team.nameNl ?? pick.team.name}
                </span>
                {pick.pointsAwarded !== null && (
                  <span className={pick.pointsAwarded! > 0 ? "pixel-badge-green" : "pixel-badge-gray"}>
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
