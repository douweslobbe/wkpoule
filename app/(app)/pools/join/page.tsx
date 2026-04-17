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
      <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-700 mb-4 inline-block">
        ← Terug
      </Link>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h1 className="text-xl font-bold text-gray-900 mb-4">Meedoen met een poule</h1>
        <p className="text-sm text-gray-500 mb-6">
          Voer de uitnodigingscode in die je hebt ontvangen.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Uitnodigingscode</label>
            <input
              name="inviteCode"
              type="text"
              required
              placeholder="bijv. ABC12345"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 font-mono uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 text-sm rounded-lg px-3 py-2">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg transition-colors"
          >
            {loading ? "Bezig..." : "Meedoen"}
          </button>
        </form>
      </div>
    </div>
  )
}
