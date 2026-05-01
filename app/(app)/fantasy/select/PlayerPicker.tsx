"use client"

import { useState, useTransition, useMemo } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { createFantasyTeam } from "@/lib/actions"
import { SQUAD_SIZE, POSITION_LIMITS, MAX_PER_COUNTRY_GROUP } from "@/lib/fantasy"

type PlayerPosition = "GK" | "DEF" | "MID" | "FWD"

type PlayerData = {
  id: string
  name: string
  nameNl: string | null
  position: PlayerPosition
  shirtNumber: number | null
  team: {
    id: string
    code: string
    nameNl: string | null
    name: string
    flagUrl: string | null
  }
}

const POS_ORDER: PlayerPosition[] = ["GK", "DEF", "MID", "FWD"]
const POS_LABELS: Record<PlayerPosition, string> = { GK: "Keeper", DEF: "Verdediger", MID: "Middenvelder", FWD: "Aanvaller" }
const POS_LABELS_PLURAL: Record<PlayerPosition, string> = { GK: "Keepers", DEF: "Verdedigers", MID: "Middenvelders", FWD: "Aanvallers" }
const POS_COLORS: Record<PlayerPosition, string> = { GK: "#FFD700", DEF: "#4499ff", MID: "#4af56a", FWD: "#ff6644" }

