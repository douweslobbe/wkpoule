"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"

export default function JoinPoolPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [code, setCode] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  // Pre-fill code van URL parameter (?code=ABC12345)
  useEffect(() => {
    const urlCode = searchParams.get("code")
    if (urlCode) setCode(urlCode.toUpperCase())
  }, [searchParams])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")
    setLoading(true)

    const res = await fetch("/api/pools/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inviteCode: code }),
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
        <div className="px-5 py-3" style={{ background: "#0a3d1f", borderBottom: "3px solid #000" }}>
          <h1 className="font-pixel text-white" style={{ fontSize: "9px" }}>🎟 MEEDOEN MET POOL</h1>
        </div>

        <div className="p-5">
          <p className="mb-5 font-pixel" style={{ color: "#7070a0", fontSize: "8px", lineHeight: "2" }}>
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
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="bijv. ABC12345"
                className="pixel-input w-full px-3 py-2 uppercase tracking-widest"
                style={{ letterSpacing: "0.2em" }}
                autoFocus={!code}
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
