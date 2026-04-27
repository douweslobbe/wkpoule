import { redirect } from "next/navigation"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { MatchStage, MatchStatus } from "@prisma/client"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "WK 2026 Bracket — WK Pool 2026" }

// ─── Types ────────────────────────────────────────────────────────────────────

interface TeamRow {
  id: string
  nameNl: string | null
  name: string
  code: string
  flagUrl: string | null
  mp: number
  w: number
  d: number
  l: number
  gf: number
  ga: number
  gd: number
  pts: number
}

type MatchWithTeams = {
  id: string
  stage: MatchStage
  groupName: string | null
  matchday: number | null
  homeTeamId: string | null
  awayTeamId: string | null
  homeScore: number | null
  awayScore: number | null
  status: MatchStatus
  kickoff: Date
  homeTeam: { id: string; name: string; nameNl: string | null; code: string; flagUrl: string | null } | null
  awayTeam: { id: string; name: string; nameNl: string | null; code: string; flagUrl: string | null } | null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function calcStandings(matches: MatchWithTeams[]): TeamRow[] {
  const teams = new Map<string, TeamRow>()

  function ensure(
    id: string,
    t: { name: string; nameNl: string | null; code: string; flagUrl: string | null }
  ) {
    if (!teams.has(id)) {
      teams.set(id, { id, name: t.name, nameNl: t.nameNl, code: t.code, flagUrl: t.flagUrl, mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 })
    }
    return teams.get(id)!
  }

  for (const m of matches) {
    if (m.homeTeam && m.homeTeamId) ensure(m.homeTeamId, m.homeTeam)
    if (m.awayTeam && m.awayTeamId) ensure(m.awayTeamId, m.awayTeam)

    if (m.status !== "FINISHED" || m.homeScore === null || m.awayScore === null || !m.homeTeamId || !m.awayTeamId) continue

    const h = teams.get(m.homeTeamId)!
    const a = teams.get(m.awayTeamId)!
    h.mp++; a.mp++
    h.gf += m.homeScore; h.ga += m.awayScore; h.gd = h.gf - h.ga
    a.gf += m.awayScore; a.ga += m.homeScore; a.gd = a.gf - a.ga

    if (m.homeScore > m.awayScore)      { h.w++; a.l++; h.pts += 3 }
    else if (m.homeScore < m.awayScore) { a.w++; h.l++; a.pts += 3 }
    else                                { h.d++; a.d++; h.pts += 1; a.pts += 1 }
  }

  return [...teams.values()].sort((a, b) =>
    b.pts - a.pts || b.gd - a.gd || b.gf - a.gf || a.name.localeCompare(b.name)
  )
}

function teamName(t: { nameNl: string | null; name: string } | null): string {
  if (!t) return "TBD"
  return t.nameNl ?? t.name
}

function formatKickoff(d: Date) {
  return d.toLocaleString("nl-NL", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
}

const KNOCKOUT_ORDER: MatchStage[] = ["ROUND_OF_32", "ROUND_OF_16", "QUARTER_FINAL", "SEMI_FINAL", "THIRD_PLACE", "FINAL"]
const KNOCKOUT_LABELS: Partial<Record<MatchStage, string>> = {
  ROUND_OF_32: "Ronde van 32",
  ROUND_OF_16: "Achtste finale",
  QUARTER_FINAL: "Kwartfinale",
  SEMI_FINAL: "Halve finale",
  THIRD_PLACE: "Derde plaats",
  FINAL: "Finale",
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function BracketPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const sp = await searchParams
  const activeTab = sp.tab === "knockout" ? "knockout" : "groups"

  const [groupMatches, knockoutMatches] = await Promise.all([
    prisma.match.findMany({
      where: { stage: "GROUP" },
      include: { homeTeam: true, awayTeam: true },
      orderBy: [{ groupName: "asc" }, { matchday: "asc" }, { kickoff: "asc" }],
    }),
    prisma.match.findMany({
      where: { stage: { not: "GROUP" } },
      include: { homeTeam: true, awayTeam: true },
      orderBy: { kickoff: "asc" },
    }),
  ])

  const allMatches = [...groupMatches, ...knockoutMatches]
  const totalMatches = allMatches.length
  const finishedCount = allMatches.filter((m) => m.status === "FINISHED").length
  const liveCount = allMatches.filter((m) => m.status === "LIVE").length

  // Build groups map
  const groupsMap = new Map<string, MatchWithTeams[]>()
  for (const m of groupMatches) {
    const g = m.groupName ?? "?"
    if (!groupsMap.has(g)) groupsMap.set(g, [])
    groupsMap.get(g)!.push(m)
  }
  const sortedGroups = [...groupsMap.entries()].sort(([a], [b]) => a.localeCompare(b))

  // Build knockout rounds map
  const knockoutByStage = new Map<MatchStage, MatchWithTeams[]>()
  for (const m of knockoutMatches) {
    if (!knockoutByStage.has(m.stage)) knockoutByStage.set(m.stage, [])
    knockoutByStage.get(m.stage)!.push(m)
  }

  const tabStyle = (active: boolean) => ({
    fontFamily: "var(--font-pixel), monospace",
    fontSize: "7px",
    color: active ? "#fff" : "var(--c-text-nav)",
    border: active ? "2px solid #FF6200" : "1px solid #2d2d50",
    background: active ? "#FF6200" : "#0d0f1a",
    boxShadow: active ? "2px 2px 0 #000" : "none",
  })

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <Link href="/dashboard" className="font-pixel" style={{ fontSize: "7px", color: "#7070a0" }}>
          ◄ DASHBOARD
        </Link>
        <h1 className="font-pixel" style={{ fontSize: "10px" }}>
          <span style={{ color: "#FF6200" }}>⚽ WK</span>{" "}
          <span style={{ color: "#FFD700" }}>2026</span>{" "}
          <span style={{ color: "#fff" }}>BRACKET</span>
        </h1>
        {totalMatches > 0 && (
          <div className="flex items-center gap-2">
            <span
              className="font-pixel px-2 py-1"
              style={{ fontSize: "6px", background: "#0a3d1f", color: "#4af56a", border: "1px solid #0a5a2a" }}
            >
              {finishedCount}/{totalMatches} gespeeld
            </span>
            {liveCount > 0 && (
              <span
                className="font-pixel px-2 py-1"
                style={{ fontSize: "6px", background: "#3d0a0a", color: "#ff4444", border: "1px solid #660000", animation: "pulse 2s infinite" }}
              >
                ● LIVE: {liveCount}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6">
        <Link href="/bracket?tab=groups" className="px-3 py-1.5 font-bold" style={tabStyle(activeTab === "groups")}>
          🏟 GROEPEN
        </Link>
        <Link href="/bracket?tab=knockout" className="px-3 py-1.5 font-bold" style={tabStyle(activeTab === "knockout")}>
          ⚡ KNOCKOUT
        </Link>
      </div>

      {/* ─── GROEPEN TAB ─────────────────────────────────────────────────────── */}
      {activeTab === "groups" && (
        <>
          {sortedGroups.length === 0 ? (
            <div className="pixel-card p-10 text-center">
              <p className="font-pixel" style={{ fontSize: "8px", color: "var(--c-text-4)" }}>
                Nog geen wedstrijden gesynchroniseerd. Gebruik de sync-knop in het admin-panel.
              </p>
            </div>
          ) : (
            <div
              className="grid gap-4"
              style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}
            >
              {sortedGroups.map(([groupName, matches]) => {
                const standings = calcStandings(matches)
                const playedAll = matches.every((m) => m.status === "FINISHED")
                const currentMatchday = Math.max(...matches.filter((m) => m.status === "FINISHED").map((m) => m.matchday ?? 0), 0)

                return (
                  <div key={groupName} className="pixel-card overflow-hidden">
                    {/* Group header */}
                    <div
                      className="px-3 py-2 flex items-center justify-between"
                      style={{ background: "#071810", borderBottom: "3px solid #000" }}
                    >
                      <span className="font-pixel" style={{ fontSize: "9px", color: "#FFD700" }}>
                        {groupName.toUpperCase()}
                      </span>
                      <span className="font-pixel" style={{ fontSize: "6px", color: playedAll ? "#4af56a" : "var(--c-text-4)" }}>
                        {playedAll ? "✓ AFGEROND" : `SPEELDAG ${currentMatchday + 1}/3`}
                      </span>
                    </div>

                    {/* Standings table */}
                    <div>
                      {/* Header row */}
                      <div
                        className="grid px-3 py-1.5"
                        style={{
                          gridTemplateColumns: "16px 1fr 22px 22px 22px 28px 24px",
                          gap: "4px",
                          borderBottom: "1px solid var(--c-border)",
                          background: "var(--c-surface-deep)",
                        }}
                      >
                        {["", "", "W", "G", "V", "DoS", "P"].map((h, i) => (
                          <span key={i} className="font-pixel text-right" style={{ fontSize: "5px", color: "var(--c-text-4)" }}>
                            {h}
                          </span>
                        ))}
                      </div>

                      {/* Team rows */}
                      {standings.map((team, idx) => {
                        const qualified = idx < 2
                        const thirdPlace = idx === 2
                        return (
                          <div
                            key={team.id}
                            className="grid px-3 py-2 items-center"
                            style={{
                              gridTemplateColumns: "16px 1fr 22px 22px 22px 28px 24px",
                              gap: "4px",
                              borderBottom: "1px solid var(--c-border)",
                              borderLeft: qualified
                                ? "3px solid #4af56a"
                                : thirdPlace
                                ? "3px solid #FFD700"
                                : "3px solid transparent",
                              background: qualified ? "#071810" : undefined,
                            }}
                          >
                            {/* Flag */}
                            <div className="flex items-center justify-center">
                              {team.flagUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={team.flagUrl} alt={team.code} width={16} height={11} style={{ objectFit: "cover" }} />
                              ) : (
                                <span style={{ fontSize: "10px" }}>🏳</span>
                              )}
                            </div>

                            {/* Team name */}
                            <span
                              className="font-bold truncate"
                              style={{
                                fontSize: "8px",
                                color: qualified ? "var(--c-text)" : "var(--c-text-3)",
                              }}
                            >
                              {team.nameNl ?? team.name}
                            </span>

                            {/* Stats */}
                            {[team.w, team.d, team.l].map((val, i) => (
                              <span key={i} className="font-pixel text-right" style={{ fontSize: "7px", color: "var(--c-text-3)" }}>
                                {val}
                              </span>
                            ))}

                            {/* Goal diff */}
                            <span
                              className="font-pixel text-right"
                              style={{
                                fontSize: "7px",
                                color: team.gd > 0 ? "#4af56a" : team.gd < 0 ? "#ff6666" : "var(--c-text-3)",
                              }}
                            >
                              {team.gd > 0 ? "+" : ""}{team.gd}
                            </span>

                            {/* Points */}
                            <span
                              className="font-pixel text-right"
                              style={{
                                fontSize: "8px",
                                color: qualified ? "#FFD700" : "var(--c-text-2)",
                                fontWeight: "bold",
                              }}
                            >
                              {team.pts}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Legend */}
          {sortedGroups.length > 0 && (
            <div className="flex gap-4 mt-4 flex-wrap">
              <div className="flex items-center gap-2">
                <div style={{ width: "3px", height: "14px", background: "#4af56a" }} />
                <span className="font-pixel" style={{ fontSize: "6px", color: "var(--c-text-4)" }}>
                  Plaatsen 1–2: door naar Ronde van 32
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div style={{ width: "3px", height: "14px", background: "#FFD700" }} />
                <span className="font-pixel" style={{ fontSize: "6px", color: "var(--c-text-4)" }}>
                  Plaats 3: eventueel door als beste derde
                </span>
              </div>
            </div>
          )}
        </>
      )}

      {/* ─── KNOCKOUT TAB ───────────────────────────────────────────────────── */}
      {activeTab === "knockout" && (
        <>
          {knockoutMatches.length === 0 ? (
            <div className="pixel-card p-10 text-center">
              <p className="font-pixel" style={{ fontSize: "8px", color: "var(--c-text-4)" }}>
                De knockoutfase begint zodra de groepsfase is afgerond.
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {KNOCKOUT_ORDER.filter((stage) => knockoutByStage.has(stage)).map((stage) => {
                const stageMatches = knockoutByStage.get(stage)!
                const isFinal = stage === "FINAL"
                const isThirdPlace = stage === "THIRD_PLACE"

                return (
                  <div key={stage}>
                    {/* Stage header */}
                    <div
                      className="px-4 py-2 mb-3 flex items-center justify-between"
                      style={{
                        background: isFinal ? "#1a1000" : "#071810",
                        border: `3px solid ${isFinal ? "#FFD700" : "#000"}`,
                        boxShadow: isFinal ? "0 0 12px #FFD70033" : "none",
                      }}
                    >
                      <span
                        className="font-pixel"
                        style={{
                          fontSize: isFinal ? "10px" : "8px",
                          color: isFinal ? "#FFD700" : "#fff",
                        }}
                      >
                        {isFinal ? "🏆 " : isThirdPlace ? "🥉 " : "⚡ "}
                        {KNOCKOUT_LABELS[stage]?.toUpperCase()}
                      </span>
                      <span className="font-pixel" style={{ fontSize: "6px", color: "var(--c-text-4)" }}>
                        {stageMatches.filter((m) => m.status === "FINISHED").length}/{stageMatches.length} gespeeld
                      </span>
                    </div>

                    {/* Match grid */}
                    <div
                      className="grid gap-3"
                      style={{
                        gridTemplateColumns: isFinal || isThirdPlace ? "1fr" : "repeat(auto-fill, minmax(260px, 1fr))",
                      }}
                    >
                      {stageMatches.map((match) => {
                        const finished = match.status === "FINISHED"
                        const live = match.status === "LIVE"
                        const homeWon = finished && match.homeScore !== null && match.awayScore !== null && match.homeScore > match.awayScore
                        const awayWon = finished && match.homeScore !== null && match.awayScore !== null && match.awayScore > match.homeScore

                        return (
                          <div
                            key={match.id}
                            className="pixel-card overflow-hidden"
                            style={{
                              borderColor: live ? "#ff4444" : isFinal && finished ? "#FFD700" : undefined,
                              boxShadow: live ? "0 0 8px #ff444444" : isFinal && finished ? "0 0 12px #FFD70033" : "none",
                            }}
                          >
                            {/* Match date / status */}
                            <div
                              className="px-3 py-1.5 flex items-center justify-between"
                              style={{
                                background: live ? "#3d0a0a" : finished ? "var(--c-surface-deep)" : "#0a1a10",
                                borderBottom: "2px solid var(--c-border)",
                              }}
                            >
                              <span className="font-pixel" style={{ fontSize: "6px", color: "var(--c-text-4)" }}>
                                {formatKickoff(match.kickoff)}
                              </span>
                              {live && (
                                <span className="font-pixel" style={{ fontSize: "6px", color: "#ff4444" }}>
                                  ● LIVE
                                </span>
                              )}
                              {finished && (
                                <span className="font-pixel" style={{ fontSize: "6px", color: "#4af56a" }}>
                                  ✓ AFGEROND
                                </span>
                              )}
                            </div>

                            {/* Teams + score */}
                            <div className="px-3 py-3">
                              {/* Home team */}
                              <div className="flex items-center gap-2 mb-2">
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  {match.homeTeam?.flagUrl ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={match.homeTeam.flagUrl} alt={match.homeTeam.code} width={20} height={14} style={{ objectFit: "cover", flexShrink: 0 }} />
                                  ) : (
                                    <span style={{ fontSize: "14px", flexShrink: 0 }}>🏳</span>
                                  )}
                                  <span
                                    className="font-bold truncate"
                                    style={{
                                      fontSize: "9px",
                                      color: homeWon ? "#fff" : finished ? "var(--c-text-3)" : "var(--c-text)",
                                    }}
                                  >
                                    {teamName(match.homeTeam)}
                                  </span>
                                </div>
                                {finished && match.homeScore !== null && (
                                  <span
                                    className="font-pixel shrink-0"
                                    style={{
                                      fontSize: "14px",
                                      color: homeWon ? "#FFD700" : "var(--c-text-3)",
                                      minWidth: "20px",
                                      textAlign: "right",
                                    }}
                                  >
                                    {match.homeScore}
                                  </span>
                                )}
                              </div>

                              {/* VS or dash */}
                              {!finished && (
                                <div className="flex items-center gap-2 my-1">
                                  <div style={{ flex: 1, height: "1px", background: "var(--c-border)" }} />
                                  <span className="font-pixel" style={{ fontSize: "6px", color: "var(--c-text-4)" }}>VS</span>
                                  <div style={{ flex: 1, height: "1px", background: "var(--c-border)" }} />
                                </div>
                              )}
                              {finished && (
                                <div className="flex justify-end my-1 pr-1">
                                  <span className="font-pixel" style={{ fontSize: "6px", color: "var(--c-text-4)" }}>–</span>
                                </div>
                              )}

                              {/* Away team */}
                              <div className="flex items-center gap-2">
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  {match.awayTeam?.flagUrl ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={match.awayTeam.flagUrl} alt={match.awayTeam.code} width={20} height={14} style={{ objectFit: "cover", flexShrink: 0 }} />
                                  ) : (
                                    <span style={{ fontSize: "14px", flexShrink: 0 }}>🏳</span>
                                  )}
                                  <span
                                    className="font-bold truncate"
                                    style={{
                                      fontSize: "9px",
                                      color: awayWon ? "#fff" : finished ? "var(--c-text-3)" : "var(--c-text)",
                                    }}
                                  >
                                    {teamName(match.awayTeam)}
                                  </span>
                                </div>
                                {finished && match.awayScore !== null && (
                                  <span
                                    className="font-pixel shrink-0"
                                    style={{
                                      fontSize: "14px",
                                      color: awayWon ? "#FFD700" : "var(--c-text-3)",
                                      minWidth: "20px",
                                      textAlign: "right",
                                    }}
                                  >
                                    {match.awayScore}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}
