import { redirect } from "next/navigation"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getActiveSurvivorRound, getRoundDeadline, ROUND_LABELS } from "@/lib/survivor"
import { FANTASY_DEADLINE, FANTASY_ROUND_LABELS, type FantasyRound } from "@/lib/fantasy"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Dashboard — WK Pool 2026" }

const TOTAL_MATCHES = 104

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const now = new Date()

  // === POOLS ===
  const memberships = await prisma.poolMembership.findMany({
    where: { userId: session.user.id },
    include: {
      pool: {
        include: {
          _count: { select: { memberships: true } },
          leaderboard: { orderBy: { totalPoints: "desc" } },
        },
      },
    },
    orderBy: { joinedAt: "asc" },
  })

  const completedMatches = await prisma.match.count({ where: { status: "FINISHED" } })
  const totalMatches = await prisma.match.count()

  // === SURVIVOR ===
  const survivorEntry = await prisma.survivorEntry.findUnique({
    where: { userId: session.user.id },
    include: { picks: { include: { team: { select: { nameNl: true, name: true, flagUrl: true } } } } },
  })

  const activeRound = await getActiveSurvivorRound()
  const survivorDeadline = activeRound ? await getRoundDeadline(activeRound) : null
  const survivorDeadlinePassed = survivorDeadline ? now > survivorDeadline : false

  function survivorStatus(mode: "HARDCORE" | "HIGHSCORE") {
    if (!survivorEntry) return "not_enrolled"
    const cycle = mode === "HIGHSCORE" && survivorEntry.resetUsed ? 1 : 0
    const eliminated = survivorEntry.picks.some(
      (p) => p.mode === mode && p.cycle === cycle && p.result === "ELIMINATED"
    )
    if (eliminated) return "eliminated"
    const hasPick = activeRound
      ? survivorEntry.picks.some((p) => p.round === activeRound && p.mode === mode)
      : false
    return hasPick ? "pick_made" : "needs_pick"
  }

  function currentPickTeam(mode: "HARDCORE" | "HIGHSCORE") {
    if (!survivorEntry || !activeRound) return null
    const pick = survivorEntry.picks.find((p) => p.round === activeRound && p.mode === mode)
    return pick?.team ?? null
  }

  const hcStatus = survivorStatus("HARDCORE")
  const hsStatus = survivorStatus("HIGHSCORE")
  const survivorNeedsPick = !survivorDeadlinePassed && (hcStatus === "needs_pick" || hsStatus === "needs_pick")

  // === WK MANAGER ===
  const fantasyTeam = await prisma.fantasyTeam.findUnique({
    where: { userId: session.user.id },
    select: {
      id: true,
      nickname: true,
      totalPoints: true,
      picks: { select: { playerId: true } },
    },
  })
  const fantasyDeadlinePassed = new Date() > FANTASY_DEADLINE
  const fantasyDaysLeft = Math.ceil((FANTASY_DEADLINE.getTime() - Date.now()) / (1000 * 60 * 60 * 24))

  // === KOMENDE DEADLINES ===
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  const upcomingMatches = await prisma.match.findMany({
    where: { status: "SCHEDULED", kickoff: { lte: new Date(in7Days.getTime() + 30 * 60 * 1000) } },
    include: { homeTeam: true, awayTeam: true },
    orderBy: { kickoff: "asc" },
    take: 8,
  })

  const myPoolIds = memberships.map((m) => m.pool.id)
  const myPredictions = await prisma.prediction.findMany({
    where: { userId: session.user.id, matchId: { in: upcomingMatches.map((m) => m.id) } },
    select: { matchId: true, poolId: true },
  })
  const predByMatch = new Map<string, Set<string>>()
  for (const p of myPredictions) {
    const s = predByMatch.get(p.matchId) ?? new Set()
    s.add(p.poolId)
    predByMatch.set(p.matchId, s)
  }

  const upcomingWithDeadline = upcomingMatches.map((m) => {
    const predictedPools = predByMatch.get(m.id) ?? new Set()
    const missingPools = myPoolIds.filter((id) => !predictedPools.has(id))
    return {
      ...m,
      deadline: new Date(m.kickoff.getTime() - 30 * 60 * 1000),
      hasPred: missingPools.length === 0,
      missingPools,
      firstMissingPool: missingPools[0] ?? myPoolIds[0],
    }
  }).filter((m) => m.deadline > now)

  // Pool standings (compact)
  const poolStandings = memberships.map(({ pool, role }) => {
    const lb = pool.leaderboard
    const myEntry = lb.find((e) => e.userId === session.user.id)
    const rank = myEntry ? lb.findIndex((e) => e.userId === session.user.id) + 1 : null
    const total = pool._count.memberships
    const projectedMatchPts = completedMatches > 0 && myEntry
      ? Math.round((myEntry.matchPoints / completedMatches) * TOTAL_MATCHES)
      : null
    const projectedTotal = projectedMatchPts !== null && myEntry
      ? projectedMatchPts + myEntry.bonusPoints + myEntry.championPoints
      : null
    return { pool, role, myEntry, rank, total, projectedTotal }
  })

  const statusColor = (s: string) =>
    s === "eliminated" ? "#ff4444"
    : s === "pick_made" ? "#4af56a"
    : s === "needs_pick" ? "#FFD700"
    : "var(--c-text-5)"

  const statusLabel = (s: string, mode: string) => {
    if (s === "not_enrolled") return "Niet ingeschreven"
    if (s === "eliminated") return "💀 Uitgeschakeld"
    if (s === "pick_made") {
      const team = currentPickTeam(mode as "HARDCORE" | "HIGHSCORE")
      return team ? `✓ ${team.nameNl ?? team.name}` : "✓ Pick gemaakt"
    }
    return survivorDeadlinePassed ? "Deadline voorbij" : "⚡ Pick nodig!"
  }

  return (
    <div className="space-y-5">
      {/* === WELKOM === */}
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-pixel text-white" style={{ fontSize: "11px" }}>
            WELKOM, <span style={{ color: "#FFD700" }}>{session.user.name?.toUpperCase()}!</span>
          </h1>
          <p className="font-pixel mt-1" style={{
            fontSize: "7px",
            color: completedMatches > 0 ? "#4af56a" : "var(--c-text-3)",
          }}>
            {completedMatches > 0
              ? `${completedMatches}/${totalMatches} WEDSTRIJDEN GESPEELD`
              : "WK 2026 START 11 JUNI · ZET ALVAST JE VOORSPELLINGEN KLAAR!"}
          </p>
        </div>
        {completedMatches > 0 && (
          <div className="flex items-center gap-2">
            <div className="h-2 overflow-hidden" style={{ width: "120px", background: "#0a1a0a", border: "2px solid #0a3d1f" }}>
              <div
                style={{
                  width: `${Math.round((completedMatches / totalMatches) * 100)}%`,
                  height: "100%",
                  background: "#4af56a",
                  boxShadow: "0 0 4px #4af56a",
                }}
              />
            </div>
            <span className="font-pixel" style={{ fontSize: "6px", color: "#4a7a4a" }}>
              {Math.round((completedMatches / totalMatches) * 100)}%
            </span>
          </div>
        )}
      </div>

      {/* === SNELKOPPELINGEN === */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { href: "/arena",     icon: "🏟️", label: "DE ARENA",          sub: "Jouw WK pools",          color: "#FF6200" },
          { href: "/survivor",  icon: "⚔",  label: "WK SURVIVOR",        sub: "Overleven of sterven",   color: "#ff4444", urgent: survivorNeedsPick },
          { href: "/fantasy",   icon: "🎮", label: "WK MANAGER",          sub: "Stel je elftal samen",    color: "#4af56a" },
          { href: "/ranglijst", icon: "📊", label: "MEGALOMANE RANGLIJST",sub: "Iedereen vs iedereen",   color: "#4499ff" },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="pixel-card p-4 flex flex-col items-center text-center gap-1.5 transition-all relative"
            style={{ borderTop: `3px solid ${item.color}` }}
          >
            {item.urgent && (
              <span style={{
                position: "absolute", top: "-5px", right: "-5px",
                width: "10px", height: "10px",
                background: "#ff4444", border: "2px solid #000",
                animation: "pulse 1s infinite",
              }} />
            )}
            <span style={{ fontSize: "24px" }}>{item.icon}</span>
            <span className="font-pixel" style={{ fontSize: "6px", color: item.color, lineHeight: "1.6" }}>
              {item.label}
            </span>
            <span style={{ fontSize: "9px", color: "var(--c-text-4)" }}>{item.sub}</span>
          </Link>
        ))}
      </div>

      {/* === TUSSENSTANDEN + SURVIVOR naast elkaar === */}
      <div className="grid sm:grid-cols-2 gap-4">

        {/* Pool tussenstanden */}
        <div className="pixel-card overflow-hidden">
          <div className="px-4 py-3 flex items-center justify-between" style={{ background: "#0a1220", borderBottom: "3px solid #000" }}>
            <h2 className="font-pixel text-white" style={{ fontSize: "8px" }}>📊 MIJN POOLS</h2>
            <Link href="/arena" className="font-pixel" style={{ fontSize: "6px", color: "#FF6200" }}>
              De Arena →
            </Link>
          </div>

          {memberships.length === 0 ? (
            <div className="p-5 text-center">
              <p className="font-pixel mb-3" style={{ fontSize: "7px", color: "var(--c-text-4)" }}>
                Nog geen pools. Start De Arena!
              </p>
              <Link href="/arena" className="font-pixel px-3 py-1.5"
                style={{ background: "#FF6200", color: "white", border: "2px solid #000", fontSize: "7px" }}>
                🏟️ Naar De Arena
              </Link>
            </div>
          ) : (
            <>
              {poolStandings.map(({ pool, myEntry, rank, total, projectedTotal }) => (
                <Link
                  key={pool.id}
                  href={`/pools/${pool.id}`}
                  className="flex items-center gap-3 px-4 py-3 transition-colors"
                  style={{ borderBottom: "1px solid var(--c-border)" }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-pixel truncate" style={{ fontSize: "8px", color: "var(--c-text)" }}>
                      {pool.name}
                    </div>
                    <div className="font-pixel mt-0.5" style={{ fontSize: "6px", color: "var(--c-text-4)" }}>
                      ⚽{myEntry?.matchPoints ?? 0} + 🏆{(myEntry?.bonusPoints ?? 0) + (myEntry?.championPoints ?? 0)}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    {rank ? (
                      <div className="font-pixel" style={{
                        fontSize: "11px",
                        color: rank === 1 ? "#FFD700" : rank <= 3 ? "#FF6200" : "var(--c-text-3)",
                      }}>
                        {rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : `#${rank}`}
                        <span style={{ fontSize: "8px", color: "var(--c-text-5)" }}>/{total}</span>
                      </div>
                    ) : null}
                    <div className="font-pixel" style={{ fontSize: "9px", color: "#FFD700" }}>
                      {myEntry?.totalPoints ?? 0}pt
                      {projectedTotal !== null && (
                        <span
                          title={`Prognose op basis van huidig tempo: ~${projectedTotal} punten aan het eind van het toernooi`}
                          style={{ color: "#4499ff", fontSize: "7px", cursor: "help" }}
                        >
                          {" "}~{projectedTotal}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
              <div className="px-4 py-2" style={{ background: "var(--c-surface-deep)", borderTop: "1px solid var(--c-border)" }}>
                <Link href="/pools/start" className="font-pixel" style={{ fontSize: "6px", color: "#4af56a" }}>
                  + Pool aanmaken of meedoen
                </Link>
              </div>
            </>
          )}
        </div>

        {/* Survivor widget */}
        <div className="pixel-card overflow-hidden">
          <div className="px-4 py-3 flex items-center justify-between" style={{ background: "#1a0a00", borderBottom: "3px solid #000" }}>
            <h2 className="font-pixel text-white" style={{ fontSize: "8px" }}>⚔ WK SURVIVOR</h2>
            <Link href="/survivor" className="font-pixel" style={{ fontSize: "6px", color: "#ff4444" }}>
              Naar Survivor →
            </Link>
          </div>

          {!survivorEntry ? (
            <div className="p-5 text-center space-y-3">
              <p style={{ fontSize: "9px", color: "var(--c-text-3)" }}>
                Kies elke ronde een team. Gokt het erop!
              </p>
              <Link href="/survivor" className="inline-block font-pixel px-4 py-2"
                style={{ background: "#ff4444", color: "white", border: "2px solid #000", boxShadow: "2px 2px 0 #000", fontSize: "7px" }}>
                ⚔ MEEDOEN
              </Link>
            </div>
          ) : (
            <>
              {/* Actieve ronde info */}
              {activeRound && survivorDeadline && (
                <div className="px-4 py-2.5" style={{ background: "#0d0800", borderBottom: "1px solid var(--c-border)" }}>
                  <div className="flex items-center justify-between">
                    <span className="font-pixel" style={{ fontSize: "7px", color: "#FF6200" }}>
                      {ROUND_LABELS[activeRound]}
                    </span>
                    <span className="font-pixel" style={{
                      fontSize: "6px",
                      color: survivorDeadlinePassed ? "var(--c-text-5)" : survivorNeedsPick ? "#FFD700" : "#4af56a",
                    }}>
                      {survivorDeadlinePassed
                        ? "Deadline voorbij"
                        : `Deadline: ${survivorDeadline.toLocaleDateString("nl-NL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}`}
                    </span>
                  </div>
                </div>
              )}

              {/* HARDCORE & HIGHSCORE status */}
              {(["HARDCORE", "HIGHSCORE"] as const).map((mode) => {
                const s = survivorStatus(mode)
                return (
                  <div
                    key={mode}
                    className="flex items-center justify-between px-4 py-3"
                    style={{ borderBottom: "1px solid var(--c-border)" }}
                  >
                    <div>
                      <div className="font-pixel" style={{ fontSize: "7px", color: mode === "HARDCORE" ? "#ff4444" : "#FFD700" }}>
                        {mode}
                      </div>
                      <div className="font-pixel mt-0.5" style={{ fontSize: "7px", color: statusColor(s) }}>
                        {statusLabel(s, mode)}
                      </div>
                    </div>
                    {s === "needs_pick" && !survivorDeadlinePassed && (
                      <Link href="/survivor" className="font-pixel px-2 py-1 shrink-0"
                        style={{ background: "#FFD700", color: "#000", border: "2px solid #000", fontSize: "6px", boxShadow: "1px 1px 0 #000" }}>
                        PICK →
                      </Link>
                    )}
                    {s === "eliminated" && (
                      <span style={{ fontSize: "20px" }}>💀</span>
                    )}
                    {s === "pick_made" && (
                      <span style={{ fontSize: "20px" }}>✅</span>
                    )}
                  </div>
                )
              })}

              {!activeRound && (
                <div className="px-4 py-3 text-center">
                  <p className="font-pixel" style={{ fontSize: "7px", color: "var(--c-text-4)" }}>
                    Wacht op de volgende ronde...
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* === WK MANAGER WIDGET === */}
      <div className="pixel-card overflow-hidden">
        <div className="px-4 py-3 flex items-center justify-between" style={{ background: "#0a1f0a", borderBottom: "3px solid #000" }}>
          <h2 className="font-pixel text-white" style={{ fontSize: "8px" }}>🎮 WK MANAGER</h2>
          <Link href="/fantasy" className="font-pixel" style={{ fontSize: "6px", color: "#4af56a" }}>
            Naar WK Manager →
          </Link>
        </div>

        {!fantasyTeam ? (
          <div className="px-4 py-4 flex items-center justify-between gap-3 flex-wrap">
            <div>
              <p className="font-pixel" style={{ fontSize: "7px", color: "var(--c-text-3)", lineHeight: "1.8" }}>
                Stel je selectie van 15 spelers samen!
              </p>
              {!fantasyDeadlinePassed && (
                <p className="font-pixel mt-0.5" style={{ fontSize: "6px", color: fantasyDaysLeft <= 7 ? "#FFD700" : "#4a7a4a" }}>
                  {fantasyDaysLeft <= 7
                    ? `⚠ Nog ${fantasyDaysLeft} dag${fantasyDaysLeft === 1 ? "" : "en"} tot deadline`
                    : `Deadline: 11 juni · nog ${fantasyDaysLeft} dagen`}
                </p>
              )}
            </div>
            {fantasyDeadlinePassed ? (
              <span className="font-pixel" style={{ fontSize: "7px", color: "#ff4444" }}>🔒 Deadline verstreken</span>
            ) : (
              <Link href="/fantasy/select" className="font-pixel px-3 py-1.5 shrink-0"
                style={{ background: "#0a5a2a", color: "white", border: "2px solid #000", boxShadow: "2px 2px 0 #000", fontSize: "7px" }}>
                ▶ TEAM AANMAKEN
              </Link>
            )}
          </div>
        ) : (
          <div className="px-4 py-3 flex items-center gap-4 flex-wrap">
            <div className="flex-1 min-w-0">
              <div className="font-pixel truncate" style={{ fontSize: "9px", color: "#4af56a" }}>
                {fantasyTeam.nickname}
              </div>
              <div className="font-pixel mt-0.5" style={{ fontSize: "6px", color: "var(--c-text-4)" }}>
                {fantasyTeam.picks.length} spelers geselecteerd
              </div>
            </div>
            <div className="font-pixel shrink-0 text-right">
              <div style={{ fontSize: "13px", color: "#FFD700" }}>{fantasyTeam.totalPoints} pt</div>
            </div>
          </div>
        )}
      </div>

      {/* === KOMENDE DEADLINES === */}
      {upcomingWithDeadline.length > 0 && (
        <div className="pixel-card overflow-hidden">
          <div className="px-4 py-3 flex items-center justify-between" style={{ background: "#1a0a00", borderBottom: "3px solid #000" }}>
            <div>
              <h2 className="font-pixel text-white" style={{ fontSize: "8px" }}>⏱ KOMENDE DEADLINES</h2>
              <p className="font-pixel mt-0.5" style={{ fontSize: "6px", color: "#FF6200" }}>
                Wedstrijden waarvoor de invoertijd binnenkort sluit
              </p>
            </div>
            {myPoolIds.length > 0 && (
              <Link
                href={`/pools/${upcomingWithDeadline.find((m) => !m.hasPred)?.firstMissingPool ?? myPoolIds[0]}/predictions`}
                className="font-pixel shrink-0"
                style={{ fontSize: "6px", color: "#FF6200" }}
              >
                Alle voorspellingen →
              </Link>
            )}
          </div>
          <div>
            {upcomingWithDeadline.map((m) => {
              const diffMs = m.deadline.getTime() - now.getTime()
              const hours = Math.floor(diffMs / 3_600_000)
              const minutes = Math.floor((diffMs % 3_600_000) / 60_000)
              const isUrgent = diffMs < 3_600_000
              const timeLabel = hours > 0 ? `${hours}u ${minutes}m` : `${minutes}m`

              return (
                <Link
                  key={m.id}
                  href={`/pools/${m.firstMissingPool}/predictions`}
                  className="flex items-center gap-3 px-4 py-2.5 transition-colors"
                  style={{
                    borderBottom: "1px solid var(--c-border)",
                    borderLeft: m.hasPred ? "3px solid #16a34a" : "3px solid #FF6200",
                    background: !m.hasPred && isUrgent ? "#1a0500" : "transparent",
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-pixel truncate" style={{ fontSize: "8px", color: "var(--c-text)" }}>
                      {m.homeTeam?.nameNl ?? m.homeTeam?.name ?? "?"} – {m.awayTeam?.nameNl ?? m.awayTeam?.name ?? "?"}
                    </div>
                    <div className="font-pixel mt-0.5 flex items-center gap-2" style={{ fontSize: "6px", color: "var(--c-text-4)" }}>
                      {new Date(m.kickoff).toLocaleString("nl-NL", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      {!m.hasPred && m.missingPools.length > 1 && (
                        <span style={{ color: "#FF6200" }}>· {m.missingPools.length}× open</span>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0">
                    {m.hasPred ? (
                      <span className="font-pixel" style={{ fontSize: "7px", color: "#4af56a" }}>✓</span>
                    ) : (
                      <span className="font-pixel" style={{ fontSize: "7px", color: isUrgent ? "#ff4444" : "#FFD700" }}>
                        {isUrgent ? "⚠ " : "⏱ "}{timeLabel}
                      </span>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* === EXTRA NAVIGATIE (altijd zichtbaar) === */}
      <div className="grid grid-cols-3 sm:grid-cols-3 gap-2">
        <Link href="/faq" className="pixel-card px-3 py-3 flex items-center gap-2 transition-colors">
          <span style={{ fontSize: "16px" }}>❓</span>
          <div>
            <div className="font-pixel" style={{ fontSize: "6px", color: "var(--c-text-2)" }}>FAQ</div>
            <div className="font-pixel" style={{ fontSize: "5px", color: "var(--c-text-5)" }}>Spelregels</div>
          </div>
        </Link>
        <Link href="/bracket" className="pixel-card px-3 py-3 flex items-center gap-2 transition-colors">
          <span style={{ fontSize: "16px" }}>🏟</span>
          <div>
            <div className="font-pixel" style={{ fontSize: "6px", color: "var(--c-text-2)" }}>BRACKET</div>
            <div className="font-pixel" style={{ fontSize: "5px", color: "var(--c-text-5)" }}>Knock-out schema</div>
          </div>
        </Link>
        <Link href="/profile" className="pixel-card px-3 py-3 flex items-center gap-2 transition-colors">
          <span style={{ fontSize: "16px" }}>👤</span>
          <div>
            <div className="font-pixel" style={{ fontSize: "6px", color: "var(--c-text-2)" }}>PROFIEL</div>
            <div className="font-pixel" style={{ fontSize: "5px", color: "var(--c-text-5)" }}>Naam & wachtwoord</div>
          </div>
        </Link>
      </div>
    </div>
  )
}
