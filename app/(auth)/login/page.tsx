"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")
    setLoading(true)

    const fd = new FormData(e.currentTarget)
    const result = await signIn("credentials", {
      email: fd.get("email"),
      password: fd.get("password"),
      redirect: false,
    })

    if (result?.error) {
      setError("Onjuist e-mailadres of wachtwoord")
      setLoading(false)
    } else {
      router.push("/dashboard")
    }
  }

  return (
    <div className="pixel-card p-6">
      <h2 className="font-pixel text-center mb-6" style={{ fontSize: "10px", color: "#FFD700" }}>
        INLOGGEN
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-pixel mb-2 uppercase" style={{ fontSize: "7px", color: "var(--c-text-nav)" }}>
            E-mailadres
          </label>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            className="pixel-input w-full px-3 py-2"
          />
        </div>
        <div>
          <label className="block font-pixel mb-2 uppercase" style={{ fontSize: "7px", color: "var(--c-text-nav)" }}>
            Wachtwoord
          </label>
          <div className="relative">
            <input
              name="password"
              type={showPassword ? "text" : "password"}
              required
              autoComplete="current-password"
              className="pixel-input w-full px-3 py-2"
              style={{ paddingRight: "2.5rem" }}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute inset-y-0 right-0 flex items-center px-3"
              style={{ color: "var(--c-text-4)", fontSize: "12px", background: "transparent", border: "none", cursor: "pointer" }}
              tabIndex={-1}
              aria-label={showPassword ? "Verberg wachtwoord" : "Toon wachtwoord"}
            >
              {showPassword ? "🙈" : "👁"}
            </button>
          </div>
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
          {loading ? "BEZIG..." : "INLOGGEN ▶"}
        </button>
      </form>

      <p className="text-center mt-4 font-pixel" style={{ fontSize: "7px", color: "var(--c-text-3)" }}>
        Nog geen account?{" "}
        <Link href="/register" className="font-bold hover:underline" style={{ color: "#FF6200" }}>
          REGISTREREN
        </Link>
      </p>
      <p className="text-center mt-2 font-pixel" style={{ fontSize: "7px", color: "var(--c-text-5)" }}>
        <Link href="/forgot-password" className="hover:underline" style={{ color: "var(--c-text-4)" }}>
          Wachtwoord vergeten?
        </Link>
      </p>
    </div>
  )
}
