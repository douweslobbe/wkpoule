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
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">(
    currentTeamId ? "saved" : "idle"
  )
  const [error, setError] = useState("")
  const [query, setQuery] = useState("")
  const [isPending, startTransition] = useTransition()

  const filtered = teams.filter((t) =>
    t.name.toLowerCase().includes(query.toLowerCase())
  )

  function handleSelect(teamId: string) {
    setSelected(teamId)
    setQuery("")
    setError("")
    setSaveStatus("saving")

    const fd = new FormData()
    fd.set("poolId", poolId)
    fd.set("teamId", teamId)
    startTransition(async () => {
      const result = await saveChampionPick(fd)
      if (result?.error) {
        setError(result.error)
        setSaveStatus("error")
      } else {
        setSaveStatus("saved")
      }
    })
  }

  const selectedTeam = teams.find((t) => t.id === selected)

  const bannerLabel =
    isPending || saveStatus === "saving"
      ? "OPSLAAN..."
      : saveStatus === "saved"
      ? "✓ OPGESLAGEN"
      : saveStatus === "error"
      ? "✕ FOUT"
      : "GESELECTEERD ◄"

  const bannerColor =
    saveStatus === "saved" ? "#4af56a"
    : saveStatus === "error" ? "#ff4444"
    : "#FF6200"

  return (
    <div>
      <h2 className="font-pixel mb-3" style={{ fontSize: "8px", color: "var(--c-text-2)" }}>
        WIE WORDT WERELDKAMPIOEN?
      </h2>

      {selectedTeam && (
        <div className="flex items-center gap-2 mb-4 p-3" style={{
          background: "var(--c-surface-deep)",
          border: `2px solid ${bannerColor}`,
          boxShadow: "2px 2px 0 #000",
        }}>
          <PixelFlag code={selectedTeam.code} size="sm" />
          <span className="font-bold text-sm" style={{ color: bannerColor }}>{selectedTeam.name}</span>
          <span className="ml-auto font-pixel" style={{ fontSize: "7px", color: bannerColor }}>
            {bannerLabel}
          </span>
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
            onClick={() => handleSelect(t.id)}
            disabled={isPending}
            className={`pixel-list-item ${selected === t.id ? "selected" : ""}`}
          >
            <PixelFlag code={t.code} size="sm" />
            <span className="text-sm font-medium">{t.name}</span>
            {selected === t.id && (
              <span className="ml-auto font-pixel" style={{ fontSize: "7px", color: bannerColor }}>
                {saveStatus === "saved" ? "✓" : saveStatus === "saving" || isPending ? "..." : "✓"}
              </span>
            )}
          </button>
        ))}
        {filtered.length === 0 && (
          <p className="text-center text-sm py-6" style={{ color: "var(--c-text-5)" }}>Geen landen gevonden</p>
        )}
      </div>

      {error && <p className="text-xs mt-2" style={{ color: "#ff4444" }}>{error}</p>}
    </div>
  )
}
