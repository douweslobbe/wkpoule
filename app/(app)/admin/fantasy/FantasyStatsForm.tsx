"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { saveFantasyPlayerStats } from "@/lib/actions"

type StatRow = {
  minutesPlayed: number
  goals: number
  assists: number
  shotsSaved: number
  penaltySaved: number
  penaltyMissed: number
  yellowCards: number
  redCards: number
  ownGoals: number
  bonusPoints: number
}

type Player = { id: string; name: string; position: string; teamCode: string }

const FIELDS: { key: keyof StatRow; label: string; title: string }[] = [
  { key: "minutesPlayed", label: "Min", title: "Minuten gespeeld" },
  { key: "goals", label: "⚽", title: "Doelpunten" },
  { key: "assists", label: "🅰", title: "Assists" },
  { key: "shotsSaved", label: "🧤", title: "Reddingen (keeper)" },
  { key: "penaltySaved", label: "PK✓", title: "Penalty gestopt" },
  { key: "penaltyMissed", label: "PK✗", title: "Penalty gemist" },
  { key: "yellowCards", label: "🟨", title: "Gele kaarten" },
  { key: "redCards", label: "🟥", title: "Rode kaart" },
  { key: "ownGoals", label: "OG", title: "Eigen doelpunten" },
  { key: "bonusPoints", label: "★", title: "Bonuspunten (handmatig)" },
]

const EMPTY: StatRow = {
  minutesPlayed: 0, goals: 0, assists: 0, shotsSaved: 0, penaltySaved: 0,
  penaltyMissed: 0, yellowCards: 0, redCards: 0, ownGoals: 0, bonusPoints: 0,
}

const POS_COLORS: Record<string, string> = { GK: "#FFD700", DEF: "#4499ff", MID: "#4af56a", FWD: "#ff6644" }

export function FantasyStatsForm({
  matchId,
  players,
  initial,
}: {
  matchId: string
  players: Player[]
  initial: Record<string, StatRow>
}) {
  const router = useRouter()
  const [rows, setRows] = useState<Record<string, StatRow>>(() => {
    const r: Record<string, StatRow> = {}
    for (const p of players) r[p.id] = initial[p.id] ? { ...initial[p.id] } : { ...EMPTY }
    return r
  })
  const [isPending, startTransition] = useTransition()
  const [msg, setMsg] = useState("")

  function setField(playerId: string, key: keyof StatRow, raw: string) {
    const value = Math.max(key === "bonusPoints" ? -50 : 0, parseInt(raw || "0", 10) || 0)
    setRows((prev) => ({ ...prev, [playerId]: { ...prev[playerId], [key]: value } }))
  }

  function submit() {
    setMsg("")
    const entries = players.map((p) => ({ playerId: p.id, ...rows[p.id] }))
    startTransition(async () => {
      const res = await saveFantasyPlayerStats(matchId, entries)
      if (res?.error) setMsg("❌ " + res.error)
      else {
        setMsg("✓ Statistieken opgeslagen en teamtotalen herberekend")
        router.refresh()
      }
    })
  }

  if (players.length === 0) {
    return (
      <p className="font-pixel" style={{ fontSize: "8px", color: "var(--c-text-4)", lineHeight: "2" }}>
        Geen spelers van deze wedstrijd zitten in een WK Manager-team — niets in te voeren.
      </p>
    )
  }

  return (
    <div>
      <p className="font-pixel mb-3" style={{ fontSize: "6px", color: "var(--c-text-4)", lineHeight: "1.8" }}>
        Alleen spelers die in minstens één team zitten. Tegendoelpunten en clean sheet worden automatisch uit de
        uitslag afgeleid. Laat een speler op 0 minuten staan als hij niet speelde.
      </p>

      <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" } as React.CSSProperties}>
        <table className="font-pixel" style={{ fontSize: "7px", borderCollapse: "collapse", minWidth: "560px" }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", padding: "4px 6px", color: "var(--c-text-3)", position: "sticky", left: 0, background: "var(--c-surface)" }}>SPELER</th>
              {FIELDS.map((f) => (
                <th key={f.key} title={f.title} style={{ padding: "4px 3px", color: "var(--c-text-3)", minWidth: "30px" }}>{f.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {players.map((p) => (
              <tr key={p.id} style={{ borderTop: "1px solid var(--c-border)" }}>
                <td style={{ padding: "4px 6px", position: "sticky", left: 0, background: "var(--c-surface)", whiteSpace: "nowrap" }}>
                  <span style={{ color: POS_COLORS[p.position] ?? "#fff", marginRight: 4 }}>{p.position}</span>
                  <span style={{ color: "var(--c-text)" }}>{p.name}</span>
                  <span style={{ color: "var(--c-text-5)", marginLeft: 4 }}>{p.teamCode}</span>
                </td>
                {FIELDS.map((f) => (
                  <td key={f.key} style={{ padding: "2px 3px", textAlign: "center" }}>
                    <input
                      type="number"
                      inputMode="numeric"
                      value={rows[p.id][f.key]}
                      onChange={(e) => setField(p.id, f.key, e.target.value)}
                      style={{
                        width: f.key === "minutesPlayed" ? "32px" : "26px",
                        fontSize: "8px",
                        textAlign: "center",
                        background: "var(--c-input-bg)",
                        color: "var(--c-text)",
                        border: "1px solid var(--c-border-mid)",
                        padding: "3px 1px",
                        outline: "none",
                      }}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-3 mt-4 flex-wrap">
        <button
          onClick={submit}
          disabled={isPending}
          className="font-pixel px-4 py-2"
          style={{ fontSize: "8px", background: isPending ? "#1a2a1a" : "#0a3d1f", color: "#4af56a", border: "2px solid #0a5a2a", cursor: isPending ? "not-allowed" : "pointer" }}
        >
          {isPending ? "OPSLAAN..." : "💾 OPSLAAN & PUNTEN BEREKENEN"}
        </button>
        {msg && <span className="font-pixel" style={{ fontSize: "7px", color: msg.startsWith("✓") ? "#4af56a" : "#ff6666" }}>{msg}</span>}
      </div>
    </div>
  )
}
