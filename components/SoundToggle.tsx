"use client"

import { useEffect, useState } from "react"
import { isSoundEnabled, setSoundEnabled, playClick } from "@/lib/pixel-sound"

export function SoundToggle() {
  const [on, setOn] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setOn(isSoundEnabled())
    setMounted(true)
  }, [])

  function toggle() {
    const next = !on
    setOn(next)
    setSoundEnabled(next)
    if (next) playClick()
  }

  if (!mounted) {
    return (
      <span
        className="shrink-0 px-2 py-1 font-pixel"
        style={{ fontSize: "7px", color: "#8888aa", border: "1px solid #2d2d50" }}
        aria-hidden="true"
      >
        ?
      </span>
    )
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="shrink-0 px-2 py-1 font-pixel transition-colors"
      style={{
        fontSize: "7px",
        color: on ? "#FFD700" : "#8888aa",
        border: `1px solid ${on ? "#FFD700" : "#2d2d50"}`,
        background: "transparent",
        cursor: "pointer",
      }}
      title={on ? "Geluid uit" : "Geluid aan (8-bit FX)"}
    >
      {on ? "♪" : "♫"}
    </button>
  )
}
