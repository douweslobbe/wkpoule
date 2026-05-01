"use client"

import { useState } from "react"
import Image from "next/image"
import { POSITION_LIMITS } from "@/lib/fantasy"

type PlayerPosition = "GK" | "DEF" | "MID" | "FWD"

type Player = {
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

type FantasyPickItem = {
  id: string
  addedInRound: string
  player: Player
}

type Transfer = {
  id: string
  round: string
  playerOutId: string
  playerInId: string
  createdAt: Date
}

type FantasyTeamData = {
  id: string
  nickname: string
  totalPoints: number
  picks: FantasyPickItem[]
  transfers: Transfer[]
}

const POS_ORDER: PlayerPosition[] = ["GK", "DEF", "MID", "FWD"]
const POS_LABELS: Record<PlayerPosition, string> = { GK: "Keepers", DEF: "Verdedigers", MID: "Middenvelders", FWD: "Aanvallers" }
const POS_COLORS: Record<PlayerPosition, string> = {
  GK: "#FFD700",
  DEF: "#4499ff",
  MID: "#4af56a",
  FWD: "#ff6644",
}

export function FantasyTeamView({
  team,
  canTransfer,
}: {
  team: FantasyTeamData
  canTransfer: boolean
}) {
  const [activeTab, setActiveTab] = useState<"team" | "transfers">("team")

  const byPosition = POS_ORDER.reduce((acc, pos) => {
    acc[pos] = team.picks.filter((p) => p.player.position === pos)
    return acc
  }, {} as Record<PlayerPosition, FantasyPickItem[]>)

  return (
    <div className="pixel-card overflow-hidden mb-6">
      {/* Header */}
      <div className="px-5 py-3" style={{ background: "#0a3d1f", borderBottom: "3px solid #000" }}>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 className="font-pixel text-white" style={{ fontSize: "10px" }}>
              🏟 {team.nickname.toUpperCase()}
            </h2>
            <p className="mt-0.5 font-pixel" style={{ fontSize: "7px", color: "#FFD700" }}>
              {team.totalPoints} punten totaal
            </p>
          </div>
          {canTransfer && (
            <a
              href="/fantasy/transfers"
              className="font-pixel px-3 py-1 transition-all hover:opacity-80"
              style={{
                background: "#1a5a2a",
                color: "white",
                border: "2px solid #000",
                boxShadow: "1px 1px 0 #000",
                fontSize: "7px",
              }}
            >
              ⇄ TRANSFERS
            </a>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex" style={{ borderBottom: "2px solid var(--c-border)" }}>
        {(["team", "transfers"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="font-pixel px-4 py-2 transition-all"
            style={{
              fontSize: "7px",
              color: activeTab === tab ? "white" : "var(--c-text-4)",
              background: activeTab === tab ? "var(--c-surface-deep)" : "transparent",
              borderBottom: activeTab === tab ? "2px solid #4af56a" : "none",
              marginBottom: activeTab === tab ? "-2px" : undefined,
            }}
          >
            {tab === "team" ? "SELECTIE" : `TRANSFERS (${team.transfers.length})`}
          </button>
        ))}
      </div>

      {/* Selectie tab */}
      {activeTab === "team" && (
        <div>
          {POS_ORDER.map((pos) => (
            <div key={pos}>
              <div
                className="px-5 py-2 flex items-center justify-between"
                style={{ background: "var(--c-surface-deep)", borderBottom: "1px solid var(--c-border)" }}
              >
                <span className="font-pixel" style={{ fontSize: "7px", color: POS_COLORS[pos] }}>
                  {POS_LABELS[pos].toUpperCase()}
                </span>
                <span className="font-pixel" style={{ fontSize: "6px", color: "var(--c-text-4)" }}>
                  {byPosition[pos].length}/{POSITION_LIMITS[pos]}
                </span>
              </div>
              {byPosition[pos].map((pick) => (
                <div
                  key={pick.id}
                  className="px-5 py-2.5 flex items-center gap-3"
                  style={{ borderBottom: "1px solid var(--c-border)" }}
                >
                  {/* Vlag */}
                  {pick.player.team.flagUrl ? (
                    <Image
                      src={pick.player.team.flagUrl}
                      alt={pick.player.team.code}
                      width={20}
                      height={14}
                      className="shrink-0"
                      style={{ border: "1px solid var(--c-border)", objectFit: "cover" }}
                    />
                  ) : (
                    <span className="font-pixel shrink-0" style={{ fontSize: "7px", color: "var(--c-text-4)", minWidth: "20px" }}>
                      {pick.player.team.code}
                    </span>
                  )}

                  {/* Naam */}
                  <span className="flex-1" style={{ fontSize: "8px", color: "var(--c-text)" }}>
                    {pick.player.nameNl ?? pick.player.name}
                  </span>

                  {/* Shirt nummer */}
                  {pick.player.shirtNumber && (
                    <span className="font-pixel shrink-0" style={{ fontSize: "6px", color: "var(--c-text-4)" }}>
                      #{pick.player.shirtNumber}
                    </span>
                  )}

                  {/* Positie badge */}
                  <span
                    className="font-pixel shrink-0 px-1.5 py-0.5"
                    style={{
                      fontSize: "6px",
                      background: "transparent",
                      color: POS_COLORS[pos],
                      border: `1px solid ${POS_COLORS[pos]}44`,
                    }}
                  >
                    {pos}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Transfers tab */}
      {activeTab === "transfers" && (
        <div>
          {team.transfers.length === 0 ? (
            <div className="p-5 text-center">
              <p className="font-pixel" style={{ fontSize: "7px", color: "var(--c-text-4)" }}>
                Nog geen transfers gedaan.
              </p>
            </div>
          ) : (
            team.transfers.map((t) => (
              <div
                key={t.id}
                className="px-5 py-2.5 flex items-center gap-2"
                style={{ borderBottom: "1px solid var(--c-border)", fontSize: "7px" }}
              >
                <span className="font-pixel" style={{ color: "var(--c-text-4)", minWidth: "80px" }}>
                  {t.round.replace("_", " ")}
                </span>
                <span style={{ color: "#ff4444" }}>↑ OUT</span>
                <span style={{ color: "var(--c-text-3)" }}>{t.playerOutId.slice(0, 8)}…</span>
                <span style={{ color: "#4af56a" }}>↓ IN</span>
                <span style={{ color: "var(--c-text-3)" }}>{t.playerInId.slice(0, 8)}…</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
