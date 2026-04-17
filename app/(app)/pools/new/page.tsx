"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function NewPoolPage() {
  const router = useRouter()
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")
    setLoading(true)

    const fd = new FormData(e.currentTarget)
    const res = await fetch("/api/pools", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: fd.get("name") }),
    })
    const data = await res.json()

    if (data.error) {
      setError(data.error)
      setLoading(false)
    } else {
      router.push(`/pools/${data.id}`)
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-700 mb-4 inline-block">
        ← Terug
      </Link>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h1 className="text-xl font-bold text-gray-900 mb-4">Nieuwe poule aanmaken</h1>
        <p className="text-sm text-gray-500 mb-6">
          Geef je poule een naam. Je krijgt een uitnodigingscode waarmee vrienden kunnen meedoen.
          De standaard bonusvragen worden automatisch aangemaakt — je kunt ze daarna aanpassen.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Naam van de poule</label>
            <input
              name="name"
              type="text"
              required
              placeholder="bijv. WK Poule Collega's"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
            {loading ? "Aanmaken..." : "Poule aanmaken"}
          </button>
        </form>
      </div>
    </div>
  )
}
