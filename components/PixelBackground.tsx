"use client"

import { useState, useEffect } from "react"

// 8-bit football scenes from 8bit-football.com
// All images courtesy of 8bit-football.com
const IMAGES = [
  { src: "/backgrounds/dutch-legends.png",     w: 194, h:  94 }, // Gullit, Davids, Rijkaard
  { src: "/backgrounds/de-jong-alonso.png",     w: 224, h:  64 }, // De Jong vs Xabi Alonso
  { src: "/backgrounds/rijkaard-voller.png",    w: 194, h:  44 }, // Rijkaard/Völler
  { src: "/backgrounds/bergkamp-argentina.png", w: 224, h: 128 }, // Bergkamp goal vs Argentina
  { src: "/backgrounds/no-era-penal.png",       w: 360, h: 240 }, // Robben vs Mexico
  { src: "/backgrounds/ac-milan-1988.png",      w: 224, h:  96 }, // AC Milan / Netherlands 1988
  { src: "/backgrounds/tim-krul.png",           w: 224, h: 128 }, // Tim Krul penalty saver
  { src: "/backgrounds/world-cup-1998.png",     w: 224, h: 128 }, // WC 1998 players
]

export function PixelBackground() {
  const [idx, setIdx] = useState<number | null>(null)

  useEffect(() => {
    setIdx(Math.floor(Math.random() * IMAGES.length))
  }, [])

  if (idx === null) return null

  const img = IMAGES[idx]

  return (
    <div
      className="pixel-bg"
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "none",
        zIndex: 0,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={img.src}
        alt=""
        style={{
          width: "min(88vw, 900px)",
          maxHeight: "85vh",
          objectFit: "contain",
          imageRendering: "pixelated",
        }}
      />
    </div>
  )
}
