"use client"

import { useState, useMemo, useTransition } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { makeFantasyTransfers } from "@/lib/actions"
import { MAX_PER_COUNTRY_GROUP, MAX_PER_COUNTRY_KO, type FantasyRound } from "@/lib/fantasy"

type PlayerPosition = "GK" | "DEF" | "MID" | "FWD"

type P = {
  id: string
  name: string
  nameNl: string | null
  position: PlayerPosition
  shirtNumber: number | null
  team: { code: string; nameNl: string | null; name: string; flagUrl: string | null }
}

const POS_ORDER: PlayerPosition[] = ["GK", "DEF", "MID", "FWD"]
const POS_LABELS: Record<PlayerPosition, string> = { GK: "Keepers", DEF: "Verdedigers", MID: "Middenvelders", FWD: "Aanvallers" }
const POS_COLORS: Record<PlayerPosition, string> = { GK: "#FFD700", DEF: "#4499ff", MID: "#4af56a", FWD: "#ff6644" }

function name(p: P) {
  return p.nameNl ?? p.name
}

export function TransferPicker({
  round,
  remaining,
  squad,
  allPlayers,
}: {
  round: FantasyRound
  remaining: number
  squad: P[]
  allPlayers: P[]
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [swaps, setSwaps] = useState<{ out: P; in: P }[]>([])
  const [selectedOut, setSelectedOut] = useState<P | null>(null)
  const [search, setSearch] = useState("")
  const [error, setError] = useState("")

  const isKO = !["GROUP_1", "GROUP_2", "GROUP_3"].includes(round)
  const maxPerCountry = isKO ? MAX_PER_COUNTRY_KO : MAX_PER_COUNTRY_GROUP

  const outIds = useMemo(() => new Set(swaps.map((s) => s.out.id)), [swaps])
  const inById = useMemo(() => new Map(swaps.map((s) => [s.out.id, s.in])), [swaps])

  // Effectieve selectie = squad zonder OUT-spelers + IN-spelers
  const effectiveSquad = useMemo(
    () => [...squad.filter((p) => !outIds.has(p.id)), ...swaps.map((s) => s.in)],
    [squad, swaps, outIds],
  )
  const effectiveIds = useMemo(() => new Set(effectiveSquad.map((p) => p.id)), [effectiveSquad])

  const canAddMore = swaps.length < remaining

  function startSwap(p: P) {
    if (outIds.has(p.id)) return
    if (!canAddMore) {
      setError(`Maximaal ${remaining} transfer${remaining === 1 ? "" : "s"} deze ronde`)
      return
    }
    setError("")
    setSearch("")
    setSelectedOut(p)
  }

  const candidates = useMemo(() => {
    if (!selectedOut) return []
    const without = effectiveSquad.filter((p) => p.id !== selectedOut.id)
    const countryCount = (code: string) => without.filter((p) => p.team.code === code).length
    return allPlayers.filter((p) => {
      if (p.position !== selectedOut.position) return false
      if (effectiveIds.has(p.id)) return false
      if (countryCount(p.team.code) >= maxPerCountry) return false
      if (search) {
        const q = search.toLowerCase()
        if (!name(p).toLowerCase().includes(q) && !p.team.code.toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [selectedOut, allPlayers, effectiveSquad, effectiveIds, search, maxPerCountry])

  function chooseIn(p: P) {
    if (!selectedOut) return
    setSwaps((prev) => [...prev, { out: selectedOut, in: p }])
    setSelectedOut(null)
  }

  function undoSwap(outId: string) {
    setSwaps((prev) => prev.filter((s) => s.out.id !== outId))
  }

  function submit() {
    if (swaps.length === 0) {
      setError("Kies minimaal één transfer")
      return
    }
    setError("")
    startTransition(async () => {
      const result = await makeFantasyTransfers(
        round,
        swaps.map((s) => ({ playerOutId: s.out.id, playerInId: s.in.id })),
      )
      if (result?.error) setError(result.error)
      else router.push("/fantasy")
    })
  }

  // ── Vervanger kiezen ──────────────────────────────────────────────────────
  if (selectedOut) {
    return (
      <div className="pixel-card overflow-hidden">
        <div className="px-5 py-3" style={{ background: "#1a0d00", borderBottom: "3px solid #000" }}>
          <h2 className="font-pixel text-white" style={{ fontSize: "8px" }}>
            VERVANGER VOOR <span style={{ color: "#ff6644" }}>{name(selectedOut).toUpperCase()}</span>
          </h2>
          <p className="mt-1 font-pixel" style={{ fontSize: "6px", color: POS_COLORS[selectedOut.position] }}>
            {POS_LABELS[selectedOut.position]} · max {maxPerCountry} per land
          </p>
        </div>
        <div className="p-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Zoek speler of land..."
            className="w-full mb-2 px-2 py-1.5 font-pixel"
            style={{ fontSize: "7px", background: "var(--c-surface-deep)", border: "2px solid var(--c-border)", color: "var(--c-text)", outline: "none" }}
          />
          <button
            type="button"
            onClick={() => setSelectedOut(null)}
            className="font-pixel mb-2 px-3 py-1.5"
            style={{ fontSize: "7px", background: "transparent", color: "var(--c-text-3)", border: "2px solid var(--c-border)" }}
          >
            ◄ ANNULEREN
          </button>
          <div style={{ maxHeight: "420px", overflowY: "auto" }}>
            {candidates.length === 0 ? (
              <p className="font-pixel p-4 text-center" style={{ fontSize: "7px", color: "var(--c-text-4)" }}>
                Geen beschikbare spelers (landlimiet of niets gevonden).
              </p>
            ) : (
              candidates.map((p) => (
                <button
                  key={p.id}
                  onClick={() => chooseIn(p)}
                  className="w-full px-3 py-2 flex items-center gap-3 text-left hover:opacity-80 transition-all"
                  style={{ borderBottom: "1px solid var(--c-border)" }}
                >
                  {p.team.flagUrl ? (
                    <Image src={p.team.flagUrl} alt={p.team.code} width={20} height={14} className="shrink-0" style={{ border: "1px solid var(--c-border)", objectFit: "cover" }} />
                  ) : (
                    <span className="font-pixel shrink-0" style={{ fontSize: "7px", color: "var(--c-text-4)", minWidth: "20px" }}>{p.team.code}</span>
                  )}
                  <span className="flex-1" style={{ fontSize: "8px", color: "var(--c-text)" }}>{name(p)}</span>
                  {p.shirtNumber && (
                    <span className="font-pixel shrink-0" style={{ fontSize: "6px", color: "var(--c-text-4)" }}>#{p.shirtNumber}</span>
                  )}
                  <span className="font-pixel shrink-0" style={{ fontSize: "8px", color: "#4af56a" }}>+</span>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    )
  }

  // ── Overzicht: squad + pending swaps ──────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Status */}
      <div className="pixel-card p-4 flex items-center justify-between gap-3 flex-wrap" style={{ borderLeft: "4px solid #1a5a2a" }}>
        <div>
          <div className="font-pixel" style={{ fontSize: "8px", color: "#4af56a" }}>
            {swaps.length}/{remaining} TRANSFER{remaining === 1 ? "" : "S"} GEKOZEN
          </div>
          <div className="font-pixel mt-1" style={{ fontSize: "6px", color: "var(--c-text-4)" }}>
            Klik op een speler in je selectie om hem te vervangen.
          </div>
        </div>
        {swaps.length > 0 && (
          <button
            type="button"
            onClick={submit}
            disabled={isPending}
            className="font-pixel px-4 py-2 disabled:opacity-50"
            style={{ fontSize: "8px", background: "#0a5a2a", color: "white", border: "2px solid #000", boxShadow: "2px 2px 0 #000" }}
          >
            {isPending ? "OPSLAAN..." : "✓ TRANSFERS BEVESTIGEN"}
          </button>
        )}
      </div>

      {error && (
        <p className="font-pixel" style={{ fontSize: "7px", color: "#ff4444" }}>✗ {error}</p>
      )}

      {/* Pending swaps */}
      {swaps.length > 0 && (
        <div className="pixel-card overflow-hidden">
          <div className="px-4 py-2" style={{ background: "var(--c-surface-deep)", borderBottom: "2px solid var(--c-border)" }}>
            <span className="font-pixel" style={{ fontSize: "7px", color: "var(--c-text-3)" }}>GEKOZEN TRANSFERS</span>
          </div>
          {swaps.map((s) => (
            <div key={s.out.id} className="px-4 py-2 flex items-center gap-2" style={{ borderBottom: "1px solid var(--c-border)", fontSize: "8px" }}>
              <span style={{ color: "#ff4444" }}>↑</span>
              <span style={{ color: "var(--c-text-3)", flex: 1 }}>{name(s.out)}</span>
              <span style={{ color: "#4af56a" }}>↓</span>
              <span style={{ color: "var(--c-text)", flex: 1 }}>{name(s.in)}</span>
              <button type="button" onClick={() => undoSwap(s.out.id)} className="font-pixel px-2 py-0.5" style={{ fontSize: "6px", color: "#ff8888", border: "1px solid #663333" }}>
                ✕ ONGEDAAN
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Squad per positie */}
      <div className="pixel-card overflow-hidden">
        {POS_ORDER.map((pos) => {
          const players = squad.filter((p) => p.position === pos)
          if (players.length === 0) return null
          return (
            <div key={pos}>
              <div className="px-4 py-2" style={{ background: "var(--c-surface-deep)", borderBottom: "1px solid var(--c-border)" }}>
                <span className="font-pixel" style={{ fontSize: "7px", color: POS_COLORS[pos] }}>{POS_LABELS[pos].toUpperCase()}</span>
              </div>
              {players.map((p) => {
                const swappedIn = inById.get(p.id)
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => startSwap(p)}
                    disabled={!!swappedIn}
                    className="w-full px-4 py-2.5 flex items-center gap-3 text-left transition-all"
                    style={{
                      borderBottom: "1px solid var(--c-border)",
                      background: swappedIn ? "#1a0d00" : "transparent",
                      opacity: swappedIn ? 0.85 : 1,
                      cursor: swappedIn ? "default" : "pointer",
                    }}
                  >
                    {p.team.flagUrl ? (
                      <Image src={p.team.flagUrl} alt={p.team.code} width={20} height={14} className="shrink-0" style={{ border: "1px solid var(--c-border)", objectFit: "cover" }} />
                    ) : (
                      <span className="font-pixel shrink-0" style={{ fontSize: "7px", color: "var(--c-text-4)", minWidth: "20px" }}>{p.team.code}</span>
                    )}
                    <span className="flex-1" style={{ fontSize: "8px", color: swappedIn ? "var(--c-text-4)" : "var(--c-text)", textDecoration: swappedIn ? "line-through" : "none" }}>
                      {name(p)}
                    </span>
                    {swappedIn ? (
                      <span className="font-pixel" style={{ fontSize: "7px", color: "#4af56a" }}>→ {name(swappedIn)}</span>
                    ) : (
                      <span className="font-pixel shrink-0" style={{ fontSize: "6px", color: "#ff8855" }}>⇄ VERVANG</span>
                    )}
                  </button>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}
