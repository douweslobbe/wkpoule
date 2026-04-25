"use client"

import { useEffect, useState } from "react"

const TIPS = [
  "PRESS START TO PLAY",
  "INSERT COIN TO CONTINUE",
  "USE THE D-PAD TO NAVIGATE",
  "PRESS B TO BLOCK",
  "PRESS A TO JUMP",
  "ALL YOUR PICKS ARE BELONG TO US",
  "GAME OVER? PRESS RESTART",
  "HOLD UP+B FOR EXTRA LIFE",
  "WARP ZONE ACTIVATED",
  "DO A BARREL ROLL!",
  "IT'S DANGEROUS TO GO ALONE",
  "KEEP CALM AND HUP HOLLAND",
  "1UP! YOUR JOKER IS READY",
  "FATALITY... NOT REALLY",
  "10 GOTO PREDICTIONS",
  "THE CAKE IS A LIE — BUT 0-0 ISN'T",
  "ZERG RUSH KEKEKE ^_^",
]

export function RetroTips() {
  const [tip, setTip] = useState(TIPS[0])

  useEffect(() => {
    setTip(TIPS[Math.floor(Math.random() * TIPS.length)])
    const interval = setInterval(() => {
      setTip(TIPS[Math.floor(Math.random() * TIPS.length)])
    }, 12_000)
    return () => clearInterval(interval)
  }, [])

  return (
    <span className="font-pixel" style={{ fontSize: "6px", color: "#1d4f2a", letterSpacing: "1px" }}>
      ▸ {tip}
    </span>
  )
}
