"use client"

import { useState, useEffect, type JSX } from "react"

const P = 8 // px per "pixel"

// Color palette — anything not listed = transparent
const PAL: Record<string, string> = {
  G: "#FFD700", // gold
  g: "#997700", // medium gold
  D: "#664400", // dark gold / shadow
  W: "#FFFF99", // highlight / bright
  K: "#111111", // black
  L: "#e8e8e8", // white / light gray
  l: "#777788", // dim (net strings)
  E: "#1a7a30", // grass green
  e: "#145c23", // dark grass
  R: "#cc2222", // red
  N: "#9999cc", // neutral blue/purple
  O: "#FF6200", // orange
}

function Grid({ rows }: { rows: string[] }) {
  return (
    <>
      {rows.flatMap((row, ri) =>
        Array.from(row).flatMap((ch, ci) => {
          const fill = PAL[ch]
          if (!fill) return []
          return [
            <rect key={`${ri}-${ci}`} x={ci * P} y={ri * P} width={P} height={P} fill={fill} />,
          ]
        })
      )}
    </>
  )
}

// ─── Scene 1: WK Trophy ────────────────────────────────────────────────
const TROPHY = [
  "________________________",
  "___WGGGGGGGGGGGGGGW_____",
  "___GDDDDDDDDDDDDDDgG____",
  "GGG_GDDDDDDDDDDDDDgG_GG",
  "GWgGGDWWWWWWWWWWDDgGGgW",
  "GWgGGDWWWWWWWWWWDDgGGgW",
  "GWgGGDWWDDDDDDWWDDgGGgW",
  "GWgGGDWWDDDDDDWWDDgGGgW",
  "GWgGGDWWWWWWWWWWDDgGGgW",
  "GGG_GDDDDDDDDDDDDDgG_GG",
  "_____GGGGDDDDDDGGGGg____",
  "_________GGDDDGGg_______",
  "_________GGDDDgG________",
  "_________GGDDDgG________",
  "_________GGDDDgG________",
  "________GGGDDDgGG_______",
  "_____GGGGGGGGGGGGGGG____",
  "_____GDDDDDDDDDDDDgG____",
  "_____GDDDDDDDDDDDDgG____",
  "_____GGGGGGGGGGGGGGG____",
  "________________________",
]

// ─── Scene 2: Classic football ────────────────────────────────────────
const FOOTBALL = [
  "______LLLLLL________",
  "____LLLLLLLLLL______",
  "___LLLLKKLLLLLL_____",
  "__LLLKKKKLLLLLLL____",
  "__LLLKKLLLLLKLLL____",
  "_LLLLLLLLLKKKLLLL___",
  "_LLLLLLLLLKKLLLLL___",
  "_LLLLLLLLLLLLLLLLL__",
  "_LLLLLLLLLLLLLLLLL__",
  "_LLLLLLKLLLLLLLLLL__",
  "_LLLLLKKKLLLLLLLL___",
  "_LLLLLKKLLLLLLL_____",
  "__LLLLLLLLLLLLLL____",
  "___LLLLLLLLLLL______",
  "_____LLLLLLL________",
  "_______LLL__________",
]

// ─── Scene 3: Goal with net ────────────────────────────────────────────
const GOAL = [
  "________________________",
  "________________________",
  "LLLLLLLLLLLLLLLLLLLLLLll",
  "LL_l__l__l__l__l__l__lLL",
  "LLllllllllllllllllllllLL",
  "LL_l__l__l__l__l__l__lLL",
  "LLllllllllllllllllllllLL",
  "LL_l__l__l__l__l__l__lLL",
  "LLllllllllllllllllllllLL",
  "LL_l__l__l__l__l__l__lLL",
  "LLllllllllllllllllllllLL",
  "LL_l__l__l__l__l__l__lLL",
  "LLLLLLLLLLLLLLLLLLLLLLll",
  "EeEeEeEeEeEeEeEeEeEeEeEe",
  "eEeEeEeEeEeEeEeEeEeEeEeE",
  "EeEeEeEeEeEeEeEeEeEeEeEe",
]

