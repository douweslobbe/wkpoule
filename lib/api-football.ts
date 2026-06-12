// Integratie met API-Football (api-sports.io) voor spelersstatistieken per
// wedstrijd. Vereist env-var API_FOOTBALL_KEY. WK = league id 1.

const BASE = "https://v3.football.api-sports.io"
const WORLD_CUP_LEAGUE = 1

export const apiFootballEnabled = !!process.env.API_FOOTBALL_KEY

type AFWrapper<T> = { errors: unknown; results: number; response: T }

async function af<T>(path: string): Promise<T> {
  const key = process.env.API_FOOTBALL_KEY
  if (!key) throw new Error("API_FOOTBALL_KEY niet ingesteld")

  const res = await fetch(`${BASE}${path}`, {
    headers: { "x-apisports-key": key },
    next: { revalidate: 300 },
  })
  if (!res.ok) throw new Error(`API-Football fout: HTTP ${res.status}`)

  const json = (await res.json()) as AFWrapper<T>
  const errs = json.errors
  const hasErrors = Array.isArray(errs) ? errs.length > 0 : errs && typeof errs === "object" && Object.keys(errs).length > 0
  if (hasErrors) {
    throw new Error(`API-Football meldt: ${JSON.stringify(errs)}`)
  }
  return json.response
}

export function normalizeName(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // accenten
    .replace(/[^a-z0-9]/g, "")
}

type AFFixture = {
  fixture: { id: number }
  teams: { home: { name: string }; away: { name: string } }
  goals: { home: number | null; away: number | null }
}

/** Zoekt de API-Football fixture-id voor onze wedstrijd op datum + teams. */
export async function findFixtureId(
  dateISO: string,
  homeName: string,
  awayName: string,
  homeScore: number,
  awayScore: number,
  season = 2026,
): Promise<number | null> {
  const date = dateISO.slice(0, 10)
  const fixtures = await af<AFFixture[]>(`/fixtures?league=${WORLD_CUP_LEAGUE}&season=${season}&date=${date}`)

  const h = normalizeName(homeName)
  const a = normalizeName(awayName)
  const teamMatch = (our: string, theirs: string) => {
    const t = normalizeName(theirs)
    return t === our || t.includes(our) || our.includes(t)
  }

  // 1) beide teamnamen matchen
  let hit = fixtures.find((f) => teamMatch(h, f.teams.home.name) && teamMatch(a, f.teams.away.name))
  // 2) val terug op gelijke uitslag + één team dat matcht
  if (!hit) {
    hit = fixtures.find(
      (f) =>
        f.goals.home === homeScore &&
        f.goals.away === awayScore &&
        (teamMatch(h, f.teams.home.name) || teamMatch(a, f.teams.away.name)),
    )
  }
  return hit?.fixture.id ?? null
}

export type AFPlayerStat = {
  name: string
  minutes: number
  goals: number
  assists: number
  saves: number
  yellow: number
  red: number
  penaltyMissed: number
  penaltySaved: number
}

type AFFixturePlayersResponse = {
  team: { id: number; name: string }
  players: {
    player: { id: number; name: string }
    statistics: {
      games?: { minutes: number | null }
      goals?: { total: number | null; assists: number | null; saves: number | null }
      cards?: { yellow: number | null; red: number | null }
      penalty?: { missed: number | null; saved: number | null }
    }[]
  }[]
}[]

/** Haalt per speler de statistieken op voor één fixture (beide teams). */
export async function fetchFixturePlayerStats(fixtureId: number): Promise<AFPlayerStat[]> {
  const data = await af<AFFixturePlayersResponse>(`/fixtures/players?fixture=${fixtureId}`)
  const out: AFPlayerStat[] = []
  for (const team of data) {
    for (const p of team.players) {
      const s = p.statistics[0] ?? {}
      out.push({
        name: p.player.name,
        minutes: s.games?.minutes ?? 0,
        goals: s.goals?.total ?? 0,
        assists: s.goals?.assists ?? 0,
        saves: s.goals?.saves ?? 0,
        yellow: s.cards?.yellow ?? 0,
        red: s.cards?.red ?? 0,
        penaltyMissed: s.penalty?.missed ?? 0,
        penaltySaved: s.penalty?.saved ?? 0,
      })
    }
  }
  return out
}
