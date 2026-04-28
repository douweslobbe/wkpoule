"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"

type Pool = { id: string; name: string }

export function GlobalNav({
  pools,
  latestMessages,
}: {
  pools: Pool[]
  latestMessages: Record<string, number>
}) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [unreadPools, setUnreadPools] = useState<Set<string>>(new Set())

  // Actieve pool: eerst uit URL-pad, dan uit ?pool= param
  const poolFromPath = pools.find((p) => pathname.includes(p.id))
  const poolFromSearch = searchParams.get("pool") ?? undefined
  const activePool =
    poolFromPath ??
    (poolFromSearch ? pools.find((p) => p.id === poolFromSearch) : undefined) ??
    pools[0]

  // Ongelezen prikbord badge
  useEffect(() => {
    const unread = new Set<string>()
    for (const pool of pools) {
      const latestAt = latestMessages[pool.id]
      if (!latestAt) continue
      try {
        const seen = parseInt(localStorage.getItem(`prikbord_seen_${pool.id}`) ?? "0", 10)
        if (latestAt > seen) unread.add(pool.id)
      } catch { /* localStorage niet beschikbaar */ }
    }
    setUnreadPools(unread)
  }, [pools, latestMessages])

  // Zijn we binnen een pool-context?
  const inPool = !!poolFromPath

  // Heeft enige pool een ongelezen prikbord?
  const anyUnread = pools.some((p) => unreadPools.has(p.id))

  const mainTabs = [
    {
      href: "/dashboard",
      label: "🏠 Dashboard",
      isActive: pathname === "/dashboard",
    },
    {
      href: "/arena",
      label: "🏟️ De Arena",
      isActive: pathname === "/arena" || (pathname.startsWith("/pools/") || pathname.startsWith("/arena")),
      badge: anyUnread,
    },
    {
      href: "/survivor",
      label: "⚔ WK Survivor",
      isActive: pathname === "/survivor" || pathname.startsWith("/survivor/"),
    },
    {
      href: "/bracket",
      label: "🏟 Bracket",
      isActive: pathname === "/bracket" || pathname.startsWith("/bracket/"),
    },
    {
      href: "/ranglijst",
      label: "📊 De Megalomane Ranglijst",
      isActive: pathname === "/ranglijst" || pathname.startsWith("/ranglijst/"),
    },
    {
      href: "/faq",
      label: "❓ FAQ",
      isActive: pathname === "/faq" || pathname.startsWith("/faq/"),
    },
  ]

  return (
    <div className="space-y-1.5">
      {/* Hoofdtabs */}
      <div
        className="flex gap-1.5 no-scrollbar"
        style={{ overflowX: "auto", WebkitOverflowScrolling: "touch", paddingBottom: "2px" } as React.CSSProperties}
      >
        {mainTabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={`relative px-3 py-2 font-bold transition-all shrink-0 ${
              tab.isActive ? "pixel-tab-active" : "pixel-tab-inactive"
            }`}
            style={{ fontFamily: "var(--font-pixel), monospace", fontSize: "7px", whiteSpace: "nowrap" }}
          >
            {tab.label}
            {tab.badge && !tab.isActive && (
              <span style={{
                position: "absolute", top: "-4px", right: "-4px",
                width: "8px", height: "8px",
                background: "#ff4444", border: "1px solid #000", borderRadius: "0",
              }} />
            )}
          </Link>
        ))}
      </div>

      {/* Pool sub-nav — alleen zichtbaar binnen /pools/[poolId]/* */}
      {inPool && activePool && (
        <div
          className="flex items-center gap-0 no-scrollbar"
          style={{
            overflowX: "auto",
            WebkitOverflowScrolling: "touch",
            background: "#080e18",
            border: "2px solid #1a1d30",
            boxShadow: "inset 0 1px 0 #0d1525",
          } as React.CSSProperties}
        >
          {/* Pool naam als breadcrumb */}
          <Link
            href="/arena"
            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 font-pixel transition-colors"
            style={{ fontSize: "7px", color: "#4a6a8a", borderRight: "2px solid #1a1d30", whiteSpace: "nowrap" }}
          >
            ◄ <span style={{ color: "#7070a0" }}>{activePool.name.toUpperCase()}</span>
          </Link>

          {/* Sub-tabs */}
          {[
            { href: `/pools/${activePool.id}/predictions`, label: "⚽ De Wedstrijden",
              isActive: pathname.includes("/predictions") },
            { href: `/pools/${activePool.id}/bonus`,       label: "🏆 Het Grote Plaatje",
              isActive: pathname.includes("/bonus") || pathname.includes("/champion") },
            { href: `/pools/${activePool.id}/prikbord`,    label: "📌 Het Prikbord",
              isActive: pathname.includes("/prikbord"),
              badge: unreadPools.has(activePool.id) },
            { href: `/pools/${activePool.id}`,             label: "📊 De Ranglijst",
              isActive: pathname === `/pools/${activePool.id}` },
          ].map((sub) => (
            <Link
              key={sub.href}
              href={sub.href}
              className="relative shrink-0 px-3 py-1.5 font-bold transition-all"
              style={{
                fontFamily: "var(--font-pixel), monospace",
                fontSize: "7px",
                whiteSpace: "nowrap",
                color: sub.isActive ? "#fff" : "var(--c-text-nav)",
                background: sub.isActive ? "#FF6200" : "transparent",
                borderRight: "1px solid #1a1d30",
              }}
            >
              {sub.label}
              {sub.badge && !sub.isActive && (
                <span style={{
                  position: "absolute", top: "2px", right: "2px",
                  width: "6px", height: "6px",
                  background: "#ff4444", border: "1px solid #000",
                }} />
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
