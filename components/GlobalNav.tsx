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

  // Determine active pool: first from URL path (e.g. /pools/[id]/*),
  // then from ?pool= query param, then fall back to first pool.
  const poolFromPath = pools.find((p) => pathname.includes(p.id))?.id
  const poolFromSearch = searchParams.get("pool") ?? undefined
  const activePoolId =
    poolFromPath ??
    (poolFromSearch && pools.find((p) => p.id === poolFromSearch)?.id) ??
    pools[0]?.id

  // Unread prikbord badge: check localStorage against server timestamp
  useEffect(() => {
    const unread = new Set<string>()
    for (const pool of pools) {
      const latestAt = latestMessages[pool.id]
      if (!latestAt) continue
      try {
        const seen = parseInt(localStorage.getItem(`prikbord_seen_${pool.id}`) ?? "0", 10)
        if (latestAt > seen) unread.add(pool.id)
      } catch {
        // localStorage not available (SSR, private mode, etc.)
      }
    }
    setUnreadPools(unread)
  }, [pools, latestMessages])

  if (!activePoolId) return null

  const tabs = [
    {
      href: "/dashboard",
      label: "🏠 Dashboard",
      isActive: pathname === "/dashboard",
    },
    {
      href: `/pools/${activePoolId}/predictions`,
      label: "⚽ De Wedstrijden",
      isActive:
        pathname === "/predictions" ||
        pathname.startsWith("/predictions/") ||
        (pathname.startsWith("/pools/") && pathname.includes("/predictions")),
    },
    {
      href: `/pools/${activePoolId}/bonus`,
      label: "🏆 Het Grote Plaatje",
      isActive:
        pathname.includes("/bonus") ||
        pathname.includes("/champion"),
    },
    {
      href: `/pools/${activePoolId}`,
      label: "📊 De Megalomane Ranglijst",
      isActive:
        pathname === `/pools/${activePoolId}` ||
        (pathname.startsWith("/pools/") &&
          !pathname.includes("/bonus") &&
          !pathname.includes("/predictions") &&
          !pathname.includes("/prikbord") &&
          !pathname.includes("/champion")),
    },
    {
      href: `/pools/${activePoolId}/prikbord`,
      label: "📌 Het Prikbord",
      isActive: pathname.includes("/prikbord"),
      badge: unreadPools.has(activePoolId),
    },
    {
      href: "/bracket",
      label: "🏟 Bracket",
      isActive: pathname === "/bracket" || pathname.startsWith("/bracket/"),
    },
    {
      href: "/survivor",
      label: "⚔ WK Survivor",
      isActive: pathname === "/survivor" || pathname.startsWith("/survivor/"),
    },
    {
      href: "/faq",
      label: "❓ FAQ",
      isActive: pathname === "/faq" || pathname.startsWith("/faq/"),
    },
  ]

  return (
    <div
      className="flex gap-1.5 no-scrollbar"
      style={{
        overflowX: "auto",
        WebkitOverflowScrolling: "touch",
        paddingBottom: "2px",
      } as React.CSSProperties}
    >
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={`relative px-3 py-2 font-bold transition-all shrink-0 ${
            tab.isActive ? "pixel-tab-active" : "pixel-tab-inactive"
          }`}
          style={{
            fontFamily: "var(--font-pixel), monospace",
            fontSize: "7px",
            whiteSpace: "nowrap",
          }}
        >
          {tab.label}
          {tab.badge && !tab.isActive && (
            <span
              style={{
                position: "absolute",
                top: "-4px",
                right: "-4px",
                width: "8px",
                height: "8px",
                background: "#ff4444",
                border: "1px solid #000",
                borderRadius: "0",
              }}
            />
          )}
        </Link>
      ))}
    </div>
  )
}
