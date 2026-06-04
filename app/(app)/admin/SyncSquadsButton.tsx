"use client"

import { useState, useRef } from "react"
import { syncSquads } from "@/lib/actions"

type Status = "idle" | "running" | "waiting" | "done" | "error"

export function SyncSquadsButton() {
  const [status, setStatus] = useState<Status>("idle")
  const [synced, setSynced] = useState(0)
  const [total, setTotal] = useState(0)
  const [players, setPlayers] = useState(0)
  const [countdown, setCountdown] = useState(0)
  const [error, setError] = useState("")
  const cancelRef = useRef(false)

  function wait(seconds: number): Promise<void> {
    return new Promise((resolve) => {
      let s = seconds
      setCountdown(s)
      const id = setInterval(() => {
        s -= 1
        setCountdown(s)
        if (s <= 0 || cancelRef.current) {
          clearInterval(id)
          resolve()
        }
      }, 1000)
    })
  }

  async function runLoop(reset: boolean) {
    cancelRef.current = false
    setError("")
    setPlayers(0)
    setStatus("running")

    let first = true
    let totalPlayers = 0

    while (!cancelRef.current) {
      const res = await syncSquads(first ? reset : false)
      first = false

      if (!res.ok) {
        setError(res.error ?? "Onbekende fout")
        setSynced(res.syncedTeams)
        setTotal(res.totalTeams)
        setStatus("error")
        return
      }

      totalPlayers += res.playersUpserted
      setSynced(res.syncedTeams)
      setTotal(res.totalTeams)
      setPlayers(totalPlayers)

      if (res.finished) {
        setStatus("done")
        return
      }

      // Wachten i.v.m. football-data rate limit (10 calls/min)
      setStatus("waiting")
      await wait(62)
      if (cancelRef.current) {
        setStatus("idle")
        return
      }
      setStatus("running")
    }
    setStatus("idle")
  }

  function stop() {
    cancelRef.current = true
  }

  const pct = total > 0 ? Math.round((synced / total) * 100) : 0
  const busy = status === "running" || status === "waiting"

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3 flex-wrap">
        {!busy ? (
          <button
            onClick={() => runLoop(status === "done")}
            className="pixel-btn px-4 py-2 font-pixel"
            style={{ background: "#2a0a4a", color: "#d7aaff", border: "2px solid #4a1a6a", fontSize: "8px" }}
          >
            {status === "done" ? "🔄 SELECTIES OPNIEUW SYNCEN" : "👥 SYNC SELECTIES"}
          </button>
        ) : (
          <button
            onClick={stop}
            className="pixel-btn px-4 py-2 font-pixel"
            style={{ background: "#3a1500", color: "#ffaa66", border: "2px solid #6a2a00", fontSize: "8px" }}
          >
            ⏹ STOP
          </button>
        )}

        {status === "waiting" && (
          <span className="font-pixel" style={{ fontSize: "7px", color: "var(--c-text-3)" }}>
            ⏳ Volgende batch over {countdown}s (rate limit)
          </span>
        )}
        {status === "running" && (
          <span className="font-pixel" style={{ fontSize: "7px", color: "#4af5ff" }}>BEZIG…</span>
        )}
        {status === "done" && (
          <span className="font-pixel" style={{ fontSize: "7px", color: "#4af56a" }}>
            ✓ Klaar — {synced}/{total} landen, {players} spelers
          </span>
        )}
      </div>

      {total > 0 && status !== "idle" && (
        <div>
          <div className="relative h-3 w-full" style={{ background: "var(--c-surface-deep)", border: "2px solid #000" }}>
            <div
              className="h-full transition-all"
              style={{ width: `${pct}%`, background: status === "error" ? "#ff4444" : pct === 100 ? "#16a34a" : "#a855f7" }}
            />
          </div>
          <span className="font-pixel" style={{ fontSize: "6px", color: "var(--c-text-4)" }}>
            {synced}/{total} landen · {players} spelers bijgewerkt
          </span>
        </div>
      )}

      {error && (
        <p className="font-pixel" style={{ fontSize: "7px", color: "#ff6666", lineHeight: "1.7" }}>❌ {error}</p>
      )}
    </div>
  )
}
