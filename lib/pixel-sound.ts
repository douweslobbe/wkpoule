// 8-bit sound effects gegenereerd via Web Audio API — geen files nodig

let ctx: AudioContext | null = null

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null
  if (!ctx) {
    try {
      ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    } catch {
      return null
    }
  }
  return ctx
}

function isMuted(): boolean {
  if (typeof window === "undefined") return true
  try {
    return localStorage.getItem("wk-sound") !== "on"
  } catch {
    return true
  }
}

export function setSoundEnabled(on: boolean) {
  try {
    localStorage.setItem("wk-sound", on ? "on" : "off")
  } catch {
    // ignore
  }
}

export function isSoundEnabled(): boolean {
  return !isMuted()
}

function playTone(frequency: number, duration: number, type: OscillatorType = "square", volume = 0.05, when = 0) {
  const audio = getCtx()
  if (!audio) return
  const osc = audio.createOscillator()
  const gain = audio.createGain()
  osc.type = type
  osc.frequency.value = frequency
  osc.connect(gain)
  gain.connect(audio.destination)
  const start = audio.currentTime + when
  gain.gain.setValueAtTime(volume, start)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)
  osc.start(start)
  osc.stop(start + duration)
}

// Korte coin-blip bij saven (NES-stijl)
export function playSave() {
  if (isMuted()) return
  playTone(880, 0.06, "square", 0.04)
  playTone(1320, 0.10, "square", 0.04, 0.05)
}

// Power-up bij joker activeren (Mario-stijl arpeggio)
export function playPowerUp() {
  if (isMuted()) return
  const notes = [523, 659, 784, 1046] // C E G C oktaaf
  notes.forEach((n, i) => playTone(n, 0.08, "square", 0.05, i * 0.06))
}

// Level-up jingle bij achievement
export function playLevelUp() {
  if (isMuted()) return
  const notes = [392, 523, 659, 784, 1046]
  notes.forEach((n, i) => playTone(n, 0.12, "triangle", 0.06, i * 0.08))
}

// Boze buzzer bij error / niet-toegestane actie
export function playError() {
  if (isMuted()) return
  playTone(196, 0.15, "sawtooth", 0.04)
}

// Retro click (lichter feedback)
export function playClick() {
  if (isMuted()) return
  playTone(2000, 0.02, "square", 0.02)
}
