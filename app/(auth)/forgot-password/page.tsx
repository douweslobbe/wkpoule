"use client"

import { useState } from "react"
import Link from "next/link"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")

    const res = await fetch("/api/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    })

    setLoading(false)

    if (res.ok) {
      setSent(true)
    } else {
      setError("Er is iets misgegaan. Probeer het opnieuw.")
    }
  }

  return (
    <div className="pixel-card p-6">
      <h2 className="font-pixel text-center mb-6" style={{ fontSize: "10px", color: "#FFD700" }}>
        WACHTWOORD VERGETEN
      </h2>

      {sent ? (
        <div>
          <div className="mb-5 p-4 font-pixel" style={{
            background: "#0a3d1f",
            border: "2px solid #16a34a",
            fontSize: "8px",
            color: "#4af56a",
            lineHeight: "2",
          }}>
            ✅ Als dit e-mailadres bij ons bekend is, ontvang je binnen enkele minuten een resetlink van <strong>notifications@wesl.nl</strong>.
          </div>
          <p className="text-center font-pixel" style={{ fontSize: "7px", color: "var(--c-text-4)" }}>
            Geen mail ontvangen? Check je spam-map.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="font-pixel" style={{ fontSize: "8px", color: "var(--c-text-3)", lineHeight: "1.8" }}>
            Vul je e-mailadres in en we sturen je een link om je wachtwoord te resetten.
          </p>

          <div>
            <label className="block font-pixel mb-2 uppercase" style={{ fontSize: "7px", color: "var(--c-text-nav)" }}>
              E-mailadres
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              className="pixel-input w-full px-3 py-2"
            />
          </div>

          {error && (
            <div className="px-3 py-2 font-pixel" style={{
              background: "#2a0000",
              border: "2px solid #cc0000",
              color: "#ff6666",
              fontSize: "8px",
            }}>
              ❌ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="pixel-btn w-full py-3 font-pixel"
            style={{
              background: loading ? "#cc4f00" : "#FF6200",
              color: "white",
              fontSize: "9px",
            }}
          >
            {loading ? "BEZIG..." : "RESETLINK VERSTUREN ▶"}
          </button>
        </form>
      )}

      <p className="text-center mt-4 font-pixel" style={{ fontSize: "7px", color: "var(--c-text-5)" }}>
        <Link href="/login" className="hover:underline" style={{ color: "var(--c-text-4)" }}>
          ◄ TERUG NAAR INLOGGEN
        </Link>
      </p>
    </div>
  )
}
