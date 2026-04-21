"use server"

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import bcrypt from "bcryptjs"
import { nanoid } from "nanoid"
import { auth, signIn, signOut } from "./auth"
import { prisma } from "./prisma"
import { DEFAULT_BONUS_QUESTIONS } from "./default-bonus-questions"
import { scoreGroupMatch, scoreKnockoutMatch, scoreEstimationQuestion, CHAMPION_POINTS, BONUS_POINTS } from "./scoring"
import { MatchStage, MatchStatus, BonusQuestionType } from "@prisma/client"

// Toernooi start — deadline voor bonus vragen en kampioen pick
const TOURNAMENT_START = new Date("2026-06-11T20:00:00Z")

// ─── Auth ────────────────────────────────────────────────────────────────────

export async function register(formData: FormData) {
  const name = (formData.get("name") as string)?.trim()
  const email = (formData.get("email") as string)?.toLowerCase().trim()
  const password = formData.get("password") as string

  if (!name || !email || !password) return { error: "Vul alle velden in" }
  if (password.length < 6) return { error: "Wachtwoord moet minimaal 6 tekens zijn" }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) return { error: "Dit e-mailadres is al in gebruik" }

  const passwordHash = await bcrypt.hash(password, 12)
  await prisma.user.create({ data: { name, email, passwordHash } })

  await signIn("credentials", { email, password, redirectTo: "/dashboard" })
}

export async function logout() {
  await signOut({ redirectTo: "/login" })
}

// ─── Poules ──────────────────────────────────────────────────────────────────

export async function createPool(formData: FormData) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const name = (formData.get("name") as string)?.trim()
  if (!name) return { error: "Geef de poule een naam" }

  const inviteCode = nanoid(8).toUpperCase()

  const pool = await prisma.pool.create({
    data: {
      name,
      inviteCode,
      createdById: session.user.id,
      memberships: {
        create: { userId: session.user.id, role: "ADMIN" },
      },
      bonusQuestions: {
        create: DEFAULT_BONUS_QUESTIONS.map((q) => ({
          type: q.type,
          question: q.question,
          description: q.description,
          orderIndex: q.orderIndex,
          deadline: TOURNAMENT_START,
        })),
      },
    },
  })

  redirect(`/pools/${pool.id}`)
}

export async function joinPool(formData: FormData) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const code = (formData.get("inviteCode") as string)?.trim().toUpperCase()
  if (!code) return { error: "Voer een uitnodigingscode in" }

  const pool = await prisma.pool.findUnique({ where: { inviteCode: code } })
  if (!pool) return { error: "Onbekende uitnodigingscode" }

  const existing = await prisma.poolMembership.findUnique({
    where: { userId_poolId: { userId: session.user.id, poolId: pool.id } },
  })
  if (existing) return { error: "Je bent al lid van deze poule" }

  await prisma.poolMembership.create({
    data: { userId: session.user.id, poolId: pool.id, role: "MEMBER" },
  })

  redirect(`/pools/${pool.id}`)
}

// ─── Voorspellingen ──────────────────────────────────────────────────────────

export async function savePrediction(formData: FormData) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const matchId = formData.get("matchId") as string
  const homeScore = parseInt(formData.get("homeScore") as string, 10)
  const awayScore = parseInt(formData.get("awayScore") as string, 10)

  if (isNaN(homeScore) || isNaN(awayScore) || homeScore < 0 || awayScore < 0) {
    return { error: "Ongeldige score" }
  }

  const match = await prisma.match.findUnique({ where: { id: matchId } })
  if (!match) return { error: "Wedstrijd niet gevonden" }

  const deadline = new Date(match.kickoff.getTime() - 30 * 60 * 1000)
  if (new Date() > deadline) return { error: "De voorspeltermijn is verstreken" }

  await prisma.prediction.upsert({
    where: { userId_matchId: { userId: session.user.id, matchId } },
    create: { userId: session.user.id, matchId, homeScore, awayScore },
    update: { homeScore, awayScore, pointsAwarded: null },
  })

  revalidatePath("/pools")
  return { success: true }
}

