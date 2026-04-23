"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function JoinPoolPage() {
  const router = useRouter()
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")
    setLoading(true)

    const fd = new FormData(e.currentTarget)
    const res = await fetch("/api/pools/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inviteCode: fd.get("inviteCode") }),
    })
    const data = await res.json()

    if (data.error) {
      setError(data.error)
      setLoading(false)
    } else {
      router.push(`/pools/${data.poolId}`)
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <Link
        href="/dashboard"
        className="inline-block mb-4 font-pixel"
        style={{ fontSize: "7px", color: "#7070a0" }}
      >
        ◄ TERUG
      </Link>

      <div className="pixel-card overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3" style={{ background: "#0a3d1f", borderBottom: "3px solid #000" }}>
          <h1 className="font-pixel text-white" style={{ fontSize: "9px" }}>🎟 MEEDOEN MET POOL</h1>
        </div>

        <div className="p-5">
          <p className="mb-5" style={{ color: "#7070a0", fontSize: "8px", lineHeight: "2", fontFamily: "var(--font-pixel), monospace" }}>
            Voer de uitnodigingscode in die je hebt ontvangen van de beheerder.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block font-pixel mb-2 uppercase" style={{ fontSize: "7px", color: "#7070a0" }}>
                Uitnodigingscode
              </label>
              <input
                name="inviteCode"
                type="text"
                required
                placeholder="bijv. ABC12345"
                className="pixel-input w-full px-3 py-2 uppercase tracking-widest"
                style={{ letterSpacing: "0.2em" }}
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
                background: loading ? "#0a2a00" : "#FF6200",
                color: "white",
                fontSize: "9px",
              }}
            >
              {loading ? "BEZIG..." : "MEEDOEN ▶"}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
