"use client"

import { useState } from "react"

export function TriggerRemindersButton() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ sent: number; matches: number; message?: string } | null>(null)
  const [error, setError] = useState("")

  async function handleClick() {
    setLoading(true)
    setResult(null)
    setError("")

    const res = await fetch("/api/admin/trigger-reminders", { method: "POST" })
    const data = await res.json()
    setLoading(false)

    if (data.error) {
      setError(data.error)
    } else {
      setResult(data)
    }
  }

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <button
        onClick={handleClick}
        disabled={loading}
        className="pixel-btn px-4 py-2 font-pixel"
        style={{
          background: loading ? "#1a2a3a" : "#0a2a4a",
          color: loading ? "#4a6a8a" : "#4af5ff",
          border: "2px solid #1a4a6a",
          fontSize: "8px",
          cursor: loading ? "not-allowed" : "pointer",
        }}
      >
        {loading ? "BEZIG..." : "📧 REMINDERS VERSTUREN"}
      </button>

      {result && (
        <span className="font-pixel" style={{ fontSize: "7px", color: result.sent > 0 ? "#4af56a" : "#FFD700" }}>
          {result.message ?? `✓ ${result.sent} mail${result.sent !== 1 ? "s" : ""} verstuurd voor ${result.matches} wedstrijd${result.matches !== 1 ? "en" : ""}`}
        </span>
      )}
      {error && (
        <span className="font-pixel" style={{ fontSize: "7px", color: "#ff6666" }}>❌ {error}</span>
      )}
    </div>
  )
}
