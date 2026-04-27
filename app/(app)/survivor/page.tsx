import { redirect } from "next/navigation"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import {
  SURVIVOR_ROUNDS,
  ROUND_LABELS,
  getActiveSurvivorRound,
  getRoundDeadline,
  getTeamIdsInRound,
} from "@/lib/survivor"
import { SurvivorJoinButton } from "./SurvivorJoinButton"
import { SurvivorPickForm } from "./SurvivorPickForm"
import { SurvivorResetButton } from "./SurvivorResetButton"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "WK Survivor — WK Pool 2026" }

const RESULT_ICONS: Record<string, string> = {
  PENDING: "⏳",
  SURVIVED: "✅",
  ELIMINATED: "💀",
}

function formatDeadline(d: Date) {
  return d.toLocaleString("nl-NL", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export default async function SurvivorPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const myEntry = await prisma.survivorEntry.findUnique({
    where: { userId: session.user.id },
    include: {
      picks: {
        include: { team: { select: { id: true, nameNl: true, name: true, code: true, flagUrl: true } } },
      },
    },
  })

  const activeRound = await getActiveSurvivorRound()
  const deadline = activeRound ? await getRoundDeadline(activeRound) : null
  const deadlinePassed = deadline ? new Date() > deadline : true

  // All teams playing in the active round (for pick form)
  const roundTeamIds = activeRound ? await getTeamIdsInRound(activeRound) : new Set<string>()
  const allTeams = await prisma.team.findMany({
    orderBy: { nameNl: "asc" },
  })
  const teamsInRound = allTeams.filter((t) => roundTeamIds.has(t.id))

  // Per mode: which teams has this user already used?
  function usedTeams(mode: "HARDCORE" | "HIGHSCORE"): string[] {
    if (!myEntry) return []
    const cycle = mode === "HIGHSCORE" && myEntry.resetUsed ? 1 : 0
    return myEntry.picks
      .filter((p) => p.mode === mode && p.cycle === cycle)
      .map((p) => p.teamId)
  }

  function currentPick(mode: "HARDCORE" | "HIGHSCORE"): string | null {
    if (!myEntry || !activeRound) return null
    return myEntry.picks.find((p) => p.round === activeRound && p.mode === mode)?.teamId ?? null
  }

  // All entries for standings
  const allEntries = await prisma.survivorEntry.findMany({
    include: {
      user: { select: { id: true, name: true } },
      picks: {
        include: { team: { select: { id: true, nameNl: true, name: true, code: true, flagUrl: true } } },
      },
    },
    orderBy: { createdAt: "asc" },
  })

  // Sort: HARDCORE alive first, then by highscore desc
  const sortedEntries = [...allEntries].sort((a, b) => {
    if (a.hardcoreAlive !== b.hardcoreAlive) return a.hardcoreAlive ? -1 : 1
    return b.highscoreTotal - a.highscoreTotal
  })

  const canPickHardcore = myEntry?.hardcoreAlive && !deadlinePassed && !!activeRound
  const canPickHighscore = !!myEntry && !deadlinePassed && !!activeRound

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <Link href="/dashboard" className="font-pixel" style={{ fontSize: "7px", color: "#7070a0" }}>
          ◄ DASHBOARD
        </Link>
        <h1 className="font-pixel" style={{ fontSize: "10px" }}>
          <span style={{ color: "#ff4444" }}>⚔</span>{" "}
          <span style={{ color: "#FFD700" }}>WK</span>{" "}
          <span style={{ color: "#fff" }}>SURVIVOR</span>
        </h1>
      </div>

      {/* Intro / join */}
      {!myEntry ? (
        <div className="pixel-card overflow-hidden mb-6">
          <div className="px-5 py-3" style={{ background: "#1a0000", borderBottom: "3px solid #000" }}>
            <h2 className="font-pixel text-white" style={{ fontSize: "9px" }}>⚔ WAT IS WK SURVIVOR?</h2>
          </div>
          <div className="p-5 space-y-3">
            <p className="font-pixel" style={{ fontSize: "8px", color: "var(--c-text-2)", lineHeight: "2" }}>
              Elke speelronde kies je één team. Wint dat team? Dan overleef je. Verliest of gelijkspelen?{" "}
              <span style={{ color: "#ff4444" }}>Dan val je af (HARDCORE)</span> of verlies je punten{" "}
              <span style={{ color: "#FFD700" }}>(HIGHSCORE)</span>.
              Elk team mag je maar één keer per cyclus inzetten.
            </p>
            <div className="flex gap-4 flex-wrap">
              <div className="flex-1 min-w-[140px] p-3" style={{ background: "#1a0000", border: "2px solid #660000" }}>
                <div className="font-pixel mb-1" style={{ fontSize: "8px", color: "#ff4444" }}>💀 HARDCORE</div>
                <p className="font-pixel" style={{ fontSize: "7px", color: "var(--c-text-3)", lineHeight: "1.8" }}>
                  0 levens. Één verkeerde pick en je bent definitief uitgeschakeld.
                </p>
              </div>
              <div className="flex-1 min-w-[140px] p-3" style={{ background: "#1a1500", border: "2px solid #665500" }}>
                <div className="font-pixel mb-1" style={{ fontSize: "8px", color: "#FFD700" }}>📊 HIGHSCORE</div>
                <p className="font-pixel" style={{ fontSize: "7px", color: "var(--c-text-3)", lineHeight: "1.8" }}>
                  Scoor doelpuntenverschil. Je speelt altijd mee. Eén reset: gebruik teams opnieuw.
                </p>
              </div>
            </div>
            <p className="font-pixel" style={{ fontSize: "7px", color: "var(--c-text-4)", lineHeight: "1.8" }}>
              Je doet mee aan beide modi tegelijk met aparte picks per ronde.
              Je kan de picks van alle deelnemers zien zodra de ronde begint.
            </p>
            <div className="pt-2">
              <SurvivorJoinButton />
            </div>
          </div>
        </div>
      ) : (
        /* Status card */
        <div className="pixel-card overflow-hidden mb-6">
          <div className="px-5 py-3" style={{ background: "#0a1a10", borderBottom: "3px solid #000" }}>
            <h2 className="font-pixel text-white" style={{ fontSize: "9px" }}>🎮 JOUW STATUS</h2>
          </div>
          <div className="p-5 flex gap-6 flex-wrap">
            {/* HARDCORE status */}
            <div className="flex-1 min-w-[140px]">
              <div className="font-pixel mb-1" style={{ fontSize: "7px", color: "#ff4444" }}>💀 HARDCORE</div>
              {myEntry.hardcoreAlive ? (
                <div className="font-pixel" style={{ fontSize: "10px", color: "#4af56a" }}>ALIVE ✓</div>
              ) : (
                <div>
                  <div className="font-pixel" style={{ fontSize: "10px", color: "#ff4444" }}>UITGESCHAKELD</div>
                  {myEntry.hardcoreElimRound && (
                    <div className="font-pixel mt-0.5" style={{ fontSize: "6px", color: "var(--c-text-4)" }}>
                      in {ROUND_LABELS[myEntry.hardcoreElimRound as keyof typeof ROUND_LABELS] ?? myEntry.hardcoreElimRound}
                    </div>
                  )}
                </div>
              )}
            </div>
            {/* HIGHSCORE status */}
            <div className="flex-1 min-w-[140px]">
              <div className="font-pixel mb-1" style={{ fontSize: "7px", color: "#FFD700" }}>📊 HIGHSCORE</div>
              <div className="font-pixel" style={{ fontSize: "14px", color: myEntry.highscoreTotal >= 0 ? "#4af56a" : "#ff4444" }}>
                {myEntry.highscoreTotal > 0 ? "+" : ""}{myEntry.highscoreTotal}
              </div>
              <div className="font-pixel mt-1" style={{ fontSize: "6px", color: "var(--c-text-4)" }}>
                doelpuntenverschil
              </div>
              <div className="mt-2">
                {myEntry.resetUsed ? (
                  <span className="font-pixel px-2 py-0.5" style={{ fontSize: "6px", background: "#1a1a1a", color: "#555566", border: "1px solid #2a2a3a" }}>
                    🔄 RESET GEBRUIKT
                  </span>
                ) : (
                  <div>
                    <span className="font-pixel px-2 py-0.5 mr-2" style={{ fontSize: "6px", background: "#1a1000", color: "#ff8800", border: "1px solid #663300" }}>
                      🔄 RESET BESCHIKBAAR
                    </span>
                    <SurvivorResetButton />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Current round — pick forms */}
      {myEntry && activeRound && (
        <div className="pixel-card overflow-hidden mb-6">
          <div className="px-5 py-3" style={{ background: "#0a3d1f", borderBottom: "3px solid #000" }}>
            <h2 className="font-pixel text-white" style={{ fontSize: "9px" }}>
              🎯 HUIDIGE RONDE — {ROUND_LABELS[activeRound].toUpperCase()}
            </h2>
            {deadline && (
              <p className="font-pixel mt-1" style={{ fontSize: "6px", color: deadlinePassed ? "#ff4444" : "#4af56a" }}>
                {deadlinePassed ? "⏰ Deadline verstreken" : `⏰ Deadline: ${formatDeadline(deadline)}`}
              </p>
            )}
          </div>
          <div className="p-5 space-y-6">
            {/* HARDCORE pick */}
            <div>
              <div className="font-pixel mb-2" style={{ fontSize: "8px", color: "#ff4444" }}>
                💀 HARDCORE PICK
              </div>
              {!myEntry.hardcoreAlive ? (
                <p className="font-pixel" style={{ fontSize: "7px", color: "#555566" }}>
                  Je bent uitgeschakeld — geen pick mogelijk.
                </p>
              ) : deadlinePassed ? (
                <p className="font-pixel" style={{ fontSize: "7px", color: "var(--c-text-4)" }}>
                  Deadline verstreken voor deze ronde.
                </p>
              ) : (
                <SurvivorPickForm
                  mode="HARDCORE"
                  round={activeRound}
                  currentPickTeamId={currentPick("HARDCORE")}
                  usedTeamIds={usedTeams("HARDCORE")}
                  availableTeams={teamsInRound}
                />
              )}
            </div>

            <div style={{ borderTop: "2px solid var(--c-border)" }} />

            {/* HIGHSCORE pick */}
            <div>
              <div className="font-pixel mb-2" style={{ fontSize: "8px", color: "#FFD700" }}>
                📊 HIGHSCORE PICK
              </div>
              {deadlinePassed ? (
                <p className="font-pixel" style={{ fontSize: "7px", color: "var(--c-text-4)" }}>
                  Deadline verstreken voor deze ronde.
                </p>
              ) : (
                <SurvivorPickForm
                  mode="HIGHSCORE"
                  round={activeRound}
                  currentPickTeamId={currentPick("HIGHSCORE")}
                  usedTeamIds={usedTeams("HIGHSCORE")}
                  availableTeams={teamsInRound}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Standings */}
      <div className="pixel-card overflow-hidden">
        <div className="px-5 py-3" style={{ background: "#0a1f3d", borderBottom: "3px solid #000" }}>
          <h2 className="font-pixel text-white" style={{ fontSize: "9px" }}>
            🏆 STANDEN ({allEntries.length} deelnemers)
          </h2>
        </div>

        {allEntries.length === 0 ? (
          <div className="p-6 text-center">
            <p className="font-pixel" style={{ fontSize: "8px", color: "var(--c-text-4)" }}>
              Nog geen deelnemers. Wees de eerste!
            </p>
          </div>
        ) : (
          <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" } as React.CSSProperties}>
            {/* Table header */}
            <div
              className="grid px-4 py-2"
              style={{
                gridTemplateColumns: "minmax(120px, 1fr) 90px 80px 80px 90px",
                gap: "8px",
                minWidth: "480px",
                background: "var(--c-surface-deep)",
                borderBottom: "2px solid var(--c-border)",
              }}
            >
              {["NAAM", "HARDCORE", "HIGHSCORE", "PICK HC", "PICK HS"].map((h) => (
                <span key={h} className="font-pixel" style={{ fontSize: "6px", color: "var(--c-text-4)" }}>
                  {h}
                </span>
              ))}
            </div>

            {sortedEntries.map((entry, i) => {
              const isMe = entry.userId === session.user.id
              const hcPick = activeRound ? entry.picks.find((p) => p.round === activeRound && p.mode === "HARDCORE") : null
              const hsPick = activeRound ? entry.picks.find((p) => p.round === activeRound && p.mode === "HIGHSCORE") : null
              const rank = i + 1

              return (
                <div
                  key={entry.id}
                  className="grid px-4 py-3 items-center"
                  style={{
                    gridTemplateColumns: "minmax(120px, 1fr) 90px 80px 80px 90px",
                    gap: "8px",
                    minWidth: "480px",
                    borderBottom: "1px solid var(--c-border)",
                    background: isMe ? "#0d1a10" : undefined,
                  }}
                >
                  {/* Name */}
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-pixel shrink-0" style={{ fontSize: "6px", color: "var(--c-text-4)", minWidth: "14px" }}>
                      {rank}.
                    </span>
                    <span
                      className="font-bold truncate"
                      style={{
                        fontSize: "8px",
                        color: isMe ? "#4af56a" : "var(--c-text)",
                      }}
                    >
                      {entry.user.name}
                      {isMe && (
                        <span className="font-pixel ml-1" style={{ fontSize: "5px", color: "#4af56a" }}>
                          (jij)
                        </span>
                      )}
                    </span>
                  </div>

                  {/* HARDCORE status */}
                  <div>
                    {entry.hardcoreAlive ? (
                      <span className="font-pixel" style={{ fontSize: "7px", color: "#4af56a" }}>
                        ALIVE
                      </span>
                    ) : (
                      <div>
                        <span className="font-pixel" style={{ fontSize: "7px", color: "#ff4444" }}>
                          UITG.
                        </span>
                        {entry.hardcoreElimRound && (
                          <div className="font-pixel" style={{ fontSize: "5px", color: "var(--c-text-4)" }}>
                            {ROUND_LABELS[entry.hardcoreElimRound as keyof typeof ROUND_LABELS] ?? entry.hardcoreElimRound}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* HIGHSCORE */}
                  <div>
                    <span
                      className="font-pixel"
                      style={{
                        fontSize: "9px",
                        color: entry.highscoreTotal > 0 ? "#4af56a" : entry.highscoreTotal < 0 ? "#ff4444" : "var(--c-text-3)",
                      }}
                    >
                      {entry.highscoreTotal > 0 ? "+" : ""}{entry.highscoreTotal}
                    </span>
                    {entry.resetUsed && (
                      <span className="font-pixel ml-1" style={{ fontSize: "5px", color: "#ff8800" }} title="Reset gebruikt">
                        🔄
                      </span>
                    )}
                  </div>

                  {/* HC pick this round */}
                  <div>
                    {hcPick ? (
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1">
                          {hcPick.team.flagUrl && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={hcPick.team.flagUrl} alt="" width={16} height={11} style={{ objectFit: "cover" }} />
                          )}
                          <span className="font-pixel" style={{ fontSize: "6px", color: "var(--c-text-2)" }}>
                            {hcPick.team.code}
                          </span>
                        </div>
                        {!deadlinePassed && (
                          <span className="font-pixel" style={{ fontSize: "5px", color: "#4af56a" }}>✓ gekozen</span>
                        )}
                        {deadlinePassed && (
                          <span className="font-pixel" style={{ fontSize: "5px", color: "var(--c-text-4)" }}>
                            {RESULT_ICONS[hcPick.result]} {hcPick.result === "PENDING" ? "bezig" : hcPick.goalDiff !== null ? `${hcPick.goalDiff > 0 ? "+" : ""}${hcPick.goalDiff}` : ""}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="font-pixel" style={{ fontSize: "6px", color: "#333355" }}>
                        {!entry.hardcoreAlive ? "—" : "geen pick"}
                      </span>
                    )}
                  </div>

                  {/* HS pick this round */}
                  <div>
                    {hsPick ? (
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1">
                          {hsPick.team.flagUrl && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={hsPick.team.flagUrl} alt="" width={16} height={11} style={{ objectFit: "cover" }} />
                          )}
                          <span className="font-pixel" style={{ fontSize: "6px", color: "var(--c-text-2)" }}>
                            {hsPick.team.code}
                          </span>
                        </div>
                        {!deadlinePassed && (
                          <span className="font-pixel" style={{ fontSize: "5px", color: "#4af56a" }}>✓ gekozen</span>
                        )}
                        {deadlinePassed && (
                          <span className="font-pixel" style={{ fontSize: "5px", color: "var(--c-text-4)" }}>
                            {RESULT_ICONS[hsPick.result]} {hsPick.result === "PENDING" ? "bezig" : hsPick.goalDiff !== null ? `${hsPick.goalDiff > 0 ? "+" : ""}${hsPick.goalDiff}` : ""}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="font-pixel" style={{ fontSize: "6px", color: "#333355" }}>
                        geen pick
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* History per round (for logged-in participant) */}
      {myEntry && myEntry.picks.length > 0 && (
        <div className="pixel-card overflow-hidden mt-6">
          <div className="px-5 py-3" style={{ background: "#1a0d00", borderBottom: "3px solid #000" }}>
            <h2 className="font-pixel text-white" style={{ fontSize: "9px" }}>📜 JOUW GESCHIEDENIS</h2>
          </div>
          <div>
            {SURVIVOR_ROUNDS.map((round) => {
              const hcPick = myEntry.picks.find((p) => p.round === round && p.mode === "HARDCORE")
              const hsPick = myEntry.picks.find((p) => p.round === round && p.mode === "HIGHSCORE")
              if (!hcPick && !hsPick) return null

              return (
                <div
                  key={round}
                  className="flex items-center gap-4 px-5 py-2.5 flex-wrap"
                  style={{ borderBottom: "1px solid var(--c-border)" }}
                >
                  <span className="font-pixel shrink-0" style={{ fontSize: "7px", color: "var(--c-text-3)", minWidth: "100px" }}>
                    {ROUND_LABELS[round]}
                  </span>

                  {/* HC */}
                  <div className="flex items-center gap-1.5 shrink-0" style={{ minWidth: "90px" }}>
                    <span className="font-pixel" style={{ fontSize: "5px", color: "#ff4444" }}>HC</span>
                    {hcPick ? (
                      <>
                        {hcPick.team.flagUrl && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={hcPick.team.flagUrl} alt="" width={16} height={11} style={{ objectFit: "cover" }} />
                        )}
                        <span className="font-pixel" style={{ fontSize: "6px", color: "var(--c-text-2)" }}>
                          {hcPick.team.code}
                        </span>
                        <span className="font-pixel" style={{ fontSize: "6px" }}>
                          {RESULT_ICONS[hcPick.result]}
                        </span>
                      </>
                    ) : (
                      <span className="font-pixel" style={{ fontSize: "6px", color: "#333355" }}>—</span>
                    )}
                  </div>

                  {/* HS */}
                  <div className="flex items-center gap-1.5 shrink-0" style={{ minWidth: "110px" }}>
                    <span className="font-pixel" style={{ fontSize: "5px", color: "#FFD700" }}>HS</span>
                    {hsPick ? (
                      <>
                        {hsPick.team.flagUrl && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={hsPick.team.flagUrl} alt="" width={16} height={11} style={{ objectFit: "cover" }} />
                        )}
                        <span className="font-pixel" style={{ fontSize: "6px", color: "var(--c-text-2)" }}>
                          {hsPick.team.code}
                        </span>
                        <span className="font-pixel" style={{ fontSize: "6px" }}>
                          {RESULT_ICONS[hsPick.result]}
                        </span>
                        {hsPick.goalDiff !== null && (
                          <span
                            className="font-pixel"
                            style={{
                              fontSize: "6px",
                              color: hsPick.goalDiff > 0 ? "#4af56a" : hsPick.goalDiff < 0 ? "#ff4444" : "var(--c-text-3)",
                            }}
                          >
                            ({hsPick.goalDiff > 0 ? "+" : ""}{hsPick.goalDiff})
                          </span>
                        )}
                        {hsPick.cycle === 1 && (
                          <span className="font-pixel" style={{ fontSize: "5px", color: "#ff8800" }} title="Na reset">🔄</span>
                        )}
                      </>
                    ) : (
                      <span className="font-pixel" style={{ fontSize: "6px", color: "#333355" }}>—</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
