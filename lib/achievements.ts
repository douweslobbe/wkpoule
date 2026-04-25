// Centrale definitie van achievements — gedeeld tussen server (detection) en client (display)

export const ACHIEVEMENT_DEFS: Record<string, { label: string; emoji: string; description: string }> = {
  ORAKEL: { label: "Orakel", emoji: "🔮", description: "5× exact correct voorspeld" },
  SNIPER: { label: "Sniper", emoji: "🎯", description: "3 exacte voorspellingen op rij" },
  COUNTERPICK: { label: "Counterpick", emoji: "🔁", description: "Enige met deze kampioen" },
  GOKKER: { label: "Gokker", emoji: "🎲", description: "Een 0-0 exact voorspeld" },
  VERRASSING: { label: "Verrassing", emoji: "💥", description: "Onverwachte uitslag exact correct" },
  JOKER_HIT: { label: "Lucky Shot Hit", emoji: "★", description: "Joker-wedstrijd met punten" },
  PERFECT_DAY: { label: "Perfecte Dag", emoji: "🌟", description: "Alle wedstrijden van een dag exact goed" },
}
