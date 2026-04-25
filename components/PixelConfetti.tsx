"use client"

const CONFETTI_COLORS = ["#FF6200", "#FFD700", "#4af56a", "#4499ff", "#ff4444"]

export function PixelConfetti({ count = 12 }: { count?: number }) {
  const pieces = Array.from({ length: count }, (_, i) => {
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5
    const distance = 30 + Math.random() * 30
    return {
      cx: Math.cos(angle) * distance,
      cy: Math.sin(angle) * distance - 20,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      delay: Math.random() * 0.05,
    }
  })

  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {pieces.map((p, i) => (
        <span
          key={i}
          className="confetti-piece"
          style={
            {
              left: "50%",
              top: "50%",
              background: p.color,
              "--cx": `${p.cx}px`,
              "--cy": `${p.cy}px`,
              animationDelay: `${p.delay}s`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  )
}
