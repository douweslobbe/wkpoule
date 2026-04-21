"use client"

import { useState, useTransition } from "react"
import { savePrediction } from "@/lib/actions"
import { PixelFlag } from "@/components/PixelFlag"

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
  const deadline = new Date(match.kickoff.getTime() - 30 * 60 * 1000)

  const [home, setHome] = useState(myPred?.homeScore?.toString() ?? "")
  const [away, setAway] = useState(myPred?.awayScore?.toString() ?? "")
  const [saved, setSaved] = useState(home !== "" && away !== "")
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState("")

  function handleSave() {
    if (home === "" || away === "") return
    setError("")
    const fd = new FormData()
    fd.set("matchId", match.id)
    fd.set("homeScore", home)
    fd.set("awayScore", away)
    startTransition(async () => {
      const result = await savePrediction(fd)
      if (result?.error) setError(result.error)
      else setSaved(true)
    })
  }

  const homeName = match.homeTeam?.nameNl ?? match.homeTeam?.name ?? "?"
  const awayName = match.awayTeam?.nameNl ?? match.awayTeam?.name ?? "?"

  const dateStr = new Date(match.kickoff).toLocaleString("nl-NL", {
    weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
  })
  const deadlineStr = deadline.toLocaleString("nl-NL", {
    day: "numeric", month: "long", hour: "2-digit", minute: "2-digit",
  })

  return (
    <div style={{ background: "#161928", borderBottom: "2px solid #1a1d30" }}>
      {/* Top meta bar */}
      <div className="flex items-center justify-between px-3 pt-2 pb-1" style={{ borderBottom: "1px solid #1a1d30", fontSize: "10px" }}>
        <span style={{ color: "#444466" }}>
          {match.groupName && (
            <span className="font-semibold mr-1" style={{ color: "#555577" }}>{formatGroup(match.groupName)} ·</span>
          )}
          {dateStr}
        </span>
        <span className="font-bold" style={{ color: locked ? "#cc2222" : "#4af56a", fontSize: "9px" }}>
          {locked ? "🔒 GESLOTEN" : `Sluit: ${deadlineStr}`}
        </span>
      </div>

      {/* Main match row */}
      <div className="flex items-center gap-2 px-3 py-2.5">
        {/* Thuisploeg */}
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          {match.homeTeam?.code && <PixelFlag code={match.homeTeam.code} size="sm" />}
          <span className="font-semibold text-sm truncate" style={{ color: "#e0e0f0" }}>{homeName}</span>
        </div>

        {/* Midden: score of invoer */}
        <div className="shrink-0 flex items-center gap-1.5">
          {isOwnView && !locked ? (
            /* Eigen invoer */
            <>
              <input
                type="number" min={0} max={20}
                value={home}
                onChange={(e) => { setHome(e.target.value); setSaved(false) }}
                onKeyDown={(e) => e.key === "Enter" && handleSave()}
                className="pixel-input w-10 text-center font-bold text-sm py-1"
                placeholder="–"
              />
              <span className="font-bold text-sm" style={{ color: "#444466" }}>–</span>
              <input
                type="number" min={0} max={20}
                value={away}
                onChange={(e) => { setAway(e.target.value); setSaved(false) }}
                onKeyDown={(e) => e.key === "Enter" && handleSave()}
                className="pixel-input w-10 text-center font-bold text-sm py-1"
                placeholder="–"
              />
              <button
                onClick={handleSave}
                disabled={isPending || home === "" || away === ""}
                className="px-2 py-1 font-bold disabled:opacity-40 transition-all"
                style={{
                  background: saved && !error ? "#16a34a" : "#FF6200",
                  color: "white",
                  border: "2px solid #000",
                  boxShadow: "2px 2px 0 #000",
                  fontFamily: "var(--font-pixel), monospace",
                  fontSize: "7px",
                  minWidth: "4rem",
                }}
              >
                {isPending ? "..." : saved && !error ? "✓ OK" : "OPSLAAN"}
              </button>
            </>
          ) : finished ? (
            /* Eindstand */
            <div className="flex items-center gap-1">
              <span className="w-8 text-center font-pixel py-0.5 text-sm" style={{ background: "#000", color: "#FFD700", border: "2px solid #333" }}>
                {match.homeScore}
              </span>
              <span style={{ color: "#444466" }}>–</span>
              <span className="w-8 text-center font-pixel py-0.5 text-sm" style={{ background: "#000", color: "#FFD700", border: "2px solid #333" }}>
                {match.awayScore}
              </span>
            </div>
          ) : (
            <span className="font-pixel px-2" style={{ fontSize: "9px", color: "#333355" }}>VS</span>
          )}
        </div>

        {/* Uitploeg */}
        <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-end">
          <span className="font-semibold text-sm truncate text-right" style={{ color: "#e0e0f0" }}>{awayName}</span>
          {match.awayTeam?.code && <PixelFlag code={match.awayTeam.code} size="sm" />}
        </div>
      </div>

      {/* Voorspelling tonen (vergrendeld of anderen bekijken) */}
      {(!isOwnView || (isOwnView && locked)) && (
        <div className="flex items-center justify-center gap-2 px-3 pb-2" style={{ borderTop: "1px solid #1a1d30", fontSize: "11px" }}>
          {viewPred ? (
            <>
              <span style={{ color: "#444466" }}>{isOwnView ? "Jouw pick:" : "Pick:"}</span>
              <span className="font-pixel" style={{ color: "#FF6200", fontSize: "10px" }}>
                {viewPred.homeScore} – {viewPred.awayScore}
              </span>
              {viewPred.pointsAwarded !== null && (
                <span className="font-pixel px-1.5 py-0.5 text-white" style={{
                  background: viewPred.pointsAwarded > 0 ? "#16a34a" : "#333355",
                  fontSize: "7px",
                  border: "1px solid #000",
                }}>
                  +{viewPred.pointsAwarded}pt
                </span>
              )}
            </>
          ) : (
            <span className="italic" style={{ color: "#333355", fontSize: "10px" }}>Geen voorspelling</span>
          )}
        </div>
      )}

      {error && <p className="text-center text-xs pb-2" style={{ color: "#ff4444" }}>{error}</p>}
    </div>
  )
}
