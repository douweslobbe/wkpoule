"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"

export function PoolSubNav({
  poolId,
  latestMessageAt,
}: {
  poolId: string
  latestMessageAt?: number
}) {
  const pathname = usePathname()
  const [hasUnread, setHasUnread] = useState(false)

  useEffect(() => {
    if (!latestMessageAt) return
    try {
      const seen = parseInt(localStorage.getItem(`prikbord_seen_${poolId}`) ?? "0", 10)
      setHasUnread(latestMessageAt > seen)
    } catch {
      // localStorage not available
    }
  }, [poolId, latestMessageAt])

  const tabs = [
    {
      href: `/predictions?pool=${poolId}`,
      label: "⚽ De Wedstrijden",
      isActive: (p: string) => p === "/predictions" || p.includes("/predictions"),
    },
    {
      href: `/pools/${poolId}/bonus`,
      label: "🏆 Het Grote Plaatje",
      isActive: (p: string) => p.includes("/bonus"),
    },
    {
      href: `/pools/${poolId}`,
      label: "📊 De Megalomane Ranglijst",
      isActive: (p: string) =>
        p === `/pools/${poolId}` && !p.includes("/bonus") && !p.includes("/predictions") && !p.includes("/prikbord"),
    },
    {
      href: `/pools/${poolId}/prikbord`,
      label: "📌 Het Prikbord",
      isActive: (p: string) => p.includes("/prikbord"),
      badge: hasUnread,
    },
  ]

  return (
    <div className="flex gap-2 flex-wrap mb-5">
      {tabs.map((tab) => {
        const active = tab.isActive(pathname)
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`relative px-3 py-2 text-xs font-bold transition-all ${
              active ? "pixel-tab-active" : "pixel-tab-inactive"
            }`}
            style={{ fontFamily: "var(--font-pixel), monospace", fontSize: "7px" }}
          >
            {tab.label}
            {tab.badge && !active && (
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
        )
      })}
    </div>
  )
}
