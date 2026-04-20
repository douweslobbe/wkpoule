const BASE = "https://api.football-data.org/v4"
const WC_ID = 2000 // FIFA World Cup competition ID

type FDTeam = {
  id: number
  name: string
  shortName: string
  tla: string
  crest: string
}

type FDScore = {
  home: number | null
  away: number | null
}

type FDMatch = {
  id: number
  utcDate: string
  status: string
  stage: string
  group: string | null
  matchday: number | null
  homeTeam: { id: number; name: string; shortName: string; tla: string; crest: string } | null
  awayTeam: { id: number; name: string; shortName: string; tla: string; crest: string } | null
  score: {
    fullTime: FDScore
    halfTime: FDScore
    winner: string | null
  }
  venue: string | null
}

async function fdFetch<T>(path: string): Promise<T> {
  const key = process.env.FOOTBALL_DATA_API_KEY
  if (!key) throw new Error("FOOTBALL_DATA_API_KEY niet ingesteld")

  const res = await fetch(`${BASE}${path}`, {
    headers: { "X-Auth-Token": key },
    next: { revalidate: 60 },
  })

  if (res.status === 429) throw new Error("Rate limit bereikt, probeer later opnieuw")
  if (!res.ok) throw new Error(`football-data.org fout: ${res.status} voor ${path}`)

  return res.json() as T
}

export async function fetchTeams(): Promise<FDTeam[]> {
  const data = await fdFetch<{ teams: FDTeam[] }>(`/competitions/${WC_ID}/teams`)
  return data.teams
}

export async function fetchMatches(): Promise<FDMatch[]> {
  const data = await fdFetch<{ matches: FDMatch[] }>(`/competitions/${WC_ID}/matches`)
  return data.matches
}

export function mapStage(fdStage: string): string {
  const map: Record<string, string> = {
    // Groepsfase
    GROUP_STAGE: "GROUP",
    GROUP: "GROUP",
    // Ronde van 32 — football-data.org gebruikt meerdere namen voor WK 2026
    ROUND_OF_32: "ROUND_OF_32",
    LAST_32: "ROUND_OF_32",
    PLAYOFFS_ROUND_1: "ROUND_OF_32",
    ROUND_OF_32_FIRST_PHASE: "ROUND_OF_32",
    // Ronde van 16
    ROUND_OF_16: "ROUND_OF_16",
    LAST_16: "ROUND_OF_16",
    PLAYOFFS_ROUND_2: "ROUND_OF_16",
    // Kwartfinale
    QUARTER_FINALS: "QUARTER_FINAL",
    QUARTER_FINAL: "QUARTER_FINAL",
    LAST_8: "QUARTER_FINAL",
    // Halve finale
    SEMI_FINALS: "SEMI_FINAL",
    SEMI_FINAL: "SEMI_FINAL",
    LAST_4: "SEMI_FINAL",
    // Derde/finale
    THIRD_PLACE: "THIRD_PLACE",
    THIRD_PLACE_MATCH: "THIRD_PLACE",
    PLAY_OFF_3RD_PLACE: "THIRD_PLACE",
    FINAL: "FINAL",
  }
  const result = map[fdStage]
  if (!result) {
    console.warn(`⚠️  Onbekende stage van football-data.org: "${fdStage}" → valt terug op GROUP`)
  }
  return result ?? "GROUP"
}

export function mapStatus(fdStatus: string): string {
  const map: Record<string, string> = {
    SCHEDULED: "SCHEDULED",
    TIMED: "SCHEDULED",
    IN_PLAY: "LIVE",
    PAUSED: "LIVE",
    FINISHED: "FINISHED",
    SUSPENDED: "POSTPONED",
    POSTPONED: "POSTPONED",
    CANCELLED: "POSTPONED",
  }
  return map[fdStatus] ?? "SCHEDULED"
}
