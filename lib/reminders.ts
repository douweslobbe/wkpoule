import { prisma } from "./prisma"
import { sendMatchRemindersDigestEmail, type ReminderMatch } from "./email"

/**
 * Stuurt herinneringsmails voor wedstrijden die over ~2 uur beginnen en waar
 * de gebruiker nog geen voorspelling voor heeft ingediend. Eén digest-mail per
 * gebruiker met al hun ontbrekende wedstrijden in het venster.
 *
 * Gedeeld door de cron-route en de handmatige admin-knop.
 */
export async function runMatchReminderEmails(): Promise<{ matches: number; sent: number }> {
  const now = new Date()
  // Venster: wedstrijden die over 1u45m tot 2u15m beginnen
  const windowStart = new Date(now.getTime() + 105 * 60 * 1000)
  const windowEnd = new Date(now.getTime() + 135 * 60 * 1000)

  const upcomingMatches = await prisma.match.findMany({
    where: {
      status: "SCHEDULED",
      kickoff: { gte: windowStart, lte: windowEnd },
      reminderEmailSentAt: null,
    },
    include: {
      homeTeam: { select: { name: true, nameNl: true } },
      awayTeam: { select: { name: true, nameNl: true } },
    },
    orderBy: { kickoff: "asc" },
  })

  if (upcomingMatches.length === 0) return { matches: 0, sent: 0 }

  // Alle pool-lidmaatschappen met gebruiker + pool
  const memberships = await prisma.poolMembership.findMany({
    include: {
      user: { select: { id: true, name: true, email: true } },
      pool: { select: { id: true, name: true } },
    },
  })

  const baseUrl = process.env.NEXTAUTH_URL ?? "https://wkpool2026.wesl.nl"

  // Verzamel per gebruiker alle ontbrekende wedstrijden (over al hun pools heen)
  const byUser = new Map<string, { name: string; email: string; matches: ReminderMatch[] }>()

  for (const match of upcomingMatches) {
    const existing = await prisma.prediction.findMany({
      where: { matchId: match.id },
      select: { userId: true, poolId: true },
    })
    const predictedSet = new Set(existing.map((p) => `${p.userId}:${p.poolId}`))

    // Per gebruiker: in welke pools mist deze wedstrijd nog een voorspelling?
    const missingPoolsByUser = new Map<string, { name: string; email: string; pools: string[] }>()
    for (const m of memberships) {
      if (predictedSet.has(`${m.userId}:${m.poolId}`)) continue
      if (!missingPoolsByUser.has(m.userId)) {
        missingPoolsByUser.set(m.userId, { name: m.user.name, email: m.user.email, pools: [] })
      }
      missingPoolsByUser.get(m.userId)!.pools.push(m.pool.name)
    }

    const homeTeam = match.homeTeam?.nameNl ?? match.homeTeam?.name ?? "?"
    const awayTeam = match.awayTeam?.nameNl ?? match.awayTeam?.name ?? "?"

    for (const [userId, { name, email, pools }] of missingPoolsByUser) {
      if (!byUser.has(userId)) byUser.set(userId, { name, email, matches: [] })
      byUser.get(userId)!.matches.push({ homeTeam, awayTeam, kickoff: match.kickoff, poolNames: pools })
    }
  }

  // Eén digest-mail per gebruiker
  let sent = 0
  for (const [, { name, email, matches }] of byUser) {
    try {
      await sendMatchRemindersDigestEmail(email, name, matches, `${baseUrl}/dashboard`)
      sent++
    } catch (err) {
      console.error(`[reminders] email-fout voor ${email}:`, err)
    }
  }

  // Markeer alle wedstrijden in het venster als herinnerd (ook bij mailfout,
  // zodat we niet bij elke cron-run opnieuw proberen)
  await prisma.match.updateMany({
    where: { id: { in: upcomingMatches.map((m) => m.id) } },
    data: { reminderEmailSentAt: now },
  })

  console.log(`[reminders] ${upcomingMatches.length} wedstrijd(en), ${sent} digest-mail(s) verstuurd`)
  return { matches: upcomingMatches.length, sent }
}
