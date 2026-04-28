"use client"

import { useTransition, useState } from "react"
import { updateName } from "@/lib/actions"

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

export function UpdateNameForm({ currentName }: { currentName: string }) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  function handleSubmit(formData: FormData) {
    setError(null)
    setSuccess(false)
    startTransition(async () => {
      const res = await updateName(formData)
      if ("error" in res) setError(res.error ?? null)
      else setSuccess(true)
    })
  }

  return (
    <form action={handleSubmit} className="space-y-3">
      <div>
        <label className="font-pixel block mb-1.5" style={{ fontSize: "6px", color: "var(--c-text-4)" }}>
          WEERGAVENAAM
        </label>
        <input
          name="name"
          defaultValue={currentName}
          maxLength={50}
          minLength={2}
          required
          style={inputStyle}
        />
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="font-pixel px-4 py-2"
        style={{
          fontSize: "7px",
          background: "#FF6200",
          color: "#fff",
          border: "2px solid #000",
          boxShadow: isPending ? "none" : "2px 2px 0 #000",
          cursor: isPending ? "default" : "pointer",
          opacity: isPending ? 0.6 : 1,
          minHeight: "44px",
          touchAction: "manipulation",
        }}
      >
        {isPending ? "OPSLAAN..." : "NAAM OPSLAAN"}
      </button>
      {error && <p className="font-pixel" style={{ fontSize: "6px", color: "#ff4444" }}>⚠ {error}</p>}
      {success && <p className="font-pixel" style={{ fontSize: "6px", color: "#4af56a" }}>✓ Naam bijgewerkt! Herlaad de pagina om het te zien.</p>}
    </form>
  )
}
