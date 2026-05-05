"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { use } from "react"

export default function ResetPasswordPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params)
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [done, setDone] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (password !== confirm) {
      setError("Wachtwoorden komen niet overeen")
      return
    }
    if (password.length < 6) {
      setError("Wachtwoord moet minimaal 6 tekens zijn")
      return
    }

    setLoading(true)

    const res = await fetch("/api/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    })

    const data = await res.json()
    setLoading(false)

    if (data.error) {
      setError(data.error)
    } else {
      setDone(true)
      setTimeout(() => router.push("/login"), 3000)
    }
  }

  if (done) {
    return (
      <div className="pixel-card p-6">
        <div className="text-center">
          <p className="font-pixel mb-4" style={{ fontSize: "24px" }}>✅</p>
          <h2 className="font-pixel mb-3" style={{ fontSize: "10px", color: "#4af56a" }}>WACHTWOORD GEWIJZIGD</h2>
          <p className="font-pixel" style={{ fontSize: "7px", color: "var(--c-text-3)", lineHeight: "2" }}>
            Je wachtwoord is succesvol bijgewerkt. Je wordt doorgestuurd naar de inlogpagina…
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="pixel-card p-6">
      <h2 className="font-pixel text-center mb-6" style={{ fontSize: "10px", color: "#FFD700" }}>
        NIEUW WACHTWOORD
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-pixel mb-2 uppercase" style={{ fontSize: "7px", color: "var(--c-text-nav)" }}>
            Nieuw wachtwoord
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              className="pixel-input w-full px-3 py-2"
              style={{ paddingRight: "2.5rem" }}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute inset-y-0 right-0 flex items-center px-3"
              style={{ color: "var(--c-text-4)", fontSize: "12px", background: "transparent", border: "none", cursor: "pointer" }}
              tabIndex={-1}
            >
              {showPassword ? "🙈" : "👁"}
            </button>
          </div>
          <p className="mt-1 font-pixel" style={{ fontSize: "6px", color: "var(--c-text-4)" }}>
            Minimaal 6 tekens
          </p>
        </div>

        <div>
          <label className="block font-pixel mb-2 uppercase" style={{ fontSize: "7px", color: "var(--c-text-nav)" }}>
            Bevestig wachtwoord
          </label>
          <input
            type={showPassword ? "text" : "password"}
            required
            minLength={6}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
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
            background: loading ? "#0d3318" : "#16a34a",
            color: "white",
            fontSize: "9px",
          }}
        >
          {loading ? "BEZIG..." : "WACHTWOORD OPSLAAN ▶"}
        </button>
      </form>

      <p className="text-center mt-4 font-pixel" style={{ fontSize: "7px", color: "var(--c-text-5)" }}>
        <Link href="/login" className="hover:underline" style={{ color: "var(--c-text-4)" }}>
          ◄ TERUG NAAR INLOGGEN
        </Link>
      </p>
    </div>
  )
}
