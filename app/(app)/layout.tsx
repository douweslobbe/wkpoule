import { redirect } from "next/navigation"
import Link from "next/link"
import { Suspense } from "react"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { PixelBackground } from "@/components/PixelBackground"
import { ThemeToggle } from "@/components/ThemeToggle"
import { LogoutButton } from "@/components/LogoutButton"
import { PoolTabs } from "@/components/PoolTabs"
import { PixelGimmicks } from "@/components/PixelGimmicks"
import { SoundToggle } from "@/components/SoundToggle"
import { RetroTips } from "@/components/RetroTips"
import { GlobalNav } from "@/components/GlobalNav"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const pools = await prisma.poolMembership.findMany({
    where: { userId: session.user.id },
    include: { pool: { select: { id: true, name: true } } },
    orderBy: { joinedAt: "asc" },
  })

  const poolList = pools.map((m) => ({ id: m.pool.id, name: m.pool.name }))
  const poolIds = poolList.map((p) => p.id)

  // Latest prikbord message per pool, for the unread badge in GlobalNav
  const latestMsgs = poolIds.length > 0
    ? await prisma.poolMessage.groupBy({
        by: ["poolId"],
        where: { poolId: { in: poolIds } },
        _max: { createdAt: true },
      })
    : []
  const latestMessages: Record<string, number> = Object.fromEntries(
    latestMsgs.map((m) => [m.poolId, m._max.createdAt?.getTime() ?? 0])
  )

  return (
    <div className="min-h-screen flex flex-col pitch-bg scanlines" style={{ position: "relative" }}>
      <PixelBackground />
      <PixelGimmicks />
      {/* SNES-style header */}
      <header className="sticky top-0 z-50" style={{ background: "#071810", borderBottom: "4px solid #000", boxShadow: "0 4px 0 #0a3d1f" }}>
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-2">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2 shrink-0">
            <span className="text-xl">⚽</span>
            <div className="hidden lg:block">
              <span className="font-pixel" style={{ fontSize: "5px", lineHeight: "2", display: "block", color: "#aaaaaa" }}>
                DOUWE&apos;S SUPER MEGALOMANE
              </span>
              <span className="font-pixel" style={{ fontSize: "7px", lineHeight: "1.5", display: "block" }}>
                <span style={{ color: "#FF6200" }}>WK</span>{" "}
                <span style={{ color: "#FFD700" }}>POOL</span>{" "}
                <span style={{ color: "#4af56a" }}>2026</span>
              </span>
            </div>
            <div className="hidden sm:block lg:hidden">
              <span className="font-pixel" style={{ fontSize: "7px", lineHeight: "1.5", display: "block" }}>
                <span style={{ color: "#FF6200" }}>WK</span>{" "}
                <span style={{ color: "#FFD700" }}>POOL</span>{" "}
                <span style={{ color: "#4af56a" }}>&apos;26</span>
              </span>
            </div>
          </Link>

          {/* Pool tabs */}
          <PoolTabs pools={poolList} />

          {/* User / admin */}
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/profile"
              className="hidden md:inline font-pixel transition-colors hover:opacity-80"
              style={{ fontSize: "6px", color: "#4af56a", textDecoration: "none" }}
              title="Mijn profiel"
            >
              {session.user.name?.toUpperCase()}
            </Link>
            <SoundToggle />
            <ThemeToggle />
            {session.user.isAdmin && (
              <Link
                href="/admin"
                className="px-2 py-1 font-bold"
                style={{ background: "#FFD700", color: "#000", border: "2px solid #000", fontFamily: "var(--font-pixel)", fontSize: "7px", boxShadow: "2px 2px 0 #000" }}
              >
                ADMIN
              </Link>
            )}
            <LogoutButton />
          </div>
        </div>
      </header>

      {/* Global navigation — shown on every page */}
      {poolList.length > 0 && (
        <div
          className="max-w-6xl mx-auto w-full px-4 pt-3"
          style={{ position: "relative", zIndex: 2 }}
        >
          <Suspense fallback={<div style={{ height: "36px" }} />}>
            <GlobalNav pools={poolList} latestMessages={latestMessages} />
          </Suspense>
        </div>
      )}

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-5" style={{ position: "relative", zIndex: 1 }}>
        {children}
      </main>

      <footer className="text-center py-4 space-y-1" style={{ borderTop: "3px solid #0a3d1f", position: "relative", zIndex: 1, overflow: "hidden" }}>
        <div>
          <span className="font-pixel" style={{ fontSize: "7px", color: "#2d6b3d" }}>
            HUP HOLLAND HUP 🇳🇱 · WK 2026
          </span>
        </div>
        <div>
          <RetroTips />
        </div>
        {/* Decoratieve hoek-icoontjes */}
        <span style={{ position: "absolute", left: "12px", bottom: "2px", fontSize: "18px", opacity: 0.12, pointerEvents: "none" }}>🏆</span>
        <span style={{ position: "absolute", right: "12px", bottom: "2px", fontSize: "18px", opacity: 0.12, pointerEvents: "none" }}>⚽</span>
      </footer>
    </div>
  )
}
