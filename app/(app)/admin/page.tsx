import { redirect } from "next/navigation"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { SyncButton } from "./SyncButton"
import { RecalcButton } from "./RecalcButton"
import { ResetPasswordForm } from "./ResetPasswordForm"

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="pixel-card p-4 text-center">
      <div className="font-pixel" style={{ fontSize: "24px", color: "#FF6200", lineHeight: 1.2 }}>
        {value}
      </div>
      <div className="font-pixel mt-2" style={{ fontSize: "7px", color: "var(--c-text-3)" }}>
        {label.toUpperCase()}
      </div>
    </div>
  )
}

export default async function AdminPage() {
  const session = await auth()
  if (!session?.user?.isAdmin) redirect("/dashboard")

  const [matchCount, teamCount, userCount, poolCount] = await Promise.all([
    prisma.match.count(),
    prisma.team.count(),
    prisma.user.count(),
    prisma.pool.count(),
  ])

  const stageGroups = await prisma.match.groupBy({
    by: ["stage"],
    _count: { stage: true },
    orderBy: { stage: "asc" },
  })

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

  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, isAdmin: true },
    orderBy: { name: "asc" },
  })

  return (
    <div>
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <Link href="/dashboard" className="font-pixel" style={{ fontSize: "7px", color: "#7070a0" }}>
          ◄ DASHBOARD
        </Link>
        <h1 className="font-pixel text-white" style={{ fontSize: "10px" }}>⚙ ADMIN</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatCard label="Wedstrijden" value={matchCount} />
        <StatCard label="Teams"       value={teamCount} />
        <StatCard label="Gebruikers"  value={userCount} />
        <StatCard label="Pools"      value={poolCount} />
      </div>

      {/* Acties */}
      <div className="pixel-card overflow-hidden mb-5">
        <div className="px-5 py-3" style={{ background: "#0a3d1f", borderBottom: "3px solid #000" }}>
          <h2 className="font-pixel text-white" style={{ fontSize: "9px" }}>⟳ SYNCHRONISATIE & HERBEREKENING</h2>
        </div>
        <div className="p-5">
          <div className="flex gap-3 flex-wrap mb-4">
            <SyncButton />
            <RecalcButton />
          </div>
          <p className="font-pixel" style={{ fontSize: "7px", color: "var(--c-text-4)" }}>
            Sync haalt teams en wedstrijden op van football-data.org (cooldown 60s).
            Herberekening herberekent alle punten op basis van bekende uitslagen.
          </p>

          {/* Stage debug */}
          <div className="mt-4 pt-4" style={{ borderTop: "2px solid var(--c-border)" }}>
            <p className="font-pixel mb-2" style={{ fontSize: "7px", color: "var(--c-text-3)" }}>
              WEDSTRIJDEN PER FASE (na sync):
            </p>
            <div className="flex gap-2 flex-wrap">
              {stageGroups.map((s) => (
                <span
                  key={s.stage}
                  className="font-pixel px-2 py-1"
                  style={{
                    fontSize: "7px",
                    background: "var(--c-surface-alt)",
                    color: "var(--c-text-2)",
                    border: "1px solid var(--c-border)",
                  }}
                >
                  {s.stage}: <strong style={{ color: "#FFD700" }}>{s._count.stage}</strong>
                </span>
              ))}
            </div>
            {stageGroups.find((s) => s.stage === "GROUP" && s._count.stage > 80) && (
              <p className="font-pixel mt-2" style={{ fontSize: "7px", color: "#ff4444" }}>
                ⚠ Te veel wedstrijden in GROUP — stage-mapping issue. Klik Sync om opnieuw te synchroniseren.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Pools */}
      <div className="pixel-card overflow-hidden mb-5">
        <div className="px-5 py-3" style={{ background: "#0a3d1f", borderBottom: "3px solid #000" }}>
          <h2 className="font-pixel text-white" style={{ fontSize: "9px" }}>🏆 POOLS</h2>
        </div>
        <div>
          {pools.map((pool) => (
            <div
              key={pool.id}
              className="flex items-center gap-3 px-5 py-3"
              style={{ borderBottom: "2px solid var(--c-border)" }}
            >
              <div className="flex-1">
                <span className="font-bold text-sm" style={{ color: "var(--c-text)" }}>{pool.name}</span>
                <span className="ml-2 font-pixel" style={{ fontSize: "7px", color: "var(--c-text-4)" }}>
                  {pool.inviteCode}
                </span>
              </div>
              <span className="font-pixel" style={{ fontSize: "7px", color: "var(--c-text-3)" }}>
                {pool._count.memberships} leden
              </span>
              <Link
                href={`/admin/pools/${pool.id}/bonus`}
                className="font-pixel px-2 py-1"
                style={{ fontSize: "7px", color: "#FF6200", border: "1px solid #FF6200" }}
              >
                BONUSVRAGEN
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* Gebruikers + wachtwoord reset */}
      <div className="pixel-card overflow-hidden mb-5">
        <div className="px-5 py-3" style={{ background: "#0a3d1f", borderBottom: "3px solid #000" }}>
          <h2 className="font-pixel text-white" style={{ fontSize: "9px" }}>👤 GEBRUIKERS & WACHTWOORD RESET</h2>
        </div>
        <div>
          {users.map((user) => (
            <div
              key={user.id}
              className="flex items-center gap-3 px-5 py-3 flex-wrap"
              style={{ borderBottom: "2px solid var(--c-border)" }}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span style={{ color: "var(--c-text)", fontSize: "9px" }}>{user.name}</span>
                  {user.isAdmin && (
                    <span className="font-pixel px-1" style={{ fontSize: "6px", background: "#FFD700", color: "#000" }}>
                      ADMIN
                    </span>
                  )}
                </div>
                <div style={{ color: "var(--c-text-4)", fontSize: "8px" }}>{user.email}</div>
              </div>
              <ResetPasswordForm userId={user.id} />
            </div>
          ))}
        </div>
      </div>

      {/* Recente uitslagen */}
      {recentMatches.length > 0 && (
        <div className="pixel-card overflow-hidden">
          <div className="px-5 py-3" style={{ background: "#0a3d1f", borderBottom: "3px solid #000" }}>
            <h2 className="font-pixel text-white" style={{ fontSize: "9px" }}>⚽ RECENTE UITSLAGEN</h2>
          </div>
          <div>
            {recentMatches.map((m) => (
              <div
                key={m.id}
                className="flex items-center gap-3 px-5 py-2.5"
                style={{ borderBottom: "2px solid var(--c-border)", fontSize: "9px" }}
              >
                <span className="flex-1 text-right" style={{ color: "var(--c-text)" }}>
                  {m.homeTeam?.nameNl ?? m.homeTeam?.name ?? "TBD"}
                </span>
                <span className="font-pixel shrink-0" style={{ color: "#FFD700", fontSize: "10px" }}>
                  {m.homeScore} – {m.awayScore}
                </span>
                <span className="flex-1" style={{ color: "var(--c-text)" }}>
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
