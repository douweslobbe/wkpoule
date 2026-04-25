import { redirect } from "next/navigation"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { UserBadges } from "@/components/UserBadges"
import { ACHIEVEMENT_DEFS } from "@/lib/achievements"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Mijn Profiel — WK Pool 2026" }

export default async function ProfilePage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  // Voorlopige cijfers — voorproefje van wat hier ooit komt
  const [memberships, allAchievements, jokerCount, totalPredictions, exactCount] = await Promise.all([
    prisma.poolMembership.findMany({
      where: { userId: session.user.id },
      include: { pool: { select: { id: true, name: true } } },
    }),
    prisma.achievement.findMany({ where: { userId: session.user.id } }),
    prisma.prediction.count({ where: { userId: session.user.id, isJoker: true } }),
    prisma.prediction.count({ where: { userId: session.user.id } }),
    prisma.prediction.findMany({
      where: { userId: session.user.id, pointsAwarded: { not: null } },
      include: { match: { select: { homeScore: true, awayScore: true } } },
    }).then((preds) =>
      preds.filter((p) => p.match.homeScore === p.homeScore && p.match.awayScore === p.awayScore).length
    ),
  ])

  // Unieke achievement types (cross-pool)
  const uniqueAchievementTypes = Array.from(new Set(allAchievements.map((a) => a.type)))
  const previewAchievements = uniqueAchievementTypes.map((type) => ({ type }))

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <Link href="/dashboard" className="font-pixel" style={{ fontSize: "7px", color: "#7070a0" }}>
          ◄ DASHBOARD
        </Link>
        <h1 className="font-pixel text-white" style={{ fontSize: "10px" }}>MIJN PROFIEL</h1>
      </div>

      {/* Profielkop */}
      <div className="pixel-card p-5 mb-5 flex items-center gap-4 flex-wrap" style={{ borderLeft: "4px solid #FF6200" }}>
        <div
          className="font-pixel flex items-center justify-center shrink-0"
          style={{
            width: "56px",
            height: "56px",
            background: "#FF6200",
            color: "#000",
            border: "3px solid #000",
            boxShadow: "3px 3px 0 #000",
            fontSize: "20px",
          }}
        >
          {session.user.name?.charAt(0).toUpperCase() ?? "?"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-pixel" style={{ fontSize: "11px", color: "var(--c-text)", lineHeight: "1.6" }}>
            {session.user.name?.toUpperCase()}
          </div>
          <div className="font-pixel mt-1" style={{ fontSize: "7px", color: "var(--c-text-3)" }}>
            {session.user.email}
          </div>
          <div className="mt-2">
            <UserBadges achievements={previewAchievements} jokerCount={jokerCount} size="md" max={10} />
          </div>
        </div>
      </div>

      {/* Under construction banner */}
      <div className="pixel-card overflow-hidden mb-5" style={{ background: "#1a1200" }}>
        <div className="construction-tape" />
        <div className="px-5 py-3" style={{ background: "#2a1500", borderBottom: "3px solid #000" }}>
          <h2 className="font-pixel" style={{ fontSize: "9px", color: "#FFD700" }}>🚧 UNDER CONSTRUCTION 🚧</h2>
        </div>
        <div className="p-6 text-center space-y-3">
          <div className="text-5xl" style={{ filter: "drop-shadow(2px 2px 0 #000)" }}>👷‍♂️ ⚒️ 🚧</div>
          <p className="font-pixel" style={{ fontSize: "9px", color: "#FFD700", lineHeight: "2" }}>
            HIER KOMT JE PERSOONLIJKE PAGINA
          </p>
          <p className="font-pixel" style={{ fontSize: "8px", color: "var(--c-text-2)", lineHeight: "2" }}>
            Na het WK 2026 wordt deze pagina je <span style={{ color: "#FFD700" }}>persoonlijke trofeekast</span>:
            badges over alle pools heen, statistieken, hoogtepunten,
            en je geschiedenis voor toekomstige toernooien.
          </p>
          <p className="font-pixel" style={{ fontSize: "7px", color: "var(--c-text-4)", lineHeight: "1.9" }}>
            Voor nu kun je hieronder een voorproefje zien.
          </p>
        </div>
        <div className="construction-tape" />
      </div>

      {/* Voorproefje stats */}
      <div className="grid sm:grid-cols-2 gap-3 mb-5">
        <div className="pixel-card p-4 flex items-center gap-3">
          <span style={{ fontSize: "24px" }}>🎯</span>
          <div>
            <div className="font-pixel" style={{ fontSize: "7px", color: "var(--c-text-3)" }}>VOORSPELLINGEN</div>
            <div className="font-pixel" style={{ fontSize: "13px", color: "#FFD700" }}>{totalPredictions}</div>
          </div>
        </div>
        <div className="pixel-card p-4 flex items-center gap-3">
          <span style={{ fontSize: "24px" }}>💥</span>
          <div>
            <div className="font-pixel" style={{ fontSize: "7px", color: "var(--c-text-3)" }}>EXACT GOED</div>
            <div className="font-pixel" style={{ fontSize: "13px", color: "#4af56a" }}>{exactCount}</div>
          </div>
        </div>
        <div className="pixel-card p-4 flex items-center gap-3">
          <span style={{ fontSize: "24px" }}>★</span>
          <div>
            <div className="font-pixel" style={{ fontSize: "7px", color: "var(--c-text-3)" }}>JOKERS INGEZET</div>
            <div className="font-pixel" style={{ fontSize: "13px", color: "#FFD700" }}>{jokerCount}</div>
          </div>
        </div>
        <div className="pixel-card p-4 flex items-center gap-3">
          <span style={{ fontSize: "24px" }}>🏅</span>
          <div>
            <div className="font-pixel" style={{ fontSize: "7px", color: "var(--c-text-3)" }}>UNIEKE BADGES</div>
            <div className="font-pixel" style={{ fontSize: "13px", color: "#FFD700" }}>
              {uniqueAchievementTypes.length}<span style={{ color: "var(--c-text-5)", fontSize: "9px" }}>/{Object.keys(ACHIEVEMENT_DEFS).length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Pools overzicht */}
      <div className="pixel-card overflow-hidden mb-5">
        <div className="px-5 py-3" style={{ background: "#0a3d1f", borderBottom: "3px solid #000" }}>
          <h2 className="font-pixel text-white" style={{ fontSize: "9px" }}>👥 MIJN POOLS</h2>
        </div>
        {memberships.length === 0 ? (
          <p className="text-center py-6 font-pixel" style={{ fontSize: "8px", color: "var(--c-text-4)" }}>
            Je doet nog niet mee in een pool
          </p>
        ) : (
          memberships.map((m) => (
            <Link
              key={m.poolId}
              href={`/pools/${m.poolId}`}
              className="flex items-center justify-between px-5 py-3"
              style={{ borderBottom: "1px solid var(--c-border)" }}
            >
              <span className="font-pixel" style={{ fontSize: "9px", color: "var(--c-text)" }}>
                {m.pool.name}
              </span>
              <span className="font-pixel" style={{ fontSize: "7px", color: m.role === "ADMIN" ? "#FFD700" : "var(--c-text-4)" }}>
                {m.role === "ADMIN" ? "★ ADMIN" : "LID"} →
              </span>
            </Link>
          ))
        )}
      </div>

      {/* Roadmap / coming soon */}
      <div className="pixel-card overflow-hidden mb-5">
        <div className="px-5 py-3" style={{ background: "#0d1a10", borderBottom: "3px solid #000" }}>
          <h2 className="font-pixel text-white" style={{ fontSize: "9px" }}>🗺 WAT KOMT ER NOG?</h2>
          <p className="mt-1 font-pixel" style={{ fontSize: "7px", color: "#4af56a" }}>Na het WK 2026 toegevoegd</p>
        </div>
        <div className="p-5 space-y-2.5" style={{ fontSize: "8px", lineHeight: "2", color: "var(--c-text-2)", fontFamily: "var(--font-pixel), monospace" }}>
          <div>○ Hall of Fame met al je badges (ook van vorige toernooien)</div>
          <div>○ Persoonlijke statistieken: gemiddeld verschil, favoriete uitslag, beste streak</div>
          <div>○ Head-to-head vergelijking met poolgenoten</div>
          <div>○ Hoogtepunten van het toernooi (top exacte voorspellingen)</div>
          <div>○ Toernooi-archief: terugblik op vorige WK&apos;s en EK&apos;s</div>
          <div>○ Avatar / profielfoto kiezen</div>
          <div>○ Trofeeën-kast voor pool-winsten</div>
        </div>
      </div>

      <div className="text-center py-2">
        <Link href="/dashboard" className="font-pixel" style={{ fontSize: "7px", color: "#7070a0" }}>
          ◄ TERUG NAAR DASHBOARD
        </Link>
      </div>
    </div>
  )
}
