"use client"

import { useEffect, useState } from "react"
import { playPowerUp, playLevelUp } from "@/lib/pixel-sound"

const KONAMI = [
  "ArrowUp", "ArrowUp",
  "ArrowDown", "ArrowDown",
  "ArrowLeft", "ArrowRight",
  "ArrowLeft", "ArrowRight",
  "b", "a",
]

const SPRITES = ["⚽", "🏆", "🥅", "🦁", "🐻", "🦅", "🐯", "🦓"]
const CONFETTI_COLORS = ["#FF6200", "#FFD700", "#4af56a", "#4499ff", "#ff4444", "#aa44ff"]

export function PixelGimmicks() {
  const [showBoot, setShowBoot] = useState(false)
  const [konamiToast, setKonamiToast] = useState(false)
  const [sprite, setSprite] = useState<string | null>(null)
  const [showGoal, setShowGoal] = useState(false)
  const [orangeDrops, setOrangeDrops] = useState<number[]>([])

  // CRT boot screen — alleen 1× per sessie
  useEffect(() => {
    try {
      if (!sessionStorage.getItem("wk-booted")) {
        setShowBoot(true)
        sessionStorage.setItem("wk-booted", "1")
        const timer = setTimeout(() => setShowBoot(false), 2400)
        return () => clearTimeout(timer)
      }
    } catch {
      // sessionStorage onbeschikbaar
    }
  }, [])

  // Cheat codes: Konami + HUP + GOAL
  useEffect(() => {
    let buffer: string[] = []
    let typed = ""

    function activateKonami() {
      document.body.classList.toggle("konami-active")
      setKonamiToast(true)
      playLevelUp()
      setTimeout(() => setKonamiToast(false), 4000)
    }

    function activateHup() {
      // Spawn 60 oranje druppels die verschillende snelheden hebben
      const drops = Array.from({ length: 60 }, () => Math.random())
      setOrangeDrops(drops)
      playPowerUp()
      setTimeout(() => setOrangeDrops([]), 4500)
    }

    function activateGoal() {
      setShowGoal(true)
      playLevelUp()
      setTimeout(() => setShowGoal(false), 2000)
    }

    function handle(e: KeyboardEvent) {
      // Negeer als gebruiker in input/textarea typt
      const target = e.target as HTMLElement
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) {
        return
      }

      // Konami via key-codes
      buffer.push(e.key.length === 1 ? e.key.toLowerCase() : e.key)
      if (buffer.length > KONAMI.length) buffer = buffer.slice(-KONAMI.length)
      if (buffer.length === KONAMI.length && buffer.every((k, i) => k === KONAMI[i])) {
        activateKonami()
        buffer = []
      }

      // Word-based cheats: HUP, GOAL
      if (e.key.length === 1 && /[a-z]/i.test(e.key)) {
        typed = (typed + e.key.toLowerCase()).slice(-6)
        if (typed.endsWith("hup")) activateHup()
        else if (typed.endsWith("goal")) activateGoal()
      }
    }
    window.addEventListener("keydown", handle)
    return () => window.removeEventListener("keydown", handle)
  }, [])

  // Walking sprite — verschijnt random elke 30-90 sec
  useEffect(() => {
    function spawn() {
      setSprite(SPRITES[Math.floor(Math.random() * SPRITES.length)])
      setTimeout(() => setSprite(null), 60_000)
    }
    const initial = setTimeout(spawn, 8000)
    const interval = setInterval(() => {
      if (Math.random() > 0.4) spawn()
    }, 90_000)
    return () => {
      clearTimeout(initial)
      clearInterval(interval)
    }
  }, [])

  return (
    <>
      {showBoot && (
        <div className="crt-boot">
          <div className="crt-boot-ball">⚽</div>
          <div className="crt-boot-title">WK POOL 2026</div>
          <div className="crt-boot-sub">PRESS START</div>
        </div>
      )}

      {sprite && (
        <div className="walking-sprite">
          <span className="walking-sprite-inner">{sprite}</span>
        </div>
      )}

      {konamiToast && (
        <div
          className="font-pixel"
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            background: "#000",
            border: "3px solid #FFD700",
            boxShadow: "4px 4px 0 #000",
            padding: "20px 28px",
            zIndex: 99998,
            fontSize: "10px",
            color: "#FFD700",
            textAlign: "center",
            lineHeight: 2,
            animation: "score-pop 0.6s ease-out",
          }}
        >
          🌈 RAINBOW MODE 🌈
          <div style={{ fontSize: "7px", color: "#fff", marginTop: 8 }}>
            CHEAT CODE GEACTIVEERD
          </div>
          <div style={{ fontSize: "6px", color: "#888", marginTop: 6 }}>
            (nogmaals = uit)
          </div>
        </div>
      )}

      {showGoal && (
        <div className="goal-banner">GOAL!!!</div>
      )}

      {orangeDrops.length > 0 && (
        <>
          {orangeDrops.map((seed, i) => (
            <span
              key={i}
              className="orange-drop"
              style={{
                left: `${seed * 100}%`,
                animationDuration: `${2 + seed * 2}s`,
                animationDelay: `${seed * 1.5}s`,
              }}
            />
          ))}
        </>
      )}
    </>
  )
}