export function PlayerPicker({ players }: { players: PlayerData[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [filterPos, setFilterPos] = useState<PlayerPosition | "ALL">("ALL")
  const [filterTeam, setFilterTeam] = useState<string>("ALL")
  const [search, setSearch] = useState("")
  const [nickname, setNickname] = useState("")
  const [error, setError] = useState<string | null>(null)

  // Geselecteerde spelers als objecten
  const selectedPlayers = useMemo(
    () => players.filter((p) => selected.has(p.id)),
    [players, selected]
  )

  // Telling per positie
  const countByPos = useMemo(
    () => selectedPlayers.reduce((acc, p) => { acc[p.position] = (acc[p.position] ?? 0) + 1; return acc }, {} as Record<PlayerPosition, number>),
    [selectedPlayers]
  )

  // Telling per land
  const countByCountry = useMemo(
    () => selectedPlayers.reduce((acc, p) => { acc[p.team.code] = (acc[p.team.code] ?? 0) + 1; return acc }, {} as Record<string, number>),
    [selectedPlayers]
  )

  // Unieke teams voor filter
  const teams = useMemo(() => {
    const map = new Map<string, string>()
    players.forEach((p) => map.set(p.team.code, p.team.nameNl ?? p.team.name))
    return Array.from(map.entries()).sort(([, a], [, b]) => a.localeCompare(b))
  }, [players])

  // Gefilterde spelers
  const filtered = useMemo(() => {
    return players.filter((p) => {
      if (filterPos !== "ALL" && p.position !== filterPos) return false
      if (filterTeam !== "ALL" && p.team.code !== filterTeam) return false
      if (search) {
        const q = search.toLowerCase()
        const displayName = (p.nameNl ?? p.name).toLowerCase()
        if (!displayName.includes(q) && !p.team.code.toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [players, filterPos, filterTeam, search])

  function canSelect(player: PlayerData): { ok: boolean; reason?: string } {
    if (selected.has(player.id)) return { ok: true } // al geselecteerd = deselect

    if (selected.size >= SQUAD_SIZE) return { ok: false, reason: `Maximum ${SQUAD_SIZE} spelers bereikt` }

    const posCount = countByPos[player.position] ?? 0
    const posLimit = POSITION_LIMITS[player.position]
    if (posCount >= posLimit) return { ok: false, reason: `Max ${posLimit} ${POS_LABELS_PLURAL[player.position].toLowerCase()}` }

    const countryCount = countByCountry[player.team.code] ?? 0
    if (countryCount >= MAX_PER_COUNTRY_GROUP) return { ok: false, reason: `Max ${MAX_PER_COUNTRY_GROUP} per land (groepsfase)` }

    return { ok: true }
  }

  function togglePlayer(player: PlayerData) {
    const check = canSelect(player)
    if (!check.ok && !selected.has(player.id)) return

    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(player.id)) next.delete(player.id)
      else next.add(player.id)
      return next
    })
  }

  const isComplete = selected.size === SQUAD_SIZE

  function handleSubmit() {
    if (!isComplete) return setError("Selecteer precies 15 spelers")
    if (!nickname.trim()) return setError("Geef je team een naam")

    startTransition(async () => {
      const fd = new FormData()
      fd.append("nickname", nickname)
      selected.forEach((id) => fd.append("playerIds", id))

      const result = await createFantasyTeam(fd)
      if (result?.error) {
        setError(result.error)
      } else {
        router.push("/fantasy")
      }
    })
  }

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
      {/* Linkerkant: selectie-overzicht — op mobiel na de spelerslijst (order-2), op desktop links (order-none) */}
      <div className="lg:w-64 shrink-0 order-2 lg:order-none">
        {/* sticky alleen op desktop (lg+); op mobiel niet sticky want te groot voor viewport */}
        <div className="pixel-card overflow-hidden lg:sticky lg:top-16">
          <div className="px-4 py-3" style={{ background: "#0a1f3d", borderBottom: "2px solid #000" }}>
            <h2 className="font-pixel text-white" style={{ fontSize: "8px" }}>JOUW TEAM</h2>
            <p className="mt-0.5 font-pixel" style={{ fontSize: "6px", color: "#4499ff" }}>
              {selected.size}/{SQUAD_SIZE} geselecteerd
            </p>
          </div>

          {/* Progress per positie */}
          <div className="p-3">
            {POS_ORDER.map((pos) => {
              const count = countByPos[pos] ?? 0
              const limit = POSITION_LIMITS[pos]
              return (
                <div key={pos} className="flex items-center justify-between mb-2">
                  <span className="font-pixel" style={{ fontSize: "6px", color: POS_COLORS[pos] }}>
                    {pos}
                  </span>
                  <div className="flex gap-0.5">
                    {Array.from({ length: limit }).map((_, i) => (
                      <div
                        key={i}
                        style={{
                          width: 10, height: 10,
                          background: i < count ? POS_COLORS[pos] : "var(--c-border)",
                          border: "1px solid #000",
                        }}
                      />
                    ))}
                  </div>
                  <span className="font-pixel" style={{ fontSize: "6px", color: "var(--c-text-4)" }}>
                    {count}/{limit}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Geselecteerde spelers */}
          <div style={{ borderTop: "1px solid var(--c-border)", maxHeight: "300px", overflowY: "auto" }}>
            {selectedPlayers.length === 0 && (
              <p className="font-pixel p-3 text-center" style={{ fontSize: "6px", color: "var(--c-text-4)" }}>
                Klik op spelers om ze toe te voegen
              </p>
            )}
            {POS_ORDER.map((pos) => {
              const picks = selectedPlayers.filter((p) => p.position === pos)
              if (picks.length === 0) return null
              return picks.map((p) => (
                <button
                  key={p.id}
                  onClick={() => togglePlayer(p)}
                  className="w-full px-3 py-1.5 flex items-center gap-2 text-left hover:opacity-80 transition-all"
                  style={{ borderBottom: "1px solid var(--c-border)" }}
                >
                  <span style={{ fontSize: "6px", color: POS_COLORS[pos], fontFamily: "monospace", minWidth: "22px" }}>
                    {pos}
                  </span>
                  <span style={{ fontSize: "7px", color: "var(--c-text)", flex: 1 }}>
                    {p.nameNl ?? p.name}
                  </span>
                  <span className="font-pixel" style={{ fontSize: "6px", color: "#884444" }}>✕</span>
                </button>
              ))
            })}
          </div>

          {/* Teamnaam + submit */}
          <div className="p-3" style={{ borderTop: "2px solid var(--c-border)" }}>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Teamnaam..."
              maxLength={30}
              className="w-full mb-2 px-2 py-1.5 font-pixel"
              style={{
                fontSize: "7px",
                background: "var(--c-surface-deep)",
                border: "2px solid var(--c-border)",
                color: "var(--c-text)",
                outline: "none",
              }}
            />

            {error && (
              <p className="font-pixel mb-2" style={{ fontSize: "6px", color: "#ff4444" }}>
                ✗ {error}
              </p>
            )}

            <button
              type="button"
              onClick={handleSubmit}
              disabled={!isComplete || !nickname.trim() || isPending}
              className="w-full font-pixel py-2 transition-all hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: isComplete && nickname.trim() ? "#0a5a2a" : "var(--c-border)",
                color: "white",
                border: "2px solid #000",
                boxShadow: "2px 2px 0 #000",
                fontSize: "8px",
              }}
            >
              {isPending ? "OPSLAAN..." : isComplete ? "✓ TEAM OPSLAAN" : `NOG ${SQUAD_SIZE - selected.size} SPELERS`}
            </button>
          </div>
        </div>
      </div>

      {/* Rechterkant: spelerslijst — op mobiel eerst (order-1), op desktop rechts (order-none) */}
      <div className="flex-1 order-1 lg:order-none">
        {/* Filter balk */}
        <div className="pixel-card overflow-hidden mb-4">
          <div className="p-3 flex flex-wrap gap-2">
            {/* Positie filter */}
            <div className="flex gap-1">
              {(["ALL", ...POS_ORDER] as const).map((pos) => (
                <button
                  key={pos}
                  onClick={() => setFilterPos(pos)}
                  className="font-pixel px-2 py-1 transition-all"
                  style={{
                    fontSize: "6px",
                    background: filterPos === pos ? (pos === "ALL" ? "#333360" : POS_COLORS[pos as PlayerPosition] + "33") : "transparent",
                    color: filterPos === pos ? (pos === "ALL" ? "white" : POS_COLORS[pos as PlayerPosition]) : "var(--c-text-4)",
                    border: `1px solid ${filterPos === pos ? (pos === "ALL" ? "#555580" : POS_COLORS[pos as PlayerPosition]) : "var(--c-border)"}`,
                  }}
                >
                  {pos === "ALL" ? "ALLE" : pos}
                </button>
              ))}
            </div>

            {/* Land filter */}
            <select
              value={filterTeam}
              onChange={(e) => setFilterTeam(e.target.value)}
              className="font-pixel px-2 py-1"
              style={{
                fontSize: "6px",
                background: "var(--c-surface-deep)",
                border: "1px solid var(--c-border)",
                color: "var(--c-text)",
              }}
            >
              <option value="ALL">Alle landen</option>
              {teams.map(([code, name]) => (
                <option key={code} value={code}>{name}</option>
              ))}
            </select>

            {/* Zoek */}
            <input
              type="text"
              placeholder="Zoek speler..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="font-pixel px-2 py-1 flex-1 min-w-24"
              style={{
                fontSize: "7px",
                background: "var(--c-surface-deep)",
                border: "1px solid var(--c-border)",
                color: "var(--c-text)",
                outline: "none",
              }}
            />
          </div>
        </div>

        {/* Spelerslijst */}
        <div className="pixel-card overflow-hidden">
          <div className="px-4 py-2" style={{ background: "var(--c-surface-deep)", borderBottom: "1px solid var(--c-border)" }}>
            <span className="font-pixel" style={{ fontSize: "6px", color: "var(--c-text-4)" }}>
              {filtered.length} speler{filtered.length !== 1 ? "s" : ""}
            </span>
          </div>

          {filtered.length === 0 ? (
            <div className="p-5 text-center">
              <p className="font-pixel" style={{ fontSize: "7px", color: "var(--c-text-4)" }}>
                Geen spelers gevonden
              </p>
            </div>
          ) : (
            <div style={{ maxHeight: "600px", overflowY: "auto" }}>
              {filtered.map((player) => {
                const isSelected = selected.has(player.id)
                const { ok: canAdd, reason } = canSelect(player)
                const blocked = !canAdd && !isSelected

                return (
                  <button
                    key={player.id}
                    type="button"
                    onClick={() => togglePlayer(player)}
                    disabled={blocked}
                    className="w-full px-4 py-2.5 flex items-center gap-3 text-left transition-all"
                    style={{
                      borderBottom: "1px solid var(--c-border)",
                      background: isSelected
                        ? "rgba(74, 245, 106, 0.08)"
                        : blocked
                        ? "rgba(0,0,0,0.3)"
                        : undefined,
                      opacity: blocked ? 0.45 : 1,
                      cursor: blocked ? "not-allowed" : "pointer",
                    }}
                    title={reason}
                  >
                    {/* Vlag */}
                    {player.team.flagUrl ? (
                      <Image
                        src={player.team.flagUrl}
                        alt={player.team.code}
                        width={20}
                        height={14}
                        className="shrink-0"
                        style={{ border: "1px solid var(--c-border)", objectFit: "cover" }}
                      />
                    ) : (
                      <span className="font-pixel shrink-0" style={{ fontSize: "6px", color: "var(--c-text-4)", minWidth: "20px" }}>
                        {player.team.code}
                      </span>
                    )}

                    {/* Land */}
                    <span className="font-pixel shrink-0" style={{ fontSize: "6px", color: "var(--c-text-4)", minWidth: "28px" }}>
                      {player.team.code}
                    </span>

                    {/* Naam */}
                    <span className="flex-1" style={{ fontSize: "8px", color: isSelected ? "#4af56a" : "var(--c-text)" }}>
                      {player.nameNl ?? player.name}
                    </span>

                    {/* Positie badge */}
                    <span
                      className="font-pixel shrink-0 px-1.5 py-0.5"
                      style={{
                        fontSize: "6px",
                        color: POS_COLORS[player.position],
                        border: `1px solid ${POS_COLORS[player.position]}44`,
                        minWidth: "28px",
                        textAlign: "center",
                      }}
                    >
                      {player.position}
                    </span>

                    {/* Selectie indicator */}
                    <span
                      className="font-pixel shrink-0"
                      style={{
                        fontSize: "8px",
                        color: isSelected ? "#4af56a" : "var(--c-border)",
                        minWidth: "12px",
                      }}
                    >
                      {isSelected ? "✓" : "+"}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
