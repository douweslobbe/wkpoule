"use client"

import { useEffect, useState } from "react"
import { isSoundEnabled, setSoundEnabled, playClick } from "@/lib/pixel-sound"

export function SoundToggle() {
  const [on, setOn] = useState(false)

  // Lees status na hydration zodat SSR consistent blijft
  useEffect(() => {
    setOn(isSoundEnabled())
  }, [])

  function toggle() {
    const next = !on
    setOn(next)
    setSoundEnabled(next)
    if (next) playClick()
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="shrink-0 px-2 py-1 font-pixel transition-colors flex items-center gap-1"
      style={{
        fontSize: "7px",
        color: on ? "#000" : "#8888aa",
        border: `2px solid ${on ? "#FFD700" : "#2d2d50"}`,
        background: on ? "#FFD700" : "transparent",
        boxShadow: on ? "1px 1px 0 #000" : "none",
        cursor: "pointer",
        lineHeight: 1,
      }}
      title={on ? "Geluid uit zetten" : "Geluid aan (8-bit FX)"}
      aria-label={on ? "Geluid uit" : "Geluid aan"}
    >
      <span style={{ fontSize: "11px" }}>♪</span>
      <span className="hidden sm:inline">{on ? "ON" : "OFF"}</span>
    </button>
  )
}
