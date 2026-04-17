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
    GROUP_STAGE: "GROUP",
    ROUND_OF_32: "ROUND_OF_32",
    ROUND_OF_16: "ROUND_OF_16",
    QUARTER_FINALS: "QUARTER_FINAL",
    SEMI_FINALS: "SEMI_FINAL",
    THIRD_PLACE: "THIRD_PLACE",
    FINAL: "FINAL",
  }
  return map[fdStage] ?? "GROUP"
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
