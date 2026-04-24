"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useRef, useEffect } from "react"

type Pool = { id: string; name: string }

export function PoolTabs({ pools }: { pools: Pool[] }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Determine active pool from URL
  const activePoolId = pools.find((p) => pathname.includes(p.id))?.id ?? null

  // Close dropdown when clicking outside
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
        href="/pools/new"
        className="shrink-0 px-2.5 py-1 font-bold whitespace-nowrap"
        style={{
          fontFamily: "var(--font-pixel), monospace",
          fontSize: "6px",
          color: "#4af56a",
          border: "1px solid #1a3d2a",
          background: "#0a1a10",
        }}
      >
        + POOL AANMAKEN
      </Link>
    )
  }

  // Show all pools inline if ≤ 3, dropdown for more
  const INLINE_LIMIT = 3
  const showInline = pools.length <= INLINE_LIMIT
  const activePool = pools.find((p) => p.id === activePoolId)

  return (
    <nav className="flex items-center gap-1 flex-1 justify-center px-2 overflow-x-auto">
      {showInline ? (
        <>
          {pools.map((pool) => {
            const active = pool.id === activePoolId
            return (
              <Link
                key={pool.id}
                href={`/pools/${pool.id}`}
                className="shrink-0 px-2.5 py-1 font-bold whitespace-nowrap transition-all"
                style={{
                  fontFamily: "var(--font-pixel), monospace",
                  fontSize: "6px",
                  color: active ? "#fff" : "#8888aa",
                  border: active ? "2px solid #FF6200" : "1px solid #2d2d50",
                  background: active ? "#FF6200" : "#0d0f1a",
                  boxShadow: active ? "2px 2px 0 #000" : "none",
                }}
              >
                {pool.name.toUpperCase()}
              </Link>
            )
          })}
        </>
      ) : (
        /* Dropdown for many pools */
        <div ref={dropdownRef} style={{ position: "relative" }}>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="shrink-0 px-2.5 py-1 font-bold whitespace-nowrap transition-all flex items-center gap-1"
            style={{
              fontFamily: "var(--font-pixel), monospace",
              fontSize: "6px",
              color: activePool ? "#fff" : "#8888aa",
              border: activePool ? "2px solid #FF6200" : "1px solid #2d2d50",
              background: activePool ? "#FF6200" : "#0d0f1a",
              boxShadow: activePool ? "2px 2px 0 #000" : "none",
              cursor: "pointer",
            }}
          >
            {activePool ? activePool.name.toUpperCase() : "POOLS"}
            <span style={{ fontSize: "8px", marginLeft: "2px" }}>{open ? "▴" : "▾"}</span>
          </button>

          {open && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 4px)",
                left: "50%",
                transform: "translateX(-50%)",
                background: "#0d0f1a",
                border: "2px solid #2d2d50",
                boxShadow: "4px 4px 0 #000",
                minWidth: "160px",
                zIndex: 100,
              }}
            >
              {pools.map((pool) => {
                const active = pool.id === activePoolId
                return (
                  <Link
                    key={pool.id}
                    href={`/pools/${pool.id}`}
                    onClick={() => setOpen(false)}
                    className="block px-3 py-2 font-bold whitespace-nowrap"
                    style={{
                      fontFamily: "var(--font-pixel), monospace",
                      fontSize: "6px",
                      color: active ? "#FF6200" : "#8888aa",
                      borderBottom: "1px solid #1a1d30",
                      background: active ? "#1a0800" : "transparent",
                    }}
                  >
                    {active ? "► " : "  "}{pool.name.toUpperCase()}
                  </Link>
                )
              })}
              <div style={{ borderTop: "1px solid #2d2d50" }}>
                <Link
                  href="/pools/new"
                  onClick={() => setOpen(false)}
                  className="block px-3 py-2 font-bold"
                  style={{ fontFamily: "var(--font-pixel), monospace", fontSize: "6px", color: "#4af56a" }}
                >
                  + NIEUWE POOL
                </Link>
                <Link
                  href="/pools/join"
                  onClick={() => setOpen(false)}
                  className="block px-3 py-2 font-bold"
                  style={{ fontFamily: "var(--font-pixel), monospace", fontSize: "6px", color: "#4af56a" }}
                >
                  + MEEDOEN MET CODE
                </Link>
              </div>
            </div>
          )}
        </div>
      )}

      {/* + button: when ≤ 3 pools, show as dropdown with create/join options */}
      {showInline && <PoolAddMenu />}
    </nav>
  )
}

function PoolAddMenu() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handle)
    return () => document.removeEventListener("mousedown", handle)
  }, [])

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="shrink-0 px-2 py-1 font-bold text-sm"
        style={{ color: "#4af56a", fontFamily: "var(--font-pixel)", fontSize: "10px", cursor: "pointer" }}
        title="Pool aanmaken of meedoen"
      >
        +
      </button>
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            right: 0,
            background: "#0d0f1a",
            border: "2px solid #2d2d50",
            boxShadow: "4px 4px 0 #000",
            minWidth: "140px",
            zIndex: 100,
          }}
        >
          <Link
            href="/pools/new"
            onClick={() => setOpen(false)}
            className="block px-3 py-2 font-bold"
            style={{ fontFamily: "var(--font-pixel), monospace", fontSize: "6px", color: "#4af56a", borderBottom: "1px solid #1a1d30" }}
          >
            + NIEUWE POOL
          </Link>
          <Link
            href="/pools/join"
            onClick={() => setOpen(false)}
            className="block px-3 py-2 font-bold"
            style={{ fontFamily: "var(--font-pixel), monospace", fontSize: "6px", color: "#4af56a" }}
          >
            + MEEDOEN MET CODE
          </Link>
        </div>
      )}
    </div>
  )
}
