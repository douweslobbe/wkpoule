"use client"

import { useState, useTransition } from "react"
import { adminResetPassword } from "@/lib/actions"

export function ResetPasswordForm({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false)
  const [password, setPassword] = useState("")
  const [done, setDone] = useState(false)
  const [error, setError] = useState("")
  const [isPending, startTransition] = useTransition()

  if (done) {
    return (
      <span className="font-pixel" style={{ fontSize: "7px", color: "#4af56a" }}>✓ GERESET</span>
    )
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="font-pixel px-2 py-1 transition-colors"
        style={{
          fontSize: "7px",
          color: "var(--c-text-3)",
          border: "1px solid var(--c-border-bright)",
          background: "transparent",
        }}
      >
        RESET
      </button>
    )
  }

  function handleSave() {
    if (!password || password.length < 6) return
    setError("")
    startTransition(async () => {
      const fd = new FormData()
      fd.set("userId", userId)
      fd.set("newPassword", password)
      const res = await adminResetPassword(fd)
      if (res.error) {
        setError(res.error)
      } else {
        setDone(true)
        setOpen(false)
      }
    })
  }

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <input
        type="text"
        placeholder="Nieuw wachtwoord"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSave()}
        className="pixel-input px-2 py-1"
        style={{ width: "130px" }}
      />
      <button
        onClick={handleSave}
        disabled={isPending || password.length < 6}
        className="font-pixel px-2 py-1 disabled:opacity-40"
        style={{
          fontSize: "7px",
          color: "white",
          background: "#FF6200",
          border: "2px solid #000",
          boxShadow: "2px 2px 0 #000",
        }}
      >
        {isPending ? "..." : "OPSLAAN"}
      </button>
      <button
        onClick={() => { setOpen(false); setPassword("") }}
        className="font-pixel px-2 py-1"
        style={{ fontSize: "7px", color: "var(--c-text-3)", border: "1px solid var(--c-border)" }}
      >
        ✕
      </button>
      {error && <span className="font-pixel w-full" style={{ fontSize: "7px", color: "#ff4444" }}>{error}</span>}
    </div>
  )
}
