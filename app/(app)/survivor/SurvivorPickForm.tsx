"use client"

import { useTransition, useState } from "react"
import Image from "next/image"
import { makeSurvivorPick } from "@/lib/actions"

type Team = {
  id: string
  name: string
  nameNl: string | null
  code: string
  flagUrl: string | null
}

type Props = {
  mode: "HARDCORE" | "HIGHSCORE"
  round: string
  currentPickTeamId: string | null
  usedTeamIds: string[]    // already used in previous rounds this cycle
  availableTeams: Team[]   // teams playing in this round
}

export function SurvivorPickForm({ mode, round, currentPickTeamId, usedTeamIds, availableTeams }: Props) {
  const [isPending, startTransition] = useTransition()
  const [selected, setSelected] = useState<string | null>(currentPickTeamId)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(!!currentPickTeamId)

  const usedSet = new Set(usedTeamIds)

  function pick(teamId: string) {
    if (isPending) return
    if (usedSet.has(teamId) && teamId !== currentPickTeamId) return
    if (selected === teamId && saved) return // already saved this pick, no need to re-submit

    setSelected(teamId)
    setSaved(false)
    setError(null)

    startTransition(async () => {
      const res = await makeSurvivorPick(mode, teamId, round)
      if ("error" in res) {
        setError(res.error ?? null)
        setSelected(currentPickTeamId)
      } else {
        setSaved(true)
      }
    })
  }

  const accentColor = mode === "HARDCORE" ? "#ff4444" : "#FFD700"
  const available = availableTeams.filter((t) => !usedSet.has(t.id) || t.id === currentPickTeamId)
  const exhausted = available.length === 0

  return (
    <div>
      {exhausted ? (
        <p className="font-pixel py-2" style={{ fontSize: "7px", color: "#ff4444" }}>
          Je hebt alle beschikbare teams al gebruikt.
          {mode === "HIGHSCORE" ? " Gebruik je reset om opnieuw te beginnen." : ""}
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {availableTeams.map((team) => {
            const isUsed = usedSet.has(team.id) && team.id !== currentPickTeamId
            const isSelected = selected === team.id
            const displayName = team.nameNl ?? team.name

            return (
              <button
                key={team.id}
                type="button"
                onClick={() => pick(team.id)}
                disabled={isUsed || isPending}
                title={isUsed ? `${displayName} al gebruikt` : displayName}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "4px",
                  padding: "8px 10px",
                  background: isSelected ? (mode === "HARDCORE" ? "#2a0000" : "#1a1500") : "#0d0f1a",
                  border: isSelected
                    ? `2px solid ${accentColor}`
                    : isUsed
                    ? "1px solid #1a1a2a"
                    : "1px solid #2d2d50",
                  boxShadow: isSelected ? `0 0 6px ${accentColor}44` : "none",
                  opacity: isUsed ? 0.3 : isPending ? 0.7 : 1,
                  cursor: isUsed ? "not-allowed" : "pointer",
                  minWidth: "56px",
                  minHeight: "56px",
                  justifyContent: "center",
                  transition: "all 0.1s",
                  // Bigger tap area on touch devices
                  touchAction: "manipulation",
                }}
              >
                {team.flagUrl ? (
                  <Image
                    src={team.flagUrl}
                    alt={displayName}
                    width={32}
                    height={22}
                    style={{ objectFit: "cover", imageRendering: "pixelated" }}
                    unoptimized
                  />
                ) : (
                  <span style={{ fontSize: "20px", lineHeight: 1 }}>🏳</span>
                )}
                <span
                  className="font-pixel"
                  style={{
                    fontSize: "5px",
                    color: isSelected ? accentColor : isUsed ? "#333355" : "var(--c-text-3)",
                    textAlign: "center",
                    maxWidth: "56px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {team.code}
                </span>
              </button>
            )
          })}
        </div>
      )}

      <div className="mt-2 flex items-center gap-3">
        {isPending && (
          <span className="font-pixel" style={{ fontSize: "6px", color: "var(--c-text-4)" }}>
            Opslaan...
          </span>
        )}
        {saved && !isPending && selected && (
          <span className="font-pixel" style={{ fontSize: "6px", color: "#4af56a" }}>
            ✓ Pick opgeslagen
          </span>
        )}
        {error && (
          <span className="font-pixel" style={{ fontSize: "6px", color: "#ff4444" }}>
            ⚠ {error}
          </span>
        )}
      </div>
    </div>
  )
}
