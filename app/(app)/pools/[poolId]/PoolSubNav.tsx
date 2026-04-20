"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

export function PoolSubNav({ poolId }: { poolId: string }) {
  const pathname = usePathname()

  const tabs = [
    { href: `/pools/${poolId}/predictions`, label: "⚽ VOORSPELLINGEN", match: "/predictions" },
    { href: `/pools/${poolId}/bonus`, label: "🏆 BONUS & KAMPIOEN", match: "/bonus" },
    { href: `/pools/${poolId}`, label: "📊 RANGLIJST", match: null },
  ]

  return (
    <div className="flex gap-2 flex-wrap mb-6">
      {tabs.map((tab) => {
        const isActive = tab.match
          ? pathname.includes(tab.match)
          : pathname === `/pools/${poolId}` || pathname === tab.href

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`px-3 py-2 text-xs font-bold transition-all ${
              isActive ? "pixel-tab-active" : "pixel-tab-inactive"
            }`}
            style={{ fontFamily: "var(--font-pixel), monospace", fontSize: "7px" }}
          >
            {tab.label}
          </Link>
        )
      })}
    </div>
  )
}