// ─── Scene 4: Football pitch (top-down, generated) ────────────────────
function PitchRects() {
  const COLS = 38, ROWS = 20
  const W = "#e0e0e0"
  const rects: JSX.Element[] = []

  // Grass with vertical stripes
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const stripe = Math.floor(c / 4) % 2 === 0
      rects.push(
        <rect key={`g${r}-${c}`} x={c * P} y={r * P} width={P} height={P}
          fill={stripe ? "#1a7a30" : "#175f26"} />
      )
    }
  }

  // Outer border
  for (let c = 2; c < COLS - 2; c++) {
    rects.push(<rect key={`bt${c}`} x={c * P} y={1 * P} width={P} height={P} fill={W} />)
    rects.push(<rect key={`bb${c}`} x={c * P} y={(ROWS - 2) * P} width={P} height={P} fill={W} />)
  }
  for (let r = 2; r < ROWS - 2; r++) {
    rects.push(<rect key={`bl${r}`} x={2 * P} y={r * P} width={P} height={P} fill={W} />)
    rects.push(<rect key={`br${r}`} x={(COLS - 3) * P} y={r * P} width={P} height={P} fill={W} />)
  }

  // Vertical centre line
  const midC = Math.floor(COLS / 2)
  for (let r = 2; r < ROWS - 2; r++) {
    rects.push(<rect key={`cl${r}`} x={midC * P} y={r * P} width={P} height={P} fill={W} />)
  }

  // Centre circle (oval to match aspect ratio)
  const midR = Math.floor(ROWS / 2)
  for (let r = midR - 4; r <= midR + 4; r++) {
    for (let c = midC - 4; c <= midC + 4; c++) {
      const dr = (r - midR) * 1.4
      const dc = c - midC
      const dist = Math.sqrt(dr * dr + dc * dc)
      if (dist >= 2.9 && dist <= 3.9) {
        rects.push(<rect key={`cc${r}-${c}`} x={c * P} y={r * P} width={P} height={P} fill={W} />)
      }
    }
  }

  // Centre spot
  rects.push(<rect key="cs" x={midC * P} y={midR * P} width={P} height={P} fill={W} />)

  // Left penalty area (cols 2-10, rows 5 to ROWS-6)
  for (let r = 5; r <= ROWS - 6; r++) {
    for (let c = 2; c <= 10; c++) {
      if (r === 5 || r === ROWS - 6 || c === 10) {
        rects.push(<rect key={`lp${r}-${c}`} x={c * P} y={r * P} width={P} height={P} fill={W} />)
      }
    }
  }

  // Right penalty area
  for (let r = 5; r <= ROWS - 6; r++) {
    for (let c = COLS - 11; c <= COLS - 3; c++) {
      if (r === 5 || r === ROWS - 6 || c === COLS - 11) {
        rects.push(<rect key={`rp${r}-${c}`} x={c * P} y={r * P} width={P} height={P} fill={W} />)
      }
    }
  }

  // Left goal (inside border, 4 tall)
  for (let r = 8; r <= ROWS - 9; r++) {
    rects.push(<rect key={`lg${r}`} x={1 * P} y={r * P} width={P} height={P} fill={W} />)
  }
  rects.push(<rect key="lgt" x={1 * P} y={8 * P} width={P} height={P} fill={W} />)
  rects.push(<rect key="lgb" x={1 * P} y={(ROWS - 9) * P} width={P} height={P} fill={W} />)

  // Right goal
  for (let r = 8; r <= ROWS - 9; r++) {
    rects.push(<rect key={`rg${r}`} x={(COLS - 2) * P} y={r * P} width={P} height={P} fill={W} />)
  }

  return <>{rects}</>
}

// ─── Scene 5: Trophy on podium (wider format) ─────────────────────────
const STARS = [
  "___G_______________G___G",
  "________________________",
  "G___________G___________",
  "________________________",
  "___G_______________G____",
  "________________________",
  "G_______G_______________",
  "________________________",
  "___________G_______G____",
  "________________________",
  "____G___________________",
  "________________________",
]

type Scene =
  | { id: string; kind: "grid"; rows: string[]; scale: number }
  | { id: string; kind: "pitch"; scale: number }

const SCENES: Scene[] = [
  { id: "trophy", kind: "grid", rows: TROPHY, scale: 2.2 },
  { id: "football", kind: "grid", rows: FOOTBALL, scale: 2.8 },
  { id: "goal", kind: "grid", rows: GOAL, scale: 2.0 },
  { id: "pitch", kind: "pitch", scale: 1.6 },
  { id: "stars", kind: "grid", rows: STARS, scale: 2.0 },
]

export function PixelBackground() {
  const [idx, setIdx] = useState<number | null>(null)

  useEffect(() => {
    setIdx(Math.floor(Math.random() * (SCENES.length - 1))) // skip "stars" solo; it's a fallback
  }, [])

  if (idx === null) return null

  const scene = SCENES[idx]
  const PITCH_COLS = 38, PITCH_ROWS = 20

  const { svgW, svgH, viewW, viewH } =
    scene.kind === "grid"
      ? (() => {
          const rows = scene.rows
          const vW = Math.max(...rows.map((r) => r.length)) * P
          const vH = rows.length * P
          return { svgW: vW * scene.scale, svgH: vH * scene.scale, viewW: vW, viewH: vH }
        })()
      : {
          svgW: PITCH_COLS * P * scene.scale,
          svgH: PITCH_ROWS * P * scene.scale,
          viewW: PITCH_COLS * P,
          viewH: PITCH_ROWS * P,
        }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "none",
        zIndex: 0,
        opacity: 0.07,
      }}
    >
      <svg
        width={svgW}
        height={svgH}
        viewBox={`0 0 ${viewW} ${viewH}`}
        style={{ imageRendering: "pixelated" }}
      >
        {scene.kind === "grid" ? (
          <Grid rows={scene.rows} />
        ) : (
          <PitchRects />
        )}
      </svg>
    </div>
  )
}