// ─── Bonusvragen ─────────────────────────────────────────────────────────────

export async function saveBonusAnswer(formData: FormData) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const questionId = formData.get("questionId") as string
  const answer = (formData.get("answer") as string)?.trim()

  if (!answer) return { error: "Geef een antwoord" }

  const question = await prisma.bonusQuestion.findUnique({ where: { id: questionId } })
  if (!question) return { error: "Vraag niet gevonden" }

  const deadline = question.deadline ?? TOURNAMENT_START
  if (new Date() > deadline) return { error: "De antwoordtermijn is verstreken" }

  await prisma.bonusAnswer.upsert({
    where: { userId_questionId: { userId: session.user.id, questionId } },
    create: { userId: session.user.id, questionId, answer },
    update: { answer, pointsAwarded: null },
  })

  revalidatePath("/pools")
  return { success: true }
}

export async function saveAllBonusAnswers(formData: FormData) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const poolId = formData.get("poolId") as string
  const questions = await prisma.bonusQuestion.findMany({ where: { poolId } })

  const errors: string[] = []
  for (const q of questions) {
    const answer = (formData.get(`answer_${q.id}`) as string)?.trim()
    if (!answer) continue

    const deadline = q.deadline ?? TOURNAMENT_START
    if (new Date() > deadline) continue

    await prisma.bonusAnswer.upsert({
      where: { userId_questionId: { userId: session.user.id, questionId: q.id } },
      create: { userId: session.user.id, questionId: q.id, answer },
      update: { answer, pointsAwarded: null },
    })
  }

  revalidatePath(`/pools/${poolId}/bonus`)
  return { success: true, errors }
}

// ─── Kampioen kiezen ─────────────────────────────────────────────────────────

export async function saveChampionPick(formData: FormData) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const poolId = formData.get("poolId") as string
  const teamId = formData.get("teamId") as string

  if (new Date() > TOURNAMENT_START) return { error: "De termijn voor de kampioensvooerspelling is verstreken" }

  await prisma.championPick.upsert({
    where: { userId_poolId: { userId: session.user.id, poolId } },
    create: { userId: session.user.id, poolId, teamId },
    update: { teamId, pointsAwarded: null },
  })

  revalidatePath(`/pools/${poolId}/champion`)
  return { success: true }
}

// ─── Admin: bonus antwoord instellen ─────────────────────────────────────────

export async function setCorrectBonusAnswer(formData: FormData) {
  const session = await auth()
  if (!session?.user?.isAdmin) return { error: "Geen toegang" }

  const questionId = formData.get("questionId") as string
  const correctAnswer = (formData.get("correctAnswer") as string)?.trim()

  await prisma.bonusQuestion.update({
    where: { id: questionId },
    data: { correctAnswer },
  })

  await recalcBonusQuestion(questionId)
  revalidatePath("/admin")
  return { success: true }
}

export async function addBonusQuestion(formData: FormData) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const poolId = formData.get("poolId") as string
  const membership = await prisma.poolMembership.findUnique({
    where: { userId_poolId: { userId: session.user.id, poolId } },
  })
  if (!membership || membership.role !== "ADMIN") return { error: "Geen toegang" }

  const type = formData.get("type") as BonusQuestionType
  const question = (formData.get("question") as string)?.trim()
  const description = (formData.get("description") as string)?.trim() || undefined

  if (!question) return { error: "Vul een vraag in" }

  const last = await prisma.bonusQuestion.findFirst({
    where: { poolId },
    orderBy: { orderIndex: "desc" },
  })

  await prisma.bonusQuestion.create({
    data: {
      poolId,
      type,
      question,
      description,
      orderIndex: (last?.orderIndex ?? 0) + 1,
      deadline: TOURNAMENT_START,
    },
  })

  revalidatePath(`/admin/pools/${poolId}/bonus`)
  return { success: true }
}

// ─── Admin: sync wedstrijden ──────────────────────────────────────────────────

