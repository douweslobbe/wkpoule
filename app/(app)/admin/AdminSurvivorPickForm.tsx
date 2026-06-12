"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { adminSetSurvivorPick } from "@/lib/actions"

type U = { id: string; name: string }
type T = { id: string; label: string; code: string }

const selectStyle = {
  fontSize: "8px",
  background: "var(--c-input-bg)",
  color: "var(--c-text)",
  border: "2px solid var(--c-border-mid)",
  outline: "none",
  padding: "6px 8px",
} as const

export function AdminSurvivorPickForm({
  round,
  roundLabel,
  users,
  teams,
}: {
  round: string
  roundLabel: string
  users: U[]
  teams: T[]
}) {
  const router = useRouter()
  const [userId, setUserId] = useState("")
  const [mode, setMode] = useState<"HARDCORE" | "HIGHSCORE">("HARDCORE")
  const [teamId, setTeamId] = useState("")
  const [result, setResult] = useState<{ ok?: boolean; error?: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  function submit() {
    if (!userId || !teamId) {
      setResult({ error: "Kies een gebruiker en een team" })
      return
    }
    setResult(null)
    startTransition(async () => {
      const res = await adminSetSurvivorPick(userId, mode, round, teamId)
      if ("error" in res && res.error) setResult({ error: res.error })
      else {
        setResult({ ok: true })
        setTeamId("")
        router.refresh()
      }
    })
  }

  return (
    <div className="space-y-3">
      <p className="font-pixel" style={{ fontSize: "7px", color: "var(--c-text-3)" }}>
        Ronde: <strong style={{ color: "#FFD700" }}>{roundLabel}</strong> · deadline wordt overgeslagen
      </p>
      <div className="flex gap-2 flex-wrap items-center">
        <select value={userId} onChange={(e) => setUserId(e.target.value)} style={selectStyle}>
          <option value="">— gebruiker —</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>{u.name}</option>
          ))}
        </select>
        <select value={mode} onChange={(e) => setMode(e.target.value as "HARDCORE" | "HIGHSCORE")} style={selectStyle}>
          <option value="HARDCORE">💀 HARDCORE</option>
          <option value="HIGHSCORE">📊 HIGHSCORE</option>
        </select>
        <select value={teamId} onChange={(e) => setTeamId(e.target.value)} style={selectStyle}>
          <option value="">— team —</option>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>{t.label} ({t.code})</option>
          ))}
        </select>
        <button
          onClick={submit}
          disabled={isPending}
          className="font-pixel px-4 py-2"
          style={{ fontSize: "8px", background: isPending ? "#1a2a1a" : "#0a3d1f", color: "#4af56a", border: "2px solid #0a5a2a", cursor: isPending ? "not-allowed" : "pointer" }}
        >
          {isPending ? "..." : "PICK ZETTEN"}
        </button>
      </div>
      {result?.ok && <p className="font-pixel" style={{ fontSize: "7px", color: "#4af56a" }}>✓ Pick gezet</p>}
      {result?.error && <p className="font-pixel" style={{ fontSize: "7px", color: "#ff6666" }}>❌ {result.error}</p>}
    </div>
  )
}
