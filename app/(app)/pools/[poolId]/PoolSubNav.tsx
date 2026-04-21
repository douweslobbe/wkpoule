"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

export function PoolSubNav({ poolId }: { poolId: string }) {
  const pathname = usePathname()

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
        p === `/pools/${poolId}` && !p.includes("/bonus") && !p.includes("/predictions"),
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
            className={`px-3 py-2 text-xs font-bold transition-all ${
              active ? "pixel-tab-active" : "pixel-tab-inactive"
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