export async function syncMatches() {
  const session = await auth()
  if (!session?.user?.isAdmin) return { error: "Geen toegang" }

  const { fetchMatches, fetchTeams, mapStage, mapStatus } = await import("./football-data")

  // Sync teams
  const { getDutchName } = await import("./dutch-names")
  const teams = await fetchTeams()
  for (const t of teams) {
    const nameNl = getDutchName(t.name) !== t.name ? getDutchName(t.name) : (getDutchName(t.shortName) !== t.shortName ? getDutchName(t.shortName) : t.shortName ?? t.name)
    await prisma.team.upsert({
      where: { externalId: t.id },
      create: { name: t.name, nameNl, code: t.tla, flagUrl: t.crest, externalId: t.id },
      update: { name: t.name, nameNl, code: t.tla, flagUrl: t.crest },
    })
  }

  // Sync matches
  const matches = await fetchMatches()
  let synced = 0
  let updated = 0

  for (const m of matches) {
    const stage = mapStage(m.stage) as MatchStage
    const status = mapStatus(m.status) as MatchStatus

    const homeTeam = m.homeTeam?.id
      ? await prisma.team.findUnique({ where: { externalId: m.homeTeam.id } })
      : null
    const awayTeam = m.awayTeam?.id
      ? await prisma.team.findUnique({ where: { externalId: m.awayTeam.id } })
      : null

    const existing = await prisma.match.findUnique({ where: { externalId: m.id } })
    const wasFinished = existing?.status === "FINISHED"
    const nowFinished = status === "FINISHED"

    await prisma.match.upsert({
      where: { externalId: m.id },
      create: {
        externalId: m.id,
        stage,
        groupName: m.group,
        matchday: m.matchday,
        homeTeamId: homeTeam?.id ?? null,
        awayTeamId: awayTeam?.id ?? null,
        homeScore: m.score.fullTime.home,
        awayScore: m.score.fullTime.away,
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
        homeScore: m.score.fullTime.home,
        awayScore: m.score.fullTime.away,
        status,
        kickoff: new Date(m.utcDate),
        venue: m.venue,
        lastSyncedAt: new Date(),
      },
    })

    if (!wasFinished && nowFinished) {
      await recalcMatch(m.id)
      updated++
    }
    synced++
  }

  await rebuildLeaderboards()
  revalidatePath("/admin")

  return { success: true, synced, updated }
}

// ─── Puntentelling ───────────────────────────────────────────────────────────

async function recalcMatch(externalId: number) {
  const match = await prisma.match.findUnique({
    where: { externalId },
    include: { predictions: true },
  })
  if (!match || match.homeScore === null || match.awayScore === null) return

  for (const pred of match.predictions) {
    let pts: number
    if (match.stage === "GROUP") {
      pts = scoreGroupMatch(
        { homeScore: pred.homeScore, awayScore: pred.awayScore },
        { homeScore: match.homeScore, awayScore: match.awayScore }
      )
    } else {
      // For knockout we treat both teams as "correct position" since we don't
      // track bracket positions separately — position points awarded by presence
      pts = scoreKnockoutMatch(
        { homeScore: pred.homeScore, awayScore: pred.awayScore },
        { homeScore: match.homeScore, awayScore: match.awayScore },
        match.stage,
        true,
        true
      )
    }

    await prisma.prediction.update({
      where: { id: pred.id },
      data: { pointsAwarded: pts },
    })
  }
}

