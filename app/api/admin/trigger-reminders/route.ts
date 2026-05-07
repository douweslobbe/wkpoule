import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { sendMatchReminderEmail } from "@/lib/email"

export async function POST() {
  const session = await auth()
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Geen toegang" }, { status: 403 })
  }

  const now = new Date()
  const windowStart = new Date(now.getTime() + 105 * 60 * 1000)
  const windowEnd   = new Date(now.getTime() + 135 * 60 * 1000)

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
  })

  if (upcomingMatches.length === 0) {
    return NextResponse.json({ ok: true, matches: 0, sent: 0, message: "Geen wedstrijden in het 2u-venster" })
  }

  const memberships = await prisma.poolMembership.findMany({
    include: {
      user: { select: { id: true, name: true, email: true } },
      pool: { select: { id: true, name: true } },
    },
  })

  const baseUrl = process.env.NEXTAUTH_URL ?? "https://wkpool2026.wesl.nl"
  let totalSent = 0

  for (const match of upcomingMatches) {
    const existing = await prisma.prediction.findMany({
      where: { matchId: match.id },
      select: { userId: true, poolId: true },
    })
    const predictedSet = new Set(existing.map((p) => `${p.userId}:${p.poolId}`))

    const missingByUser = new Map<string, { name: string; email: string; pools: string[] }>()
    for (const m of memberships) {
      if (predictedSet.has(`${m.userId}:${m.poolId}`)) continue
      if (!missingByUser.has(m.userId)) {
        missingByUser.set(m.userId, { name: m.user.name, email: m.user.email, pools: [] })
      }
      missingByUser.get(m.userId)!.pools.push(m.pool.name)
    }

    const homeTeam = match.homeTeam?.nameNl ?? match.homeTeam?.name ?? "?"
    const awayTeam = match.awayTeam?.nameNl ?? match.awayTeam?.name ?? "?"

    for (const [, { name, email, pools }] of missingByUser) {
      try {
        await sendMatchReminderEmail(email, name, homeTeam, awayTeam, match.kickoff, pools, `${baseUrl}/dashboard`)
        totalSent++
      } catch (err) {
        console.error(`[admin/trigger-reminders] email error voor ${email}:`, err)
      }
    }

    await prisma.match.update({
      where: { id: match.id },
      data: { reminderEmailSentAt: now },
    })
  }

  return NextResponse.json({ ok: true, matches: upcomingMatches.length, sent: totalSent })
}
