"use client"

import { useState, useTransition } from "react"
import { saveChampionPick } from "@/lib/actions"

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

  async function handleSave() {
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
      <h2 className="font-semibold text-gray-900 mb-3">Wie wordt wereldkampioen?</h2>

      {selectedTeam && (
        <div className="flex items-center gap-2 mb-4 p-3 bg-orange-50 rounded-xl border border-orange-200">
          {selectedTeam.flagUrl && (
            <img src={selectedTeam.flagUrl} alt="" className="w-9 h-7 object-contain" />
          )}
          <span className="font-semibold text-orange-800">{selectedTeam.name}</span>
          <span className="ml-auto text-xs text-orange-600">geselecteerd</span>
        </div>
      )}

      <input
        type="text"
        placeholder="Zoek land..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
      />

      <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-xl divide-y divide-gray-100">
        {filtered.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => { setSelected(t.id); setSaved(false) }}
            className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50 transition-colors ${
              selected === t.id ? "bg-orange-50" : ""
            }`}
          >
            {t.flagUrl && <img src={t.flagUrl} alt="" className="w-7 h-5 object-contain shrink-0" />}
            <span className={`text-sm font-medium ${selected === t.id ? "text-orange-700" : "text-gray-700"}`}>
              {t.name}
            </span>
            {selected === t.id && <span className="ml-auto text-orange-500 text-xs">✓</span>}
          </button>
        ))}
        {filtered.length === 0 && (
          <p className="text-center text-gray-400 text-sm py-6">Geen landen gevonden</p>
        )}
      </div>

      {error && <p className="text-xs text-red-600 mt-2">{error}</p>}

      <button
        type="button"
        onClick={handleSave}
        disabled={!selected || isPending}
        className="mt-4 w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition-colors"
      >
        {isPending ? "Opslaan..." : saved ? "Opgeslagen ✓" : "Kampioen opslaan"}
      </button>
    </div>
  )
}
