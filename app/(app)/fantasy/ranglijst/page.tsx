import { redirect } from "next/navigation"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Ranglijst — WK Manager 2026" }

export default async function FantasyRanglijstPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const teams = await prisma.fantasyTeam.findMany({
    orderBy: { totalPoints: "desc" },
    select: { id: true, nickname: true, totalPoints: true, userId: true },
  })

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <Link href="/fantasy" className="font-pixel" style={{ fontSize: "7px", color: "#7070a0" }}>◄ WK MANAGER</Link>
        <h1 className="font-pixel text-white" style={{ fontSize: "10px" }}>📊 RANGLIJST</h1>
      </div>

      <div className="pixel-card overflow-hidden">
        <div className="px-5 py-3" style={{ background: "#0a1f3d", borderBottom: "3px solid #000" }}>
          <h2 className="font-pixel text-white" style={{ fontSize: "9px" }}>ALLE TEAMS ({teams.length})</h2>
          <p className="mt-1 font-pixel" style={{ fontSize: "7px", color: "#4499ff" }}>Klik op een team om de selectie te bekijken</p>
        </div>

        {teams.length === 0 ? (
          <p className="font-pixel p-5 text-center" style={{ fontSize: "7px", color: "var(--c-text-4)" }}>
            Nog geen teams aangemeld.
          </p>
        ) : (
          teams.map((t, i) => (
            <Link
              key={t.id}
              href={`/fantasy/team/${t.userId}`}
              className="px-5 py-3 flex items-center gap-3 transition-all hover:opacity-80"
              style={{
                borderBottom: "1px solid var(--c-border)",
                background: t.userId === session.user.id ? "rgba(74, 245, 106, 0.05)" : undefined,
              }}
            >
              <span className="font-pixel shrink-0" style={{ fontSize: "8px", color: i === 0 ? "#FFD700" : i === 1 ? "#C0C0C0" : i === 2 ? "#CD7F32" : "var(--c-text-4)", minWidth: "24px" }}>
                {i + 1}
              </span>
              <span className="font-pixel flex-1" style={{ fontSize: "8px", color: t.userId === session.user.id ? "#4af56a" : "var(--c-text)" }}>
                {t.nickname}
                {t.userId === session.user.id && <span className="ml-2" style={{ color: "#4af56a", fontSize: "6px" }}>◄ JIJ</span>}
              </span>
              <span className="font-pixel" style={{ fontSize: "9px", color: "#FFD700" }}>{t.totalPoints} pt</span>
              <span className="font-pixel shrink-0" style={{ fontSize: "8px", color: "#4499ff" }}>›</span>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
