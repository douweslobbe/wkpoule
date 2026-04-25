"use client"

import { useState, useEffect, useRef, useTransition } from "react"
import { savePrediction, toggleJoker } from "@/lib/actions"
import { PixelFlag } from "@/components/PixelFlag"
import { DeadlineDisplay } from "@/components/DeadlineDisplay"
import { PixelConfetti } from "@/components/PixelConfetti"
import { playSave, playPowerUp, playError } from "@/lib/pixel-sound"

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

type Prediction = { homeScore: number; awayScore: number; pointsAwarded: number | null; isJoker?: boolean } | undefined

export function CompactMatchRow({
  match,
  myPred,
  viewPred,
  isOwnView,
  locked,
  jokerAllowed = false,
  jokersRemaining = 0,
}: {
  match: Match
  myPred: Prediction
  viewPred: Prediction
  isOwnView: boolean
  locked: boolean
  jokerAllowed?: boolean
  jokersRemaining?: number
}) {
  const finished = match.status === "FINISHED"
  const live = match.status === "LIVE"
  const deadline = new Date(match.kickoff.getTime() - 30 * 60 * 1000)
  const isUnfilled = isOwnView && !locked && myPred === undefined

  const [home, setHome] = useState(myPred?.homeScore?.toString() ?? "")
  const [away, setAway] = useState(myPred?.awayScore?.toString() ?? "")
  const [isJoker, setIsJoker] = useState(myPred?.isJoker ?? false)
  const [jokerError, setJokerError] = useState("")
  const [jokerPending, startJokerTransition] = useTransition()
  const [popupKey, setPopupKey] = useState(0)
  const [showPopup, setShowPopup] = useState(false)
  const [saveStatus, setSaveStatus] = useState<"idle" | "debouncing" | "saving" | "saved" | "error">(
    myPred?.homeScore !== undefined && myPred?.awayScore !== undefined ? "saved" : "idle"
  )
  const [error, setError] = useState("")
  const [isPending, startTransition] = useTransition()

  function handleToggleJoker() {
    if (jokerPending) return
    setJokerError("")
    const fd = new FormData()
    fd.set("matchId", match.id)
    startJokerTransition(async () => {
      const result = await toggleJoker(fd)
      if (result?.error) {
        setJokerError(result.error)
        playError()
      } else {
        setIsJoker(!!result?.isJoker)
        if (result?.isJoker) playPowerUp()
        else playSave()
      }
    })
  }
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
          playError()
        } else {
          setError("")
          setSaveStatus("saved")
          setPopupKey((k) => k + 1)
          setShowPopup(true)
          playSave()
          setTimeout(() => setShowPopup(false), 1400)
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
        background: live ? "#1a0d00" : isJoker ? "#1a1200" : undefined,
        borderBottom: "2px solid var(--c-border)",
        borderLeft: live
          ? "3px solid #ff4444"
          : isJoker
          ? "3px solid #FFD700"
          : isUnfilled
          ? "3px solid #FF6200"
          : "3px solid transparent",
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
        <span className="font-bold flex items-center gap-2" style={{ fontSize: "9px" }}>
          {isJoker && (
            <span className="font-pixel" style={{ fontSize: "8px", color: "#FFD700", background: "#2a1500", padding: "2px 4px", border: "1px solid #FFD700" }}>
              ★ JOKER ×2
            </span>
          )}
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
        <div className="shrink-0 flex items-center gap-1.5" style={{ position: "relative" }}>
          {showPopup && (
            <>
              <span key={popupKey} className="score-popup">✓ SAVED!</span>
              <PixelConfetti count={10} />
            </>
          )}
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

      {/* Joker toggle (eigen view, niet vergrendeld, joker toegestaan in deze fase, voorspelling al ingevuld) */}
      {isOwnView && !locked && jokerAllowed && myPred !== undefined && (
        <div className="flex items-center justify-center gap-2 px-3 pb-2" style={{ borderTop: "1px solid var(--c-border)" }}>
          <button
            type="button"
            onClick={handleToggleJoker}
            disabled={jokerPending || (!isJoker && jokersRemaining === 0)}
            className="font-pixel px-2 py-1 transition-all"
            style={{
              fontSize: "7px",
              background: isJoker ? "#FFD700" : (jokersRemaining === 0 ? "var(--c-surface-deep)" : "transparent"),
              color: isJoker ? "#000" : (jokersRemaining === 0 ? "var(--c-text-5)" : "#FFD700"),
              border: `2px solid ${isJoker ? "#000" : "#FFD700"}`,
              boxShadow: isJoker ? "2px 2px 0 #000" : "none",
              cursor: (jokerPending || (!isJoker && jokersRemaining === 0)) ? "not-allowed" : "pointer",
              opacity: (!isJoker && jokersRemaining === 0) ? 0.5 : 1,
            }}
            title={isJoker ? "Joker uitzetten" : jokersRemaining === 0 ? "Geen jokers meer in deze ronde" : "Lucky Shot — punten verdubbelen"}
          >
            {jokerPending ? "..." : isJoker ? "★ JOKER ACTIEF — KLIK OM UIT TE ZETTEN" : "★ ZET JOKER IN (×2 PUNTEN)"}
          </button>
          {jokerError && <span className="font-pixel" style={{ fontSize: "6px", color: "#ff4444" }}>{jokerError}</span>}
        </div>
      )}

      {/* Voorspelling tonen (vergrendeld of anderen bekijken) */}
      {(!isOwnView || (isOwnView && locked)) && (
        <div className="flex items-center justify-center gap-2 px-3 pb-2" style={{ borderTop: "1px solid var(--c-border)", fontSize: "11px" }}>
          {viewPred ? (
            <>
              <span style={{ color: "var(--c-text-4)" }}>{isOwnView ? "Jouw pick:" : "Pick:"}</span>
              <span className="font-pixel" style={{ color: "#FF6200", fontSize: "10px" }}>
                {viewPred.homeScore} – {viewPred.awayScore}
              </span>
              {viewPred.isJoker && (
                <span className="font-pixel px-1 py-0.5" style={{ background: "#FFD700", color: "#000", fontSize: "7px", border: "1px solid #000" }}>
                  ★ JOKER
                </span>
              )}
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
