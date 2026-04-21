"use client"

import { useState, useTransition } from "react"
import { savePrediction } from "@/lib/actions"
import { PixelFlag } from "@/components/PixelFlag"

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
    <div
      className="pixel-card rounded-none"
      style={{ borderLeft: "none", borderRight: "none", borderTop: "none", boxShadow: "none" }}
    >
      {/* Top meta bar */}
      <div className="flex items-center justify-between px-3 pt-2 pb-1 text-xs" style={{ borderBottom: "1px solid #e5e7eb" }}>
        <span className="text-gray-400">
          {match.groupName && <span className="font-semibold text-gray-500 mr-1">{match.groupName}</span>}
          {dateStr}
        </span>
        <span className={`font-bold ${locked ? "text-red-400" : "text-green-500"}`}>
          {locked ? "🔒" : `Sluit: ${deadlineStr}`}
        </span>
      </div>

      {/* Main match row */}
      <div className="flex items-center gap-2 px-3 py-2.5">
        {/* Thuisploeg */}
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          {match.homeTeam?.code && <PixelFlag code={match.homeTeam.code} size="sm" />}
          <span className="font-semibold text-sm text-gray-900 truncate">{homeName}</span>
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
                className="w-10 text-center font-bold text-sm py-1 focus:outline-none focus:ring-2 focus:ring-orange-400"
                style={{ border: "2px solid #1a1a2e" }}
                placeholder="–"
              />
              <span className="text-gray-400 font-bold text-sm">–</span>
              <input
                type="number" min={0} max={20}
                value={away}
                onChange={(e) => { setAway(e.target.value); setSaved(false) }}
                onKeyDown={(e) => e.key === "Enter" && handleSave()}
                className="w-10 text-center font-bold text-sm py-1 focus:outline-none focus:ring-2 focus:ring-orange-400"
                style={{ border: "2px solid #1a1a2e" }}
                placeholder="–"
              />
              <button
                onClick={handleSave}
                disabled={isPending || home === "" || away === ""}
                className="px-2 py-1 text-xs font-bold disabled:opacity-40 transition-all"
                style={{
                  background: saved && !error ? "#16a34a" : "#FF6200",
                  color: "white",
                  border: "2px solid #1a1a2e",
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
              <span className="w-8 text-center font-pixel py-0.5 text-sm" style={{ background: "#1a1a2e", color: "#FFD700" }}>
                {match.homeScore}
              </span>
              <span className="text-gray-400">–</span>
              <span className="w-8 text-center font-pixel py-0.5 text-sm" style={{ background: "#1a1a2e", color: "#FFD700" }}>
                {match.awayScore}
              </span>
            </div>
          ) : (
            <span className="font-pixel text-gray-300 px-2" style={{ fontSize: "9px" }}>VS</span>
          )}
        </div>

        {/* Uitploeg */}
        <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-end">
          <span className="font-semibold text-sm text-gray-900 truncate text-right">{awayName}</span>
          {match.awayTeam?.code && <PixelFlag code={match.awayTeam.code} size="sm" />}
        </div>
      </div>

      {/* Voorspelling tonen (vergrendeld of anderen bekijken) */}
      {(!isOwnView || (isOwnView && locked)) && (
        <div className="flex items-center justify-center gap-2 px-3 pb-2 text-xs" style={{ borderTop: "1px solid #f3f4f6" }}>
          {viewPred ? (
            <>
              <span className="text-gray-400">{isOwnView ? "Jouw pick:" : "Pick:"}</span>
              <span className="font-pixel" style={{ color: "#FF6200", fontSize: "10px" }}>
                {viewPred.homeScore} – {viewPred.awayScore}
              </span>
              {viewPred.pointsAwarded !== null && (
                <span className="font-pixel px-1.5 py-0.5 text-white" style={{
                  background: viewPred.pointsAwarded > 0 ? "#16a34a" : "#6b7280",
                  fontSize: "7px",
                }}>
                  +{viewPred.pointsAwarded}pt
                </span>
              )}
            </>
          ) : (
            <span className="text-gray-300 italic">Geen voorspelling</span>
          )}
        </div>
      )}

      {error && <p className="text-center text-xs text-red-500 pb-2">{error}</p>}
    </div>
  )
}
