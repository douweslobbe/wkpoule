"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useRef, useEffect } from "react"

type Pool = { id: string; name: string }

/**
 * Detecteer het huidige pagina-segment zodat een pool-switch je op
 * dezelfde soort pagina laat — bijv. wedstrijden blijft wedstrijden.
 */
function poolLink(targetPoolId: string, pathname: string): string {
  if (pathname.includes("/predictions")) return `/pools/${targetPoolId}/predictions`
  if (pathname.includes("/bonus") || pathname.includes("/champion")) return `/pools/${targetPoolId}/bonus`
  if (pathname.includes("/prikbord")) return `/pools/${targetPoolId}/prikbord`
  // Default: ranglijst / pool-dashboard
  return `/pools/${targetPoolId}`
}

export function PoolTabs({ pools }: { pools: Pool[] }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const activePoolId = pools.find((p) => pathname.includes(p.id))?.id ?? null

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handle)
    return () => document.removeEventListener("mousedown", handle)
  }, [])

  if (pools.length === 0) {
    return (
      <Link
        href="/pools/start"
        className="shrink-0 px-2.5 py-1 font-bold whitespace-nowrap"
        style={{ fontFamily: "var(--font-pixel), monospace", fontSize: "7px", color: "#4af56a", border: "1px solid #1a3d2a", background: "#0a1a10" }}
      >
        + POOL AANMAKEN
      </Link>
    )
  }

  const INLINE_LIMIT = 3
  const showInline = pools.length <= INLINE_LIMIT
  const activePool = pools.find((p) => p.id === activePoolId)

  const tabStyle = (active: boolean) => ({
    fontFamily: "var(--font-pixel), monospace",
    fontSize: "7px",
    color: active ? "#fff" : "var(--c-text-nav)",
    border: active ? "2px solid #FF6200" : "1px solid #2d2d50",
    background: active ? "#FF6200" : "#0d0f1a",
    boxShadow: active ? "2px 2px 0 #000" : "none",
  })

  return (
    <nav className="flex items-center gap-1 flex-1 justify-center px-2 overflow-x-auto">
      {showInline ? (
        <>
          {pools.map((pool) => {
            const active = pool.id === activePoolId
            return (
              <Link
                key={pool.id}
                href={poolLink(pool.id, pathname)}
                className="shrink-0 px-2.5 py-1 font-bold whitespace-nowrap transition-all"
                style={tabStyle(active)}
              >
                {pool.name.toUpperCase()}
              </Link>
            )
          })}
        </>
      ) : (
        <div ref={dropdownRef} style={{ position: "relative" }}>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="shrink-0 px-2.5 py-1 font-bold whitespace-nowrap transition-all flex items-center gap-1"
            style={{ ...tabStyle(!!activePool), cursor: "pointer" }}
          >
            {activePool ? activePool.name.toUpperCase() : "POOLS"}
            <span style={{ fontSize: "8px", marginLeft: "2px" }}>{open ? "▴" : "▾"}</span>
          </button>

          {open && (
            <div style={{ position: "absolute", top: "calc(100% + 4px)", left: "50%", transform: "translateX(-50%)", background: "#0d0f1a", border: "2px solid #2d2d50", boxShadow: "4px 4px 0 #000", minWidth: "160px", zIndex: 100 }}>
              {pools.map((pool) => {
                const active = pool.id === activePoolId
                return (
                  <Link
                    key={pool.id}
                    href={poolLink(pool.id, pathname)}
                    onClick={() => setOpen(false)}
                    className="block px-3 py-2 font-bold whitespace-nowrap"
                    style={{ fontFamily: "var(--font-pixel), monospace", fontSize: "7px", color: active ? "#FF6200" : "var(--c-text-nav)", borderBottom: "1px solid #1a1d30", background: active ? "#1a0800" : "transparent" }}
                  >
                    {active ? "► " : "  "}{pool.name.toUpperCase()}
                  </Link>
                )
              })}
              <div style={{ borderTop: "1px solid #2d2d50" }}>
                <Link
                  href="/pools/start"
                  onClick={() => setOpen(false)}
                  className="block px-3 py-2 font-bold"
                  style={{ fontFamily: "var(--font-pixel), monospace", fontSize: "7px", color: "#4af56a" }}
                >
                  + POOL AANMAKEN / MEEDOEN
                </Link>
              </div>
            </div>
          )}
        </div>
      )}

      {/* + knop: direct naar gecombineerde start-pagina */}
      {showInline && (
        <Link
          href="/pools/start"
          className="shrink-0 px-2.5 py-1 font-bold"
          style={{ color: "#4af56a", fontFamily: "var(--font-pixel)", fontSize: "12px", lineHeight: 1, border: "1px solid #1a3d2a", paddingTop: "3px", paddingBottom: "3px" }}
          title="Pool aanmaken of meedoen"
        >
          +
        </Link>
      )}
    </nav>
  )
}
