"use client"

import { useTransition, useState } from "react"
import { promoteToAdmin, demoteToMember, removeMember } from "@/lib/actions"

type Props = {
  poolId: string
  userId: string
  name: string
  role: "ADMIN" | "MEMBER"
  isMe: boolean
}

export function MemberManageRow({ poolId, userId, name, role, isMe }: Props) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handlePromote() {
    setError(null)
    startTransition(async () => {
      const res = await promoteToAdmin(poolId, userId)
      if ("error" in res) setError(res.error)
    })
  }

  function handleDemote() {
    setError(null)
    startTransition(async () => {
      const res = await demoteToMember(poolId, userId)
      if ("error" in res) setError(res.error)
    })
  }

  function handleRemove() {
    if (!confirm(`${name} verwijderen uit de pool?`)) return
    setError(null)
    startTransition(async () => {
      const res = await removeMember(poolId, userId)
      if ("error" in res) setError(res.error)
    })
  }

  return (
    <div
      style={{
        borderBottom: "1px solid var(--c-border)",
        opacity: isPending ? 0.5 : 1,
        transition: "opacity 0.2s",
      }}
    >
      <div className="flex items-center gap-3 px-5 py-3">
        <div className="flex-1 min-w-0">
          <span style={{ color: "var(--c-text)", fontSize: "9px" }}>{name}</span>
          {isMe && (
            <span className="ml-2 font-pixel" style={{ fontSize: "6px", color: "#FF6200" }}>
              (jij)
            </span>
          )}
          <span
            className="ml-2 font-pixel px-1.5 py-0.5"
            style={{
              fontSize: "6px",
              background: role === "ADMIN" ? "#FFD700" : "var(--c-surface-deep)",
              color: role === "ADMIN" ? "#000" : "var(--c-text-3)",
              border: role === "ADMIN" ? "none" : "1px solid var(--c-border)",
            }}
          >
            {role === "ADMIN" ? "BEHEERDER" : "LID"}
          </span>
        </div>

        {!isMe && (
          <div className="flex items-center gap-2 shrink-0">
            {role === "MEMBER" ? (
              <button
                onClick={handlePromote}
                disabled={isPending}
                className="font-pixel px-2 py-1"
                style={{
                  fontSize: "6px",
                  color: "#FFD700",
                  border: "1px solid #FFD700",
                  background: "transparent",
                  cursor: "pointer",
                }}
                title="Maak beheerder"
              >
                → BEHEERDER
              </button>
            ) : (
              <button
                onClick={handleDemote}
                disabled={isPending}
                className="font-pixel px-2 py-1"
                style={{
                  fontSize: "6px",
                  color: "var(--c-text-3)",
                  border: "1px solid var(--c-border)",
                  background: "transparent",
                  cursor: "pointer",
                }}
                title="Terug naar lid"
              >
                → LID
              </button>
            )}
            <button
              onClick={handleRemove}
              disabled={isPending}
              className="font-pixel px-2 py-1"
              style={{
                fontSize: "6px",
                color: "#ff4444",
                border: "1px solid #ff4444",
                background: "transparent",
                cursor: "pointer",
              }}
              title={`${name} verwijderen`}
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="px-5 pb-2">
          <span className="font-pixel" style={{ fontSize: "6px", color: "#ff4444" }}>
            ⚠ {error}
          </span>
        </div>
      )}
    </div>
  )
}
