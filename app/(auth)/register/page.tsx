"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"

export default function RegisterPage() {
  const router = useRouter()
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")
    setLoading(true)

    const fd = new FormData(e.currentTarget)
    const body = {
      name: fd.get("name") as string,
      email: fd.get("email") as string,
      password: fd.get("password") as string,
    }

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })

    const data = await res.json()
    if (data.error) {
      setError(data.error)
      setLoading(false)
      return
    }

    await signIn("credentials", { email: body.email, password: body.password, redirect: false })
    router.push("/dashboard")
  }

  return (
    <div className="pixel-card p-6">
      <h2 className="font-pixel text-center mb-6" style={{ fontSize: "10px", color: "#4af56a" }}>
        ACCOUNT AANMAKEN
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-pixel mb-2 uppercase" style={{ fontSize: "7px", color: "var(--c-text-nav)" }}>
            Naam
          </label>
          <input
            name="name"
            type="text"
            required
            autoComplete="name"
            className="pixel-input w-full px-3 py-2"
          />
        </div>
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
              minLength={6}
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
              aria-label={showPassword ? "Verberg wachtwoord" : "Toon wachtwoord"}
            >
              {showPassword ? "🙈" : "👁"}
            </button>
          </div>
          <p className="mt-1 font-pixel" style={{ fontSize: "6px", color: "var(--c-text-4)" }}>
            Minimaal 6 tekens
          </p>
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
          {loading ? "BEZIG..." : "ACCOUNT AANMAKEN ▶"}
        </button>
      </form>

      <p className="text-center mt-5 font-pixel" style={{ fontSize: "7px", color: "var(--c-text-3)" }}>
        Al een account?{" "}
        <Link href="/login" className="font-bold hover:underline" style={{ color: "#FF6200" }}>
          INLOGGEN
        </Link>
      </p>
    </div>
  )
}