async function recalcBonusQuestion(questionId: string) {
  const question = await prisma.bonusQuestion.findUnique({
    where: { id: questionId },
    include: { answers: true },
  })
  if (!question || !question.correctAnswer) return

  if (question.type === "OPEN") {
    for (const ans of question.answers) {
      const correct =
        ans.answer.toLowerCase().trim() === question.correctAnswer.toLowerCase().trim()
      await prisma.bonusAnswer.update({
        where: { id: ans.id },
        data: { pointsAwarded: correct ? BONUS_POINTS : 0 },
      })
    }
  } else if (question.type === "STATEMENT") {
    for (const ans of question.answers) {
      const correct =
        ans.answer.toLowerCase() === question.correctAnswer.toLowerCase()
      await prisma.bonusAnswer.update({
        where: { id: ans.id },
        data: { pointsAwarded: correct ? BONUS_POINTS : 0 },
      })
    }
  } else if (question.type === "ESTIMATION") {
    const correct = parseInt(question.correctAnswer, 10)
    if (isNaN(correct)) return

    const scored = scoreEstimationQuestion(
      question.answers
        .filter((a) => !isNaN(parseInt(a.answer, 10)))
        .map((a) => ({ userId: a.userId, answer: parseInt(a.answer, 10) })),
      correct
    )

    for (const ans of question.answers) {
      await prisma.bonusAnswer.update({
        where: { id: ans.id },
        data: { pointsAwarded: scored.get(ans.userId) ?? 0 },
      })
    }
  }
}

export async function recalcAllScores() {
  const session = await auth()
  if (!session?.user?.isAdmin) return { error: "Geen toegang" }

  const finishedMatches = await prisma.match.findMany({
    where: { status: "FINISHED" },
  })
  for (const m of finishedMatches) {
    await recalcMatch(m.externalId)
  }

  const questions = await prisma.bonusQuestion.findMany({
    where: { correctAnswer: { not: null } },
  })
  for (const q of questions) {
    await recalcBonusQuestion(q.id)
  }

  // Champion picks
  const finalMatch = await prisma.match.findFirst({ where: { stage: "FINAL", status: "FINISHED" } })
  if (finalMatch && finalMatch.homeScore !== null && finalMatch.awayScore !== null) {
    const winnerId =
      finalMatch.homeScore > finalMatch.awayScore
        ? finalMatch.homeTeamId
        : finalMatch.awayScore > finalMatch.homeScore
        ? finalMatch.awayTeamId
        : null

    if (winnerId) {
      const picks = await prisma.championPick.findMany()
      for (const pick of picks) {
        await prisma.championPick.update({
          where: { id: pick.id },
          data: { pointsAwarded: pick.teamId === winnerId ? CHAMPION_POINTS : 0 },
        })
      }
    }
  }

  await rebuildLeaderboards()
  revalidatePath("/admin")
  return { success: true }
}

async function rebuildLeaderboards() {
  const pools = await prisma.pool.findMany({ include: { memberships: true } })

  for (const pool of pools) {
    for (const member of pool.memberships) {
      const uid = member.userId

      // Match points
      const predictions = await prisma.prediction.findMany({
        where: { userId: uid, pointsAwarded: { not: null } },
      })
      const matchPts = predictions.reduce((s, p) => s + (p.pointsAwarded ?? 0), 0)

      // Bonus points for this pool
      const bonusQuestionIds = await prisma.bonusQuestion
        .findMany({ where: { poolId: pool.id }, select: { id: true } })
        .then((qs) => qs.map((q) => q.id))

      const bonusAnswers = await prisma.bonusAnswer.findMany({
        where: { userId: uid, questionId: { in: bonusQuestionIds }, pointsAwarded: { not: null } },
      })
      const bonusPts = bonusAnswers.reduce((s, a) => s + (a.pointsAwarded ?? 0), 0)

      // Champion points
      const championPick = await prisma.championPick.findUnique({
        where: { userId_poolId: { userId: uid, poolId: pool.id } },
      })
      const champPts = championPick?.pointsAwarded ?? 0

      await prisma.leaderboardEntry.upsert({
        where: { userId_poolId: { userId: uid, poolId: pool.id } },
        create: {
          userId: uid,
          poolId: pool.id,
          matchPoints: matchPts,
          bonusPoints: bonusPts,
          championPoints: champPts,
          totalPoints: matchPts + bonusPts + champPts,
          lastCalculatedAt: new Date(),
        },
        update: {
          matchPoints: matchPts,
          bonusPoints: bonusPts,
          championPoints: champPts,
          totalPoints: matchPts + bonusPts + champPts,
          lastCalculatedAt: new Date(),
        },
      })
    }
  }
}
