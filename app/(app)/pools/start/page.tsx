"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function PoolStartPage() {
  const router = useRouter()

  const [newName, setNewName] = useState("")
  const [newLoading, setNewLoading] = useState(false)
  const [newError, setNewError] = useState("")

  const [joinCode, setJoinCode] = useState("")
  const [joinLoading, setJoinLoading] = useState(false)
  const [joinError, setJoinError] = useState("")

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setNewError("")
    setNewLoading(true)
    const res = await fetch("/api/pools", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName }),
    })
    const data = await res.json()
    if (data.error) { setNewError(data.error); setNewLoading(false) }
    else router.push(`/pools/${data.id}`)
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault()
    setJoinError("")
    setJoinLoading(true)
    const res = await fetch("/api/pools/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inviteCode: joinCode }),
    })
    const data = await res.json()
    if (data.error) { setJoinError(data.error); setJoinLoading(false) }
    else router.push(`/pools/${data.poolId}`)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard" className="font-pixel" style={{ fontSize: "7px", color: "#7070a0" }}>
          ◄ DASHBOARD
        </Link>
        <h1 className="font-pixel text-white" style={{ fontSize: "10px" }}>POOLS</h1>
      </div>

      <div className="grid sm:grid-cols-2 gap-5">

        {/* Nieuwe pool aanmaken */}
        <div className="pixel-card overflow-hidden">
          <div className="px-5 py-4" style={{ background: "#0a3d1f", borderBottom: "3px solid #000" }}>
            <div className="text-3xl mb-2">➕</div>
            <h2 className="font-pixel text-white" style={{ fontSize: "9px" }}>NIEUWE POOL</h2>
            <p className="font-pixel mt-1" style={{ fontSize: "7px", color: "#4af56a" }}>
              Maak een pool aan voor vrienden, familie of collega&apos;s
            </p>
          </div>
          <form onSubmit={handleCreate} className="p-5 space-y-4">
            <div>
              <label className="block font-pixel mb-2" style={{ fontSize: "7px", color: "var(--c-text-3)" }}>
                NAAM VAN DE POOL
              </label>
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="bijv. WK Poule Collega's"
                className="pixel-input w-full px-3 py-2"
                style={{ fontSize: "13px" }}
              />
            </div>
            <p className="font-pixel" style={{ fontSize: "7px", color: "var(--c-text-4)", lineHeight: "1.8" }}>
              Je krijgt automatisch een uitnodigingscode waarmee anderen kunnen meedoen. Bonusvragen worden alvast aangemaakt.
            </p>
            {newError && (
              <p className="font-pixel px-3 py-2" style={{ fontSize: "8px", color: "#ff6666", background: "#2a0000", border: "2px solid #cc0000" }}>
                ❌ {newError}
              </p>
            )}
            <button
              type="submit"
              disabled={newLoading}
              className="pixel-btn w-full py-3 font-pixel"
              style={{ background: newLoading ? "#0a2a00" : "#4af56a", color: "#000", fontSize: "9px", fontWeight: "bold" }}
            >
              {newLoading ? "AANMAKEN..." : "POOL AANMAKEN ▶"}
            </button>
          </form>
        </div>

        {/* Meedoen met bestaande pool */}
        <div className="pixel-card overflow-hidden">
          <div className="px-5 py-4" style={{ background: "#1a0d00", borderBottom: "3px solid #000" }}>
            <div className="text-3xl mb-2">🎟</div>
            <h2 className="font-pixel text-white" style={{ fontSize: "9px" }}>MEEDOEN MET POOL</h2>
            <p className="font-pixel mt-1" style={{ fontSize: "7px", color: "#FF6200" }}>
              Je hebt een uitnodigingscode ontvangen van de beheerder
            </p>
          </div>
          <form onSubmit={handleJoin} className="p-5 space-y-4">
            <div>
              <label className="block font-pixel mb-2" style={{ fontSize: "7px", color: "var(--c-text-3)" }}>
                UITNODIGINGSCODE
              </label>
              <input
                type="text"
                required
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="bijv. ABC12345"
                className="pixel-input w-full px-3 py-2 uppercase tracking-widest"
                style={{ fontSize: "16px", letterSpacing: "0.25em" }}
              />
            </div>
            <p className="font-pixel" style={{ fontSize: "7px", color: "var(--c-text-4)", lineHeight: "1.8" }}>
              Vraag de code op bij de beheerder van de pool, of klik op de uitnodigingslink die je hebt ontvangen.
            </p>
            {joinError && (
              <p className="font-pixel px-3 py-2" style={{ fontSize: "8px", color: "#ff6666", background: "#2a0000", border: "2px solid #cc0000" }}>
                ❌ {joinError}
              </p>
            )}
            <button
              type="submit"
              disabled={joinLoading}
              className="pixel-btn w-full py-3 font-pixel"
              style={{ background: joinLoading ? "#1a0800" : "#FF6200", color: "white", fontSize: "9px", fontWeight: "bold" }}
            >
              {joinLoading ? "BEZIG..." : "MEEDOEN ▶"}
            </button>
          </form>
        </div>

      </div>
    </div>
  )
}
