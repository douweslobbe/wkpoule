"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

export function PoolSubNav({ poolId }: { poolId: string }) {
  const pathname = usePathname()

  const tabs = [
    { href: `/predictions?pool=${poolId}`, label: "⚽ De Wedstrijden", match: "/predictions" },
    { href: `/pools/${poolId}/bonus`, label: "🏆 Het Grote Plaatje", match: "/bonus" },
    { href: `/pools/${poolId}`, label: "📊 De Megalomane Ranglijst", match: null },
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
