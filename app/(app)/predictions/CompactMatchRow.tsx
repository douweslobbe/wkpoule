"use client"

import { useState, useEffect, useRef, useTransition } from "react"
import { savePrediction } from "@/lib/actions"
import { PixelFlag } from "@/components/PixelFlag"
import { DeadlineDisplay } from "@/components/DeadlineDisplay"

function formatGroup(g: string | null): string {
  if (!g) return ""
  return g.replace(/^GROUP_/, "Groep ").replace(/_/g, " ")
}

type Match = {
  id: string
  groupName: string | null
  kickoff: Date
  status: string
  homeScore: number | null
  awayScore: number | null
  homeTeam: { code: string; nameNl: string | null; name: string } | null
  awayTeam: { code: string; nameNl: string | null; name: string } | null
}

type Prediction = { homeScore: number; awayScore: number; pointsAwarded: number | null } | undefined

export function CompactMatchRow({
  match,
  myPred,
  viewPred,
  isOwnView,
  locked,
}: {
  match: Match
  myPred: Prediction
  viewPred: Prediction
  isOwnView: boolean
  locked: boolean
}) {
  const finished = match.status === "FINISHED"
  const live = match.status === "LIVE"
  const deadline = new Date(match.kickoff.getTime() - 30 * 60 * 1000)
  const isUnfilled = isOwnView && !locked && myPred === undefined

  const [home, setHome] = useState(myPred?.homeScore?.toString() ?? "")
  const [away, setAway] = useState(myPred?.awayScore?.toString() ?? "")
  const [saveStatus, setSaveStatus] = useState<"idle" | "debouncing" | "saving" | "saved" | "error">(
    myPred?.homeScore !== undefined && myPred?.awayScore !== undefined ? "saved" : "idle"
  )
  const [error, setError] = useState("")
  const [isPending, startTransition] = useTransition()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isInitial = useRef(true)

  useEffect(() => {
    if (isInitial.current) {
      isInitial.current = false
      return
    }
    if (home === "" || away === "") {
      setSaveStatus("idle")
      return
    }

    setSaveStatus("debouncing")
    if (debounceRef.current) clearTimeout(debounceRef.current)

    debounceRef.current = setTimeout(() => {
      setSaveStatus("saving")
      const fd = new FormData()
      fd.set("matchId", match.id)
      fd.set("homeScore", home)
      fd.set("awayScore", away)
      startTransition(async () => {
        const result = await savePrediction(fd)
        if (result?.error) {
          setError(result.error)
          setSaveStatus("error")
        } else {
          setError("")
          setSaveStatus("saved")
        }
      })
    }, 700)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [home, away, match.id])

  const homeName = match.homeTeam?.nameNl ?? match.homeTeam?.name ?? "?"
  const awayName = match.awayTeam?.nameNl ?? match.awayTeam?.name ?? "?"

  const dateStr = new Date(match.kickoff).toLocaleString("nl-NL", {
    weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
  })
  const deadlineStr = deadline.toLocaleString("nl-NL", {
    day: "numeric", month: "long", hour: "2-digit", minute: "2-digit",
  })

  const statusLabel =
    saveStatus === "debouncing" || saveStatus === "saving" || isPending
      ? "OPSL..."
      : saveStatus === "saved"
      ? "✓"
      : saveStatus === "error"
      ? "✕"
      : ""

  const statusColor =
    saveStatus === "saved" ? "#4af56a"
    : saveStatus === "error" ? "#ff4444"
    : "var(--c-text-4)"

  function adj(val: string, delta: number) {
    const n = Math.min(20, Math.max(0, parseInt(val || "0") + delta))
    return n.toString()
  }

  return (
    <div
      className={isUnfilled ? "match-unfilled" : ""}
      style={{
        background: live ? "#1a0d00" : undefined,
        borderBottom: "2px solid var(--c-border)",
        borderLeft: live ? "3px solid #ff4444" : isUnfilled ? "3px solid #FF6200" : "3px solid transparent",
      }}
    >
      {/* Top meta bar */}
      <div className="flex items-center justify-between px-3 pt-2 pb-1" style={{ borderBottom: "1px solid var(--c-border)", fontSize: "10px" }}>
        <span style={{ color: "var(--c-text-4)" }}>
          {match.groupName && (
            <span className="font-semibold mr-1" style={{ color: "var(--c-text-3)" }}>{formatGroup(match.groupName)} ·</span>
          )}
          {dateStr}
        </span>
        <span className="font-bold" style={{ fontSize: "9px" }}>
          {live ? (
            <span className="pixel-live">● LIVE</span>
          ) : locked ? (
            <span className="font-pixel" style={{ fontSize: "9px", color: "#cc2222" }}>🔒 GESLOTEN</span>
          ) : (
            <DeadlineDisplay deadline={deadline} />
          )}
        </span>
      </div>

      {/* Main match row */}
      <div className="flex items-center gap-2 px-3 py-2.5">
        {/* Thuisploeg */}
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          {match.homeTeam?.code && <PixelFlag code={match.homeTeam.code} size="sm" />}
          <span className="font-bold truncate" style={{ color: "var(--c-text)", fontSize: "9px", fontFamily: "var(--font-pixel), monospace" }}>{homeName}</span>
        </div>

        {/* Midden: score of invoer */}
        <div className="shrink-0 flex items-center gap-1.5">
          {isOwnView && !locked ? (
            /* Eigen invoer */
            <>
              {/* Thuis +/- */}
              <div className="flex items-center gap-0.5">
                <button type="button" onClick={() => setHome(adj(home, -1))} className="pixel-pm">–</button>
                <input
                  type="number" min={0} max={20}
                  value={home}
                  onChange={(e) => setHome(e.target.value)}
                  className="pixel-input w-8 text-center font-bold text-sm py-1"
                  placeholder="–"
                />
                <button type="button" onClick={() => setHome(adj(home, +1))} className="pixel-pm">+</button>
              </div>
              <span className="font-bold text-sm" style={{ color: "var(--c-text-4)" }}>–</span>
              {/* Uit +/- */}
              <div className="flex items-center gap-0.5">
                <button type="button" onClick={() => setAway(adj(away, -1))} className="pixel-pm">–</button>
                <input
                  type="number" min={0} max={20}
                  value={away}
                  onChange={(e) => setAway(e.target.value)}
                  className="pixel-input w-8 text-center font-bold text-sm py-1"
                  placeholder="–"
                />
                <button type="button" onClick={() => setAway(adj(away, +1))} className="pixel-pm">+</button>
              </div>
              <span className="font-pixel" style={{ fontSize: "7px", minWidth: "2rem", textAlign: "center", color: statusColor }}>
                {statusLabel}
              </span>
            </>
          ) : finished || live ? (
            /* Eindstand / Live score */
            <div className="flex items-center gap-1">
              <span className="w-8 text-center font-pixel py-0.5 text-sm" style={{
                background: "#000",
                color: live ? "#ff4444" : "#FFD700",
                border: live ? "2px solid #ff4444" : "2px solid #333",
              }}>
                {match.homeScore ?? "?"}
              </span>
              <span style={{ color: live ? "#ff4444" : "var(--c-text-4)" }}>–</span>
              <span className="w-8 text-center font-pixel py-0.5 text-sm" style={{
                background: "#000",
                color: live ? "#ff4444" : "#FFD700",
                border: live ? "2px solid #ff4444" : "2px solid #333",
              }}>
                {match.awayScore ?? "?"}
              </span>
            </div>
          ) : (
            <span className="font-pixel px-2" style={{ fontSize: "9px", color: "var(--c-text-5)" }}>VS</span>
          )}
        </div>

        {/* Uitploeg */}
        <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-end">
          <span className="font-bold truncate text-right" style={{ color: "var(--c-text)", fontSize: "9px", fontFamily: "var(--font-pixel), monospace" }}>{awayName}</span>
          {match.awayTeam?.code && <PixelFlag code={match.awayTeam.code} size="sm" />}
        </div>
      </div>

      {/* Voorspelling tonen (vergrendeld of anderen bekijken) */}
      {(!isOwnView || (isOwnView && locked)) && (
        <div className="flex items-center justify-center gap-2 px-3 pb-2" style={{ borderTop: "1px solid var(--c-border)", fontSize: "11px" }}>
          {viewPred ? (
            <>
              <span style={{ color: "var(--c-text-4)" }}>{isOwnView ? "Jouw pick:" : "Pick:"}</span>
              <span className="font-pixel" style={{ color: "#FF6200", fontSize: "10px" }}>
                {viewPred.homeScore} – {viewPred.awayScore}
              </span>
              {viewPred.pointsAwarded !== null && (
                <span className="font-pixel px-1.5 py-0.5 text-white" style={{
                  background: viewPred.pointsAwarded > 0 ? "#16a34a" : "var(--c-text-5)",
                  fontSize: "7px",
                  border: "1px solid #000",
                }}>
                  +{viewPred.pointsAwarded}pt
                </span>
              )}
            </>
          ) : (
            <span className="italic" style={{ color: "var(--c-text-5)", fontSize: "10px" }}>Geen voorspelling</span>
          )}
        </div>
      )}

      {error && <p className="text-center text-xs pb-2" style={{ color: "#ff4444" }}>{error}</p>}
    </div>
  )
}
