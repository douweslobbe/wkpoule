import { PrismaClient, MatchStage, MatchStatus } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

// Mapping football-data.org stage strings
function mapStage(fdStage: string): MatchStage {
  const map: Record<string, MatchStage> = {
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

function mapStatus(fdStatus: string): MatchStatus {
  const map: Record<string, MatchStatus> = {
    SCHEDULED: "SCHEDULED",
    TIMED: "SCHEDULED",
    IN_PLAY: "LIVE",
    PAUSED: "LIVE",
    FINISHED: "FINISHED",
    SUSPENDED: "POSTPONED",
    POSTPONED: "POSTPONED",
  }
  return map[fdStatus] ?? "SCHEDULED"
}

async function fetchFromFootballData(path: string) {
  const key = process.env.FOOTBALL_DATA_API_KEY
  if (!key) {
    console.warn("⚠️  FOOTBALL_DATA_API_KEY niet ingesteld — wedstrijden worden overgeslagen")
    return null
  }
  const res = await fetch(`https://api.football-data.org/v4${path}`, {
    headers: { "X-Auth-Token": key },
  })
  if (!res.ok) {
    console.error(`football-data.org fout: ${res.status}`)
    return null
  }
  return res.json()
}

async function main() {
  console.log("🌱 Seeding database...")

  // Maak admin gebruiker aan
  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@wkpoule.nl"
  const adminPassword = process.env.ADMIN_PASSWORD ?? "admin123"

  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } })
  if (!existingAdmin) {
    await prisma.user.create({
      data: {
        name: "Admin",
        email: adminEmail,
        passwordHash: await bcrypt.hash(adminPassword, 12),
        isAdmin: true,
      },
    })
    console.log(`✅ Admin aangemaakt: ${adminEmail} / ${adminPassword}`)
  } else {
    console.log(`ℹ️  Admin bestaat al: ${adminEmail}`)
  }

  // Teams laden van football-data.org (of hardcoded fallback)
  const teamsData = await fetchFromFootballData("/competitions/2000/teams")

  if (teamsData?.teams) {
    console.log(`📦 ${teamsData.teams.length} teams synchroniseren...`)
    for (const t of teamsData.teams) {
      await prisma.team.upsert({
        where: { externalId: t.id },
        create: {
          name: t.name,
          nameNl: t.shortName ?? t.name,
          code: t.tla,
          flagUrl: t.crest,
          externalId: t.id,
        },
        update: {
          name: t.name,
          nameNl: t.shortName ?? t.name,
          code: t.tla,
          flagUrl: t.crest,
        },
      })
    }
    console.log("✅ Teams gesynchroniseerd")
  } else {
    // Fallback: seed bekende WK 2026 landen
    console.log("📦 Fallback: bekende landen toevoegen...")
    const fallbackTeams = [
      { name: "Nederland", code: "NED", externalId: 9000 },
      { name: "Duitsland", code: "GER", externalId: 9001 },
      { name: "Spanje", code: "ESP", externalId: 9002 },
      { name: "Frankrijk", code: "FRA", externalId: 9003 },
      { name: "Brazilië", code: "BRA", externalId: 9004 },
      { name: "Argentinië", code: "ARG", externalId: 9005 },
      { name: "Engeland", code: "ENG", externalId: 9006 },
      { name: "Portugal", code: "POR", externalId: 9007 },
    ]
    for (const t of fallbackTeams) {
      await prisma.team.upsert({
        where: { externalId: t.externalId },
        create: { ...t },
        update: { name: t.name, code: t.code },
      })
    }
    console.log("✅ Fallback teams aangemaakt")
  }

  // Wedstrijden laden
  const matchesData = await fetchFromFootballData("/competitions/2000/matches")

  if (matchesData?.matches) {
    console.log(`⚽ ${matchesData.matches.length} wedstrijden synchroniseren...`)
    for (const m of matchesData.matches) {
      const stage = mapStage(m.stage)
      const status = mapStatus(m.status)

      const homeTeam = m.homeTeam?.id
        ? await prisma.team.findUnique({ where: { externalId: m.homeTeam.id } })
        : null
      const awayTeam = m.awayTeam?.id
        ? await prisma.team.findUnique({ where: { externalId: m.awayTeam.id } })
        : null

      await prisma.match.upsert({
        where: { externalId: m.id },
        create: {
          externalId: m.id,
          stage,
          groupName: m.group,
          matchday: m.matchday,
          homeTeamId: homeTeam?.id ?? null,
          awayTeamId: awayTeam?.id ?? null,
          homeScore: m.score?.fullTime?.home ?? null,
          awayScore: m.score?.fullTime?.away ?? null,
          status,
          kickoff: new Date(m.utcDate),
          venue: m.venue,
          lastSyncedAt: new Date(),
        },
        update: {
          stage,
          groupName: m.group,
          homeTeamId: homeTeam?.id ?? null,
          awayTeamId: awayTeam?.id ?? null,
          homeScore: m.score?.fullTime?.home ?? null,
          awayScore: m.score?.fullTime?.away ?? null,
          status,
          kickoff: new Date(m.utcDate),
          venue: m.venue,
          lastSyncedAt: new Date(),
        },
      })
    }
    console.log("✅ Wedstrijden gesynchroniseerd")
  }

  console.log("🎉 Seeding voltooid!")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
