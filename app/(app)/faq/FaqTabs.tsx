"use client"

import { useState, useEffect, createContext, useContext } from "react"

const TABS = [
  { id: "poule",    label: "⚽ Poule" },
  { id: "survivor", label: "⚔ Survivor" },
  { id: "manager",  label: "🎮 WK Manager" },
  { id: "app",      label: "🕹 Over de app" },
] as const

type TabId = (typeof TABS)[number]["id"]

const ActiveTabCtx = createContext<TabId>("poule")

export function FaqTabs({ children }: { children: React.ReactNode }) {
  const [active, setActive] = useState<TabId>("poule")

  useEffect(() => {
    const hash = window.location.hash.replace("#", "") as TabId
    if (TABS.some((t) => t.id === hash)) setActive(hash)
  }, [])

  function switchTab(id: TabId) {
    setActive(id)
    window.history.replaceState(null, "", `#${id}`)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  return (
    <ActiveTabCtx.Provider value={active}>
      {/* Tab-balk */}
      <div
        className="flex gap-1 mb-5 no-scrollbar"
        style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" } as React.CSSProperties}
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => switchTab(tab.id)}
            className="font-pixel px-3 py-2 shrink-0 transition-all"
            style={{
              fontSize: "7px",
              whiteSpace: "nowrap",
              color: active === tab.id ? "white" : "var(--c-text-4)",
              background: active === tab.id ? "var(--c-surface-deep)" : "transparent",
              border: "1px solid",
              borderColor: active === tab.id ? "var(--c-border-mid)" : "transparent",
              borderBottom: active === tab.id ? "2px solid #4af56a" : "1px solid transparent",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {children}
    </ActiveTabCtx.Provider>
  )
}

export function FaqSection({
  tab,
  title,
  headerColor = "#0a3d1f",
  children,
}: {
  tab: TabId
  title: string
  headerColor?: string
  children: React.ReactNode
}) {
  const active = useContext(ActiveTabCtx)
  if (active !== tab) return null

  return (
    <div className="pixel-card overflow-hidden mb-5">
      <div className="px-5 py-3" style={{ background: headerColor, borderBottom: "3px solid #000" }}>
        <h2 className="font-pixel text-white" style={{ fontSize: "9px" }}>{title}</h2>
      </div>
      <div className="p-5 space-y-3" style={{ color: "var(--c-text-2)", fontSize: "9px", lineHeight: "2" }}>
        {children}
      </div>
    </div>
  )
}
