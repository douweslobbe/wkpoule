"use client"

import { useTransition, useState } from "react"
import { changePassword } from "@/lib/actions"

const inputStyle = {
  fontSize: "9px",
  background: "var(--c-input-bg)",
  color: "var(--c-text)",
  border: "2px solid var(--c-border-mid)",
  outline: "none",
  width: "100%",
  padding: "8px 10px",
  fontFamily: "inherit",
}

export function ChangePasswordForm() {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    setError(null)
    setSuccess(false)
    startTransition(async () => {
      const res = await changePassword(formData)
      if ("error" in res) setError(res.error ?? null)
      else {
        setSuccess(true)
        e.currentTarget?.reset()
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="font-pixel block mb-1.5" style={{ fontSize: "6px", color: "var(--c-text-4)" }}>
          HUIDIG WACHTWOORD
        </label>
        <input name="currentPassword" type="password" required style={inputStyle} autoComplete="current-password" />
      </div>
      <div>
        <label className="font-pixel block mb-1.5" style={{ fontSize: "6px", color: "var(--c-text-4)" }}>
          NIEUW WACHTWOORD
        </label>
        <input name="newPassword" type="password" required minLength={6} style={inputStyle} autoComplete="new-password" />
      </div>
      <div>
        <label className="font-pixel block mb-1.5" style={{ fontSize: "6px", color: "var(--c-text-4)" }}>
          HERHAAL NIEUW WACHTWOORD
        </label>
        <input name="confirmPassword" type="password" required minLength={6} style={inputStyle} autoComplete="new-password" />
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="font-pixel px-4 py-2"
        style={{
          fontSize: "7px",
          background: "transparent",
          color: "#FF6200",
          border: "2px solid #FF6200",
          cursor: isPending ? "default" : "pointer",
          opacity: isPending ? 0.6 : 1,
          minHeight: "44px",
          touchAction: "manipulation",
        }}
      >
        {isPending ? "OPSLAAN..." : "WACHTWOORD WIJZIGEN"}
      </button>
      {error && <p className="font-pixel" style={{ fontSize: "6px", color: "#ff4444" }}>⚠ {error}</p>}
      {success && <p className="font-pixel" style={{ fontSize: "6px", color: "#4af56a" }}>✓ Wachtwoord gewijzigd!</p>}
    </form>
  )
}
