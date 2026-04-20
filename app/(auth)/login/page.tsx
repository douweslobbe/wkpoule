"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

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
      <h2 className="font-pixel text-xs text-pixel-black mb-6 text-center">INLOGGEN</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wide">E-mailadres</label>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            className="w-full border-3 border-pixel-black px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange bg-background text-sm"
            style={{ border: "3px solid #1a1a2e" }}
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wide">Wachtwoord</label>
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="w-full px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange bg-background text-sm"
            style={{ border: "3px solid #1a1a2e" }}
          />
        </div>

        {error && (
          <div className="bg-red-100 border-2 border-red-600 text-red-700 text-xs font-bold px-3 py-2">
            ❌ {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="pixel-btn w-full bg-orange text-white py-2.5 text-sm font-pixel text-xs"
          style={{ background: loading ? "#cc4f00" : "#FF6200" }}
        >
          {loading ? "BEZIG..." : "INLOGGEN ▶"}
        </button>
      </form>

      <p className="text-center text-xs text-gray-500 mt-5">
        Nog geen account?{" "}
        <Link href="/register" className="text-orange font-bold hover:underline" style={{ color: "#FF6200" }}>
          Registreren
        </Link>
      </p>
    </div>
  )
}
