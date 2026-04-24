"use client"

import { useState, useTransition } from "react"
import { saveChampionPick } from "@/lib/actions"
import { PixelFlag } from "@/components/PixelFlag"

type Team = { id: string; name: string; code: string; flagUrl?: string }

export function ChampionForm({
  poolId,
  teams,
  currentTeamId,
}: {
  poolId: string
  teams: Team[]
  currentTeamId?: string
}) {
  const [selected, setSelected] = useState(currentTeamId ?? "")
  const [saved, setSaved] = useState(!!currentTeamId)
  const [error, setError] = useState("")
  const [query, setQuery] = useState("")
  const [isPending, startTransition] = useTransition()

  const filtered = teams.filter((t) =>
    t.name.toLowerCase().includes(query.toLowerCase())
  )

  function handleSave() {
    if (!selected) return
    setError("")
    const fd = new FormData()
    fd.set("poolId", poolId)
    fd.set("teamId", selected)
    startTransition(async () => {
      const result = await saveChampionPick(fd)
      if (result?.error) setError(result.error)
      else setSaved(true)
    })
  }

  const selectedTeam = teams.find((t) => t.id === selected)

  return (
    <div>
      <h2 className="font-pixel mb-3" style={{ fontSize: "8px", color: "var(--c-text-2)" }}>
        WIE WORDT WERELDKAMPIOEN?
      </h2>

      {selectedTeam && (
        <div className="flex items-center gap-2 mb-4 p-3" style={{
          background: "#1e1200",
          border: "2px solid #FF6200",
          boxShadow: "2px 2px 0 #000",
        }}>
          <PixelFlag code={selectedTeam.code} size="sm" />
          <span className="font-bold text-sm" style={{ color: "#FF6200" }}>{selectedTeam.name}</span>
          <span className="ml-auto font-pixel" style={{ fontSize: "7px", color: "#FF6200" }}>GESELECTEERD ◄</span>
        </div>
      )}

      <input
        type="text"
        placeholder="Zoek land..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="pixel-input w-full px-3 py-2 mb-3"
      />

      <div className="pixel-list">
        {filtered.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => { setSelected(t.id); setSaved(false); setQuery("") }}
            className={`pixel-list-item ${selected === t.id ? "selected" : ""}`}
          >
            <PixelFlag code={t.code} size="sm" />
            <span className="text-sm font-medium">{t.name}</span>
            {selected === t.id && (
              <span className="ml-auto font-pixel" style={{ fontSize: "7px", color: "#FF6200" }}>✓</span>
            )}
          </button>
        ))}
        {filtered.length === 0 && (
          <p className="text-center text-sm py-6" style={{ color: "var(--c-text-5)" }}>Geen landen gevonden</p>
        )}
      </div>

      {error && <p className="text-xs mt-2" style={{ color: "#ff4444" }}>{error}</p>}

      <button
        type="button"
        onClick={handleSave}
        disabled={!selected || isPending}
        className="mt-4 w-full py-2.5 font-bold transition-colors disabled:opacity-50"
        style={{
          background: saved && !error ? "#16a34a" : "#FF6200",
          color: "white",
          border: "3px solid #000",
          boxShadow: "3px 3px 0 #000",
          fontFamily: "var(--font-pixel), monospace",
          fontSize: "8px",
        }}
      >
        {isPending ? "OPSLAAN..." : saved && !error ? "✓ OPGESLAGEN" : "KAMPIOEN OPSLAAN"}
      </button>
    </div>
  )
}
