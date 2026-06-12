"use server"

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import bcrypt from "bcryptjs"
import { nanoid } from "nanoid"
import { auth, signIn, signOut } from "./auth"
import { prisma } from "./prisma"
import { DEFAULT_BONUS_QUESTIONS } from "./default-bonus-questions"
import { scoreGroupMatch, scoreKnockoutMatch, scoreEstimationQuestion, CHAMPION_POINTS, BONUS_POINTS } from "./scoring"
import { JOKER_QUOTA, jokersAllowedInStage, STAGE_LABELS_NL } from "./jokers"
import { ACHIEVEMENT_DEFS } from "./achievements"
import { MatchStage, MatchStatus, BonusQuestionType, PlayerPosition } from "@prisma/client"
import { matchToSurvivorRound, getFirstMatchOfRound, getRoundDeadline, getTeamIdsInRound, type SurvivorRound } from "./survivor"
import { runMatchReminderEmails } from "./reminders"
import {
  FANTASY_DEADLINE,
  SQUAD_SIZE,
  MAX_TRANSFERS_PER_ROUND,
  TRANSFER_ROUNDS,
  validateSquad,
  calculateFantasyPoints,
  type FantasyRound,
} from "./fantasy"

// Toernooi start — deadline voor bonus vragen en kampioen pick
const TOURNAMENT_START = new Date("2026-06-12T21:59:00Z")

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

// ─── Pool verwijderen ────────────────────────────────────────────────────────

export async function requestDeletePool(poolId: string) {
  const session = await auth()
  if (!session?.user) return { error: "Niet ingelogd" }

  const membership = await prisma.poolMembership.findUnique({
    where: { userId_poolId: { userId: session.user.id, poolId } },
  })
  if (!membership || membership.role !== "ADMIN") return { error: "Geen toegang" }

  // Markeer pool als "verwijdering aangevraagd" via description prefix
  await prisma.pool.update({
    where: { id: poolId },
    data: { description: `[VERWIJDERING AANGEVRAAGD] ${(await prisma.pool.findUnique({ where: { id: poolId }, select: { description: true } }))?.description ?? ""}`.trim() },
  })
  revalidatePath("/admin")
  return { success: true }
}

export async function hardDeletePool(poolId: string) {
  const session = await auth()
  if (!session?.user?.isAdmin) return { error: "Geen toegang" }

  await prisma.pool.delete({ where: { id: poolId } })
  revalidatePath("/admin")
  revalidatePath("/dashboard")
  return { success: true }
}

// ─── Ledenbeheer (pool-admin) ─────────────────────────────────────────────────

async function requirePoolAdmin(sessionUserId: string, poolId: string) {
  const membership = await prisma.poolMembership.findUnique({
    where: { userId_poolId: { userId: sessionUserId, poolId } },
  })
  if (!membership || membership.role !== "ADMIN") return null
  return membership
}

export async function promoteToAdmin(poolId: string, targetUserId: string) {
  const session = await auth()
  if (!session?.user) return { error: "Niet ingelogd" }
  if (targetUserId === session.user.id) return { error: "Je kunt je eigen rol niet wijzigen" }

  const caller = await requirePoolAdmin(session.user.id, poolId)
  if (!caller && !session.user.isAdmin) return { error: "Geen toegang" }

  await prisma.poolMembership.update({
    where: { userId_poolId: { userId: targetUserId, poolId } },
    data: { role: "ADMIN" },
  })
  revalidatePath(`/admin/pools/${poolId}/bonus`)
  revalidatePath(`/pools/${poolId}`)
  return { success: true }
}

export async function demoteToMember(poolId: string, targetUserId: string) {
  const session = await auth()
  if (!session?.user) return { error: "Niet ingelogd" }
  if (targetUserId === session.user.id) return { error: "Je kunt je eigen rol niet wijzigen" }

  const caller = await requirePoolAdmin(session.user.id, poolId)
  if (!caller && !session.user.isAdmin) return { error: "Geen toegang" }

  // Zorg dat er altijd minstens één admin overblijft
  const adminCount = await prisma.poolMembership.count({ where: { poolId, role: "ADMIN" } })
  if (adminCount <= 1) return { error: "Er moet minimaal één beheerder zijn" }

  await prisma.poolMembership.update({
    where: { userId_poolId: { userId: targetUserId, poolId } },
    data: { role: "MEMBER" },
  })
  revalidatePath(`/admin/pools/${poolId}/bonus`)
  revalidatePath(`/pools/${poolId}`)
  return { success: true }
}

export async function removeMember(poolId: string, targetUserId: string) {
  const session = await auth()
  if (!session?.user) return { error: "Niet ingelogd" }
  if (targetUserId === session.user.id) return { error: "Je kunt jezelf niet verwijderen uit de pool" }

  const caller = await requirePoolAdmin(session.user.id, poolId)
  if (!caller && !session.user.isAdmin) return { error: "Geen toegang" }

  await prisma.poolMembership.delete({
    where: { userId_poolId: { userId: targetUserId, poolId } },
  })
  revalidatePath(`/admin/pools/${poolId}/bonus`)
  revalidatePath(`/pools/${poolId}`)
  return { success: true }
}

// ─── Voorspellingen ──────────────────────────────────────────────────────────

export async function savePrediction(formData: FormData) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const matchId = formData.get("matchId") as string
  const poolId = formData.get("poolId") as string
  const homeScore = parseInt(formData.get("homeScore") as string, 10)
  const awayScore = parseInt(formData.get("awayScore") as string, 10)

  if (!poolId) return { error: "Pool niet opgegeven" }
  if (isNaN(homeScore) || isNaN(awayScore) || homeScore < 0 || awayScore < 0) {
    return { error: "Ongeldige score" }
  }

  // Verify user is in this pool
  const membership = await prisma.poolMembership.findUnique({
    where: { userId_poolId: { userId: session.user.id, poolId } },
  })
  if (!membership) return { error: "Je bent geen lid van deze pool" }

  const match = await prisma.match.findUnique({ where: { id: matchId } })
  if (!match) return { error: "Wedstrijd niet gevonden" }

  const deadline = new Date(match.kickoff.getTime() - 30 * 60 * 1000)
  if (new Date() > deadline) return { error: "De voorspeltermijn is verstreken" }

  try {
    await prisma.prediction.upsert({
      where: { userId_matchId_poolId: { userId: session.user.id, matchId, poolId } },
      create: { userId: session.user.id, matchId, poolId, homeScore, awayScore },
      update: { homeScore, awayScore, pointsAwarded: null },
    })
  } catch (err) {
    console.error("[savePrediction] opslaan mislukt:", err)
    return { error: "Opslaan lukte niet door een technisch probleem. Neem contact op met Douwe (de beheerder)." }
  }

  revalidatePath(`/pools/${poolId}/predictions`)
  return { success: true }
}

// ─── Lucky Shot (joker) ──────────────────────────────────────────────────────

export async function toggleJoker(formData: FormData) {
  const session = await auth()
  if (!session?.user) return { error: "Niet ingelogd" }

  const matchId = formData.get("matchId") as string
  const poolId = formData.get("poolId") as string
  if (!poolId) return { error: "Pool niet opgegeven" }

  const match = await prisma.match.findUnique({ where: { id: matchId } })
  if (!match) return { error: "Wedstrijd niet gevonden" }

  const deadline = new Date(match.kickoff.getTime() - 30 * 60 * 1000)
  if (new Date() > deadline) return { error: "Termijn verstreken" }

  if (!jokersAllowedInStage(match.stage)) {
    return { error: `Joker niet toegestaan in ${STAGE_LABELS_NL[match.stage]}` }
  }

  const existing = await prisma.prediction.findUnique({
    where: { userId_matchId_poolId: { userId: session.user.id, matchId, poolId } },
  })
  if (!existing) return { error: "Eerst een voorspelling invullen" }

  // Toggle: als aanzetten, check quota per pool
  if (!existing.isJoker) {
    const usedInStage = await prisma.prediction.count({
      where: {
        userId: session.user.id,
        poolId,
        isJoker: true,
        match: { stage: match.stage },
      },
    })
    if (usedInStage >= JOKER_QUOTA[match.stage]) {
      return { error: `Geen jokers meer in ${STAGE_LABELS_NL[match.stage]} (max ${JOKER_QUOTA[match.stage]})` }
    }
  }

  await prisma.prediction.update({
    where: { id: existing.id },
    data: { isJoker: !existing.isJoker, pointsAwarded: null },
  })

  revalidatePath(`/pools/${poolId}/predictions`)
  return { success: true, isJoker: !existing.isJoker }
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

  // Verify user is a member of the pool this question belongs to
  const membership = await prisma.poolMembership.findUnique({
    where: { userId_poolId: { userId: session.user.id, poolId: question.poolId } },
  })
  if (!membership) return { error: "Je bent geen lid van deze pool" }

  const deadline = question.deadline ?? TOURNAMENT_START
  if (new Date() > deadline) return { error: "De antwoordtermijn is verstreken" }

  await prisma.bonusAnswer.upsert({
    where: { userId_questionId: { userId: session.user.id, questionId } },
    create: { userId: session.user.id, questionId, answer },
    update: { answer, pointsAwarded: null },
  })

  revalidatePath(`/pools/${question.poolId}/bonus`)
  return { success: true }
}

export async function saveAllBonusAnswers(formData: FormData) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const poolId = formData.get("poolId") as string

  // Verify user is a member of this pool
  const membership = await prisma.poolMembership.findUnique({
    where: { userId_poolId: { userId: session.user.id, poolId } },
  })
  if (!membership) return { error: "Je bent geen lid van deze pool" }

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

  // Verify user is a member of this pool
  const membership = await prisma.poolMembership.findUnique({
    where: { userId_poolId: { userId: session.user.id, poolId } },
  })
  if (!membership) return { error: "Je bent geen lid van deze pool" }

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
  if (!session?.user) return { error: "Niet ingelogd" }

  const questionId = formData.get("questionId") as string
  const correctAnswer = (formData.get("correctAnswer") as string)?.trim()

  // Haal de vraag op om de poolId te weten
  const question = await prisma.bonusQuestion.findUnique({
    where: { id: questionId },
    select: { poolId: true },
  })
  if (!question) return { error: "Vraag niet gevonden" }

  // Globale admin mag altijd; pool-admin mag voor zijn eigen pool
  const isGlobalAdmin = session.user.isAdmin
  if (!isGlobalAdmin) {
    const membership = await prisma.poolMembership.findUnique({
      where: { userId_poolId: { userId: session.user.id, poolId: question.poolId } },
    })
    if (!membership || membership.role !== "ADMIN") return { error: "Geen toegang" }
  }

  await prisma.bonusQuestion.update({
    where: { id: questionId },
    data: { correctAnswer },
  })

  await recalcBonusQuestion(questionId)
  revalidatePath(`/admin/pools/${question.poolId}/bonus`)
  revalidatePath(`/pools/${question.poolId}/bonus`)
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
  const optionsRaw = (formData.get("options") as string)?.trim() || undefined
  // Normalize: split on newlines or commas, trim each entry, filter blanks
  const options = optionsRaw
    ? optionsRaw.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean).join("\n") || undefined
    : undefined

  if (!question) return { error: "Vul een vraag in" }

  const last = await prisma.bonusQuestion.findFirst({
    where: { poolId },
    orderBy: { orderIndex: "desc" },
  })

  const category = (formData.get("category") as string)?.trim() || "Eigen vragen"

  await prisma.bonusQuestion.create({
    data: {
      poolId,
      type,
      question,
      description,
      options,
      category,
      orderIndex: (last?.orderIndex ?? 0) + 1,
      deadline: TOURNAMENT_START,
    },
  })

  revalidatePath(`/admin/pools/${poolId}/bonus`)
  revalidatePath(`/pools/${poolId}/bonus`)
  return { success: true }
}



// ─── Admin: bonusvraag verwijderen (tot toernooideadline) ────────────────────

// Toernooideadline: 11 juni 2026, 22:00 CEST = 20:00 UTC
const BONUS_EDIT_DEADLINE = new Date("2026-06-12T21:59:00Z")

export async function deleteBonusQuestion(questionId: string, poolId: string) {
  const session = await auth()
  if (!session?.user) return { error: "Niet ingelogd" }

  if (new Date() > BONUS_EDIT_DEADLINE) {
    return { error: "Het toernooi is gestart — vragen kunnen niet meer worden verwijderd" }
  }

  const membership = await prisma.poolMembership.findUnique({
    where: { userId_poolId: { userId: session.user.id, poolId } },
  })
  if (!membership || (membership.role !== "ADMIN" && !session.user.isAdmin)) {
    return { error: "Geen toegang" }
  }

  // Controleer dat de vraag bij deze pool hoort
  const question = await prisma.bonusQuestion.findUnique({
    where: { id: questionId },
    select: { poolId: true, _count: { select: { answers: true } } },
  })
  if (!question || question.poolId !== poolId) return { error: "Vraag niet gevonden" }

  // Verwijder vraag + antwoorden (cascade)
  await prisma.bonusQuestion.delete({ where: { id: questionId } })

  revalidatePath(`/admin/pools/${poolId}/bonus`)
  revalidatePath(`/pools/${poolId}/bonus`)
  return { success: true, hadAnswers: question._count.answers > 0 }
}

// ─── Admin: vragen uit bibliotheek toevoegen ─────────────────────────────────

export async function addQuestionsFromLibrary(
  poolId: string,
  questions: Array<{
    type: BonusQuestionType
    category: string
    question: string
    description?: string
    options?: string
    orderIndex: number
  }>
) {
  "use server"
  const session = await auth()
  if (!session?.user) return { error: "Niet ingelogd" }

  const membership = await prisma.poolMembership.findUnique({
    where: { userId_poolId: { userId: session.user.id, poolId } },
  })
  if (!membership || membership.role !== "ADMIN") return { error: "Geen toegang" }

  if (questions.length === 0) return { success: true }

  const last = await prisma.bonusQuestion.findFirst({
    where: { poolId },
    orderBy: { orderIndex: "desc" },
  })
  let nextIndex = (last?.orderIndex ?? 0) + 1

  await prisma.bonusQuestion.createMany({
    data: questions.map((q, i) => ({
      poolId,
      type: q.type,
      category: q.category,
      question: q.question,
      description: q.description,
      options: q.options,
      orderIndex: nextIndex + i,
      deadline: TOURNAMENT_START,
    })),
  })

  revalidatePath(`/admin/pools/${poolId}/bonus`)
  revalidatePath(`/pools/${poolId}/bonus`)
  return { success: true }
}

// ─── Admin: pool-instellingen ────────────────────────────────────────────────

export async function updatePoolDescription(formData: FormData) {
  const session = await auth()
  if (!session?.user) return { error: "Niet ingelogd" }

  const poolId = formData.get("poolId") as string
  const description = (formData.get("description") as string)?.trim() || null

  const membership = await prisma.poolMembership.findUnique({
    where: { userId_poolId: { userId: session.user.id, poolId } },
  })
  if (!membership || membership.role !== "ADMIN") return { error: "Geen toegang" }

  await prisma.pool.update({ where: { id: poolId }, data: { description } })
  revalidatePath(`/pools/${poolId}`)
  revalidatePath(`/admin/pools/${poolId}/bonus`)
  return { success: true }
}

// ─── Admin: sync wedstrijden ──────────────────────────────────────────────────

type SyncResult = { ok: boolean; error?: string; synced: number; updated: number }

export async function syncMatches(): Promise<SyncResult> {
  const session = await auth()
  if (!session?.user?.isAdmin) return { ok: false, error: "Geen toegang", synced: 0, updated: 0 }
  return runMatchSync()
}

// Beveiligde ingang voor de geautomatiseerde cron-job (zonder sessie).
// Vereist het CRON_SECRET; zonder geldig secret nooit uit te voeren.
export async function syncMatchesViaCron(secret: string): Promise<SyncResult> {
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return { ok: false, error: "Unauthorized", synced: 0, updated: 0 }
  }
  return runMatchSync()
}

// Kernlogica van de synchronisatie. Privé (dus géén server action) en
// gedeeld door zowel de admin-knop als de cron-job.
async function runMatchSync(): Promise<SyncResult> {
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
        winner: m.score.winner ?? null,
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
        winner: m.score.winner ?? null,
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

  // Matchday recap: voor elke dag waarop wedstrijden vandaag zijn afgerond
  if (updated > 0) {
    const now = new Date()
    const todayStart = new Date(now)
    todayStart.setHours(0, 0, 0, 0)
    const todayEnd = new Date(todayStart)
    todayEnd.setDate(todayEnd.getDate() + 1)

    const finishedToday = await prisma.match.findMany({
      where: { status: "FINISHED", kickoff: { gte: todayStart, lt: todayEnd } },
      select: { kickoff: true },
    })
    const uniqueDaysToday = new Set(finishedToday.map((m) => m.kickoff.toISOString().slice(0, 10)))
    for (const day of uniqueDaysToday) {
      await postMatchdayRecap(new Date(day + "T12:00:00Z"))
    }
  }
  // Push-notificaties: herinneringen voor wedstrijden die binnen ~90 min beginnen
  await sendMatchReminders()

  // E-mail reminders (digest, ~2 uur voor aftrap). Door dit hier mee te nemen
  // volstaat één cron-job (/api/cron/sync) voor zowel sync als reminders.
  // Idempotent via reminderEmailSentAt, dus veilig bij elke run.
  try {
    await runMatchReminderEmails()
  } catch (err) {
    console.error("[sync] e-mailreminders fout:", err)
  }

  revalidatePath("/admin")

  return { ok: true, synced, updated }
}

// ─── Selectie-sync (WK Manager spelers) ───────────────────────────────────────

// football-data posities → onze PlayerPosition
function mapFdPosition(pos: string | null): PlayerPosition {
  const p = (pos ?? "").toLowerCase()
  if (p.includes("keeper")) return "GK"
  if (p.includes("back") || p.includes("defence") || p.includes("defender")) return "DEF"
  if (p.includes("midfield")) return "MID"
  if (
    p.includes("forward") || p.includes("offence") || p.includes("offensive") ||
    p.includes("winger") || p.includes("striker") || p.includes("attack")
  ) return "FWD"
  return "MID" // veilige fallback
}

export type SquadSyncResult = {
  ok: boolean
  error?: string
  processedTeams: number // landen verwerkt in deze batch
  totalTeams: number // totaal aantal landen met externalId
  syncedTeams: number // landen waarvan de selectie al opgehaald is
  playersUpserted: number
  finished: boolean
}

// Batchgewijze sync van selecties. Verwerkt per aanroep maximaal BATCH landen
// (i.v.m. de football-data rate limit van 10 calls/min). De client roept dit
// herhaaldelijk aan met ~60s pauze tot finished=true.
const SQUAD_BATCH = 8

export async function syncSquads(reset = false): Promise<SquadSyncResult> {
  const session = await auth()
  if (!session?.user?.isAdmin) {
    return { ok: false, error: "Geen toegang", processedTeams: 0, totalTeams: 0, syncedTeams: 0, playersUpserted: 0, finished: false }
  }

  // Opnieuw beginnen: alle squadSyncedAt wissen zodat alles ververst wordt
  if (reset) {
    await prisma.team.updateMany({ data: { squadSyncedAt: null } })
  }

  const { fetchTeamSquad } = await import("./football-data")

  const totalTeams = await prisma.team.count({ where: { externalId: { not: null } } })
  const teams = await prisma.team.findMany({
    where: { externalId: { not: null }, squadSyncedAt: null },
    orderBy: { nameNl: "asc" },
    take: SQUAD_BATCH,
  })

  if (teams.length === 0) {
    return { ok: true, processedTeams: 0, totalTeams, syncedTeams: totalTeams, playersUpserted: 0, finished: true }
  }

  let processed = 0
  let upserted = 0

  for (const team of teams) {
    let squad
    try {
      squad = await fetchTeamSquad(team.externalId!)
    } catch (e) {
      const msg = String((e as Error).message ?? e)
      // Rate limit → stop deze batch, client probeert het zo opnieuw
      if (msg.includes("Rate limit") || msg.includes("429")) break
      // Abonnement geeft squad-data niet vrij → meld duidelijk en stop
      if (msg.includes("403") || msg.toLowerCase().includes("restricted") || msg.toLowerCase().includes("forbidden")) {
        const syncedNow = await prisma.team.count({ where: { squadSyncedAt: { not: null } } })
        return {
          ok: false,
          error: "Squad-data niet beschikbaar op dit football-data abonnement (403). Upgrade nodig of een andere bron gebruiken.",
          processedTeams: processed, totalTeams, syncedTeams: syncedNow, playersUpserted: upserted, finished: false,
        }
      }
      // Andere fout: dit land overslaan (niet markeren → volgende keer opnieuw)
      console.error(`[syncSquads] ${team.code}: ${msg}`)
      continue
    }

    const seenExternalIds: number[] = []
    for (const pl of squad) {
      if (!pl.id || !pl.name) continue
      seenExternalIds.push(pl.id)
      await prisma.player.upsert({
        where: { externalId: pl.id },
        create: {
          externalId: pl.id,
          name: pl.name,
          teamId: team.id,
          position: mapFdPosition(pl.position),
          shirtNumber: pl.shirtNumber ?? null,
          isActive: true,
        },
        update: {
          name: pl.name,
          teamId: team.id,
          position: mapFdPosition(pl.position),
          shirtNumber: pl.shirtNumber ?? null,
          isActive: true,
        },
      })
      upserted++
    }

    // Alleen opschonen als er daadwerkelijk een selectie binnenkwam: zet oude
    // spelers (incl. de handmatige seed met externalId=null) en vertrokken
    // spelers op inactief.
    if (seenExternalIds.length > 0) {
      await prisma.player.updateMany({
        where: {
          teamId: team.id,
          isActive: true,
          OR: [{ externalId: null }, { externalId: { notIn: seenExternalIds } }],
        },
        data: { isActive: false },
      })
    }

    // Markeer als gesynct (ook bij lege selectie, zodat we doorgaan; later
    // opnieuw te verversen via reset)
    await prisma.team.update({ where: { id: team.id }, data: { squadSyncedAt: new Date() } })
    processed++
  }

  const syncedTeams = await prisma.team.count({ where: { squadSyncedAt: { not: null } } })
  revalidatePath("/admin")
  revalidatePath("/fantasy/select")
  return { ok: true, processedTeams: processed, totalTeams, syncedTeams, playersUpserted: upserted, finished: syncedTeams >= totalTeams }
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
      pts = scoreKnockoutMatch(
        { homeScore: pred.homeScore, awayScore: pred.awayScore },
        { homeScore: match.homeScore, awayScore: match.awayScore }
      )
    }

    // Joker: punten verdubbelen
    if (pred.isJoker) pts *= 2

    await prisma.prediction.update({
      where: { id: pred.id },
      data: { pointsAwarded: pts },
    })
  }

  // WK Survivor scoring
  await scoreSurvivorPicksForMatch(match)
}

async function scoreSurvivorPicksForMatch(match: {
  homeTeamId: string | null
  awayTeamId: string | null
  homeScore: number | null
  awayScore: number | null
  winner: string | null
  stage: string
  matchday: number | null
}) {
  const round = matchToSurvivorRound({ stage: match.stage, matchday: match.matchday })
  if (!round) return
  if (match.homeScore === null || match.awayScore === null) return
  if (!match.homeTeamId || !match.awayTeamId) return

  const picks = await prisma.survivorPick.findMany({
    where: {
      round,
      teamId: { in: [match.homeTeamId, match.awayTeamId] },
      result: "PENDING",
    },
    include: { entry: true },
  })

  for (const pick of picks) {
    const isHome = pick.teamId === match.homeTeamId
    const teamGoals = isHome ? match.homeScore! : match.awayScore!
    const oppGoals = isHome ? match.awayScore! : match.homeScore!
    const goalDiff = teamGoals - oppGoals

    // Groepsfase: je moet WINNEN. Knock-out: de doorgaande ploeg overleeft —
    // ook na strafschoppen. We gebruiken match.winner (incl. penalty's) en
    // vallen alleen terug op het doelsaldo als de winnaar (nog) onbekend is.
    let result: "SURVIVED" | "ELIMINATED"
    if (match.stage === "GROUP") {
      result = goalDiff > 0 ? "SURVIVED" : "ELIMINATED"
    } else if (match.winner === "HOME_TEAM" || match.winner === "AWAY_TEAM") {
      const teamWon = match.winner === (isHome ? "HOME_TEAM" : "AWAY_TEAM")
      result = teamWon ? "SURVIVED" : "ELIMINATED"
    } else {
      // Winnaar onbekend → gelijkspel telt (voorlopig) als overleefd
      result = goalDiff >= 0 ? "SURVIVED" : "ELIMINATED"
    }

    await prisma.survivorPick.update({
      where: { id: pick.id },
      data: { result, goalDiff },
    })

    // HARDCORE elimination
    if (pick.mode === "HARDCORE" && result === "ELIMINATED" && pick.entry.hardcoreAlive) {
      await prisma.survivorEntry.update({
        where: { id: pick.entryId },
        data: { hardcoreAlive: false, hardcoreElimRound: round },
      })
    }
  }

  // Rebuild highscore totals for all affected entries
  const entryIds = [...new Set(picks.map((p) => p.entryId))]
  for (const entryId of entryIds) {
    const hsPicks = await prisma.survivorPick.findMany({
      where: { entryId, mode: "HIGHSCORE", goalDiff: { not: null } },
    })
    const total = hsPicks.reduce((s, p) => s + (p.goalDiff ?? 0), 0)
    await prisma.survivorEntry.update({
      where: { id: entryId },
      data: { highscoreTotal: total },
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

  // Champion picks — gebruik match.winner zodat een finale op strafschoppen
  // (gelijkspel na verlenging) ook een kampioen oplevert.
  const finalMatch = await prisma.match.findFirst({ where: { stage: "FINAL", status: "FINISHED" } })
  if (finalMatch && finalMatch.homeScore !== null && finalMatch.awayScore !== null) {
    const winnerId =
      finalMatch.winner === "HOME_TEAM"
        ? finalMatch.homeTeamId
        : finalMatch.winner === "AWAY_TEAM"
        ? finalMatch.awayTeamId
        : finalMatch.homeScore > finalMatch.awayScore
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

// ─── Achievements & auto prikbord-meldingen ──────────────────────────────────

async function postSystemMessage(poolId: string, content: string, kind: string) {
  await prisma.poolMessage.create({
    data: { poolId, userId: null, content, isSystem: true, kind },
  })
  revalidatePath(`/pools/${poolId}/prikbord`)
}

async function awardAchievement(userId: string, poolId: string, type: string, detail?: string, matchId?: string) {
  const def = ACHIEVEMENT_DEFS[type]
  if (!def) return
  try {
    await prisma.achievement.create({
      data: { userId, poolId, type, detail, matchId },
    })
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } })
    await postSystemMessage(
      poolId,
      `${def.emoji} ${user?.name ?? "Iemand"} verdiende een achievement: ${def.label} — ${def.description}${detail ? ` (${detail})` : ""}`,
      "ACHIEVEMENT"
    )
  } catch {
    // Already awarded — unique constraint
  }
}

async function detectAchievementsForPool(poolId: string) {
  const memberships = await prisma.poolMembership.findMany({ where: { poolId }, select: { userId: true } })
  const userIds = memberships.map((m) => m.userId)

  for (const userId of userIds) {
    const preds = await prisma.prediction.findMany({
      where: { userId, poolId, pointsAwarded: { not: null }, match: { status: "FINISHED" } },
      include: { match: { select: { homeScore: true, awayScore: true, kickoff: true } } },
      orderBy: { match: { kickoff: "asc" } },
    })

    // ORAKEL: 5+ exacte voorspellingen
    const exactCount = preds.filter(
      (p) => p.match.homeScore === p.homeScore && p.match.awayScore === p.awayScore
    ).length
    if (exactCount >= 5) await awardAchievement(userId, poolId, "ORAKEL", `${exactCount} exact correct`)

    // SNIPER: 3 exact op rij
    let streak = 0
    let bestStreak = 0
    for (const p of preds) {
      if (p.match.homeScore === p.homeScore && p.match.awayScore === p.awayScore) {
        streak++
        if (streak > bestStreak) bestStreak = streak
      } else {
        streak = 0
      }
    }
    if (bestStreak >= 3) await awardAchievement(userId, poolId, "SNIPER", `${bestStreak} op rij`)

    // GOKKER: een 0-0 exact voorspeld
    const zeroZero = preds.find(
      (p) => p.homeScore === 0 && p.awayScore === 0 && p.match.homeScore === 0 && p.match.awayScore === 0
    )
    if (zeroZero) await awardAchievement(userId, poolId, "GOKKER")

    // JOKER_HIT: een joker met punten (in deze pool)
    const jokerHit = await prisma.prediction.findFirst({
      where: { userId, poolId, isJoker: true, pointsAwarded: { gt: 0 } },
    })
    if (jokerHit) await awardAchievement(userId, poolId, "JOKER_HIT")
  }

  // COUNTERPICK: enige met deze kampioen
  const picks = await prisma.championPick.findMany({ where: { poolId } })
  const picksByTeam = new Map<string, string[]>()
  for (const pick of picks) {
    const list = picksByTeam.get(pick.teamId) ?? []
    list.push(pick.userId)
    picksByTeam.set(pick.teamId, list)
  }
  for (const [, userList] of picksByTeam) {
    if (userList.length === 1 && picks.length > 1) {
      await awardAchievement(userList[0], poolId, "COUNTERPICK")
    }
  }
}

async function detectLeaderTakeover(poolId: string, prevLeaderId: string | null, newLeaderId: string | null) {
  if (!newLeaderId || prevLeaderId === newLeaderId) return
  const newLeader = await prisma.user.findUnique({ where: { id: newLeaderId }, select: { name: true } })
  if (!newLeader) return

  if (prevLeaderId) {
    const prevLeader = await prisma.user.findUnique({ where: { id: prevLeaderId }, select: { name: true } })
    await postSystemMessage(
      poolId,
      `🚨 ${newLeader.name} heeft ${prevLeader?.name ?? "de leider"} van de troon gestoten en staat nu eerste!`,
      "LEADER_TAKEOVER"
    )
  } else {
    await postSystemMessage(poolId, `🥇 ${newLeader.name} pakt de eerste plaats!`, "LEADER_TAKEOVER")
  }
}

export async function postMatchdayRecap(date: Date) {
  const dayStart = new Date(date)
  dayStart.setHours(0, 0, 0, 0)
  const dayEnd = new Date(dayStart)
  dayEnd.setDate(dayEnd.getDate() + 1)

  const matches = await prisma.match.findMany({
    where: { status: "FINISHED", kickoff: { gte: dayStart, lt: dayEnd } },
    include: { homeTeam: true, awayTeam: true },
    orderBy: { kickoff: "asc" },
  })
  if (matches.length === 0) return

  const matchIds = matches.map((m) => m.id)
  const dayLabel = date.toLocaleDateString("nl-NL", { weekday: "long", day: "numeric", month: "long" })

  const matchLines = matches.map(
    (m) =>
      `${m.homeTeam?.nameNl ?? m.homeTeam?.name ?? "?"} ${m.homeScore}–${m.awayScore} ${m.awayTeam?.nameNl ?? m.awayTeam?.name ?? "?"}`
  )

  const pools = await prisma.pool.findMany({ include: { memberships: true } })

  for (const pool of pools) {
    // Per-pool duplicate check
    const existingRecap = await prisma.poolMessage.findFirst({
      where: { poolId: pool.id, kind: "MATCHDAY_RECAP", createdAt: { gte: dayStart, lt: dayEnd } },
    })
    if (existingRecap) continue

    const memberIds = pool.memberships.map((m) => m.userId)
    if (memberIds.length === 0) continue

    // Voorspellingen voor deze speeldag
    const dayPredictions = await prisma.prediction.findMany({
      where: {
        userId: { in: memberIds },
        poolId: pool.id,
        matchId: { in: matchIds },
        pointsAwarded: { not: null },
      },
      include: { match: { select: { homeScore: true, awayScore: true } } },
    })
    if (dayPredictions.length === 0) continue

    // Punten, exacte scores en joker-hits per speler
    const pointsByUser = new Map<string, number>()
    const exactByUser = new Map<string, number>()
    const jokerHitByUser = new Map<string, boolean>()

    for (const p of dayPredictions) {
      pointsByUser.set(p.userId, (pointsByUser.get(p.userId) ?? 0) + (p.pointsAwarded ?? 0))
      const isExact = p.homeScore === p.match.homeScore && p.awayScore === p.match.awayScore
      if (isExact) exactByUser.set(p.userId, (exactByUser.get(p.userId) ?? 0) + 1)
      if (p.isJoker && (p.pointsAwarded ?? 0) > 0) jokerHitByUser.set(p.userId, true)
    }
    if (pointsByUser.size === 0) continue

    const ranked = [...pointsByUser.entries()].sort((a, b) => b[1] - a[1])

    // Leaderboard voor ranglijst-verschuivingen
    const leaderboard = await prisma.leaderboardEntry.findMany({
      where: { poolId: pool.id },
      orderBy: { totalPoints: "desc" },
    })
    const prevLeaderboard = [...leaderboard]
      .filter((e) => e.previousTotalPoints !== null)
      .sort((a, b) => (b.previousTotalPoints ?? 0) - (a.previousTotalPoints ?? 0))
    const currentRankMap = new Map(leaderboard.map((e, i) => [e.userId, i + 1]))
    const prevRankMap = new Map(prevLeaderboard.map((e, i) => [e.userId, i + 1]))

    // Gebruikersnamen
    const users = await prisma.user.findMany({
      where: { id: { in: memberIds } },
      select: { id: true, name: true },
    })
    const nameMap = new Map(users.map((u) => [u.id, u.name]))

    // Bericht opbouwen
    const lines: string[] = []
    lines.push(`📊 SPEELDAGOVERZICHT — ${dayLabel.toUpperCase()}`)
    lines.push("")
    lines.push(`⚽ UITSLAGEN (${matches.length} ${matches.length === 1 ? "wedstrijd" : "wedstrijden"}):`)
    for (const l of matchLines) lines.push(`  ${l}`)

    // Punten vandaag
    lines.push("")
    lines.push("🏅 PUNTEN VANDAAG:")
    for (let i = 0; i < ranked.length; i++) {
      const [uid, pts] = ranked[i]
      const name = nameMap.get(uid) ?? "?"
      const exacts = exactByUser.get(uid) ?? 0
      const joker = jokerHitByUser.get(uid) ? " 🃏" : ""
      const exactStr = exacts > 0 ? ` (${exacts}× 🎯)` : ""
      const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`
      lines.push(`  ${medal} ${name}  +${pts} pts${exactStr}${joker}`)
    }

    // Ranglijst-verschuivingen
    const changes = leaderboard
      .map((e, i) => {
        const prevRank = prevRankMap.get(e.userId)
        const currRank = i + 1
        if (prevRank === undefined || prevRank === currRank) return null
        return { userId: e.userId, change: prevRank - currRank, currRank }
      })
      .filter((c): c is { userId: string; change: number; currRank: number } => c !== null)
      .sort((a, b) => Math.abs(b.change) - Math.abs(a.change))

    lines.push("")
    lines.push("📈 STAND NA VANDAAG:")
    if (changes.length > 0) {
      // Toon veranderingen (max 6) + stabiele top als aanvulling
      const shown = new Set<string>()
      for (const c of changes.slice(0, 6)) {
        const name = nameMap.get(c.userId) ?? "?"
        const totalPts = leaderboard.find((e) => e.userId === c.userId)?.totalPoints ?? 0
        const arrow = c.change > 0 ? `↑${c.change}` : `↓${Math.abs(c.change)}`
        lines.push(`  ${arrow} #${c.currRank} ${name}  ${totalPts} pts`)
        shown.add(c.userId)
      }
      // Vul aan met stabiele top-3 die nog niet getoond zijn
      for (const e of leaderboard.slice(0, 3)) {
        if (shown.has(e.userId)) continue
        const name = nameMap.get(e.userId) ?? "?"
        const rank = currentRankMap.get(e.userId) ?? 0
        lines.push(`  = #${rank} ${name}  ${e.totalPoints} pts`)
      }
    } else {
      // Geen veranderingen: toon gewoon de volledige stand
      for (const e of leaderboard) {
        const name = nameMap.get(e.userId) ?? "?"
        const rank = currentRankMap.get(e.userId) ?? 0
        const medal = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : `#${rank}`
        lines.push(`  ${medal} ${name}  ${e.totalPoints} pts`)
      }
    }

    await postSystemMessage(pool.id, lines.join("\n"), "MATCHDAY_RECAP")
  }
}

export async function triggerManualRecap() {
  const session = await auth()
  if (!session?.user?.isAdmin) return { error: "Geen toegang" }

  // Zoek alle datums in de afgelopen 14 dagen met FINISHED wedstrijden
  const since = new Date()
  since.setDate(since.getDate() - 14)

  const finishedMatches = await prisma.match.findMany({
    where: { status: "FINISHED", kickoff: { gte: since } },
    select: { kickoff: true },
    orderBy: { kickoff: "asc" },
  })

  const uniqueDays = [...new Set(finishedMatches.map((m) => m.kickoff.toISOString().slice(0, 10)))]
  for (const day of uniqueDays) {
    await postMatchdayRecap(new Date(day + "T12:00:00Z"))
  }

  revalidatePath("/admin")
  return { ok: true, days: uniqueDays.length }
}

async function rebuildLeaderboards() {
  const pools = await prisma.pool.findMany({ include: { memberships: true } })

  for (const pool of pools) {
    // Bewaar oude leider voordat we updaten
    const oldLeader = await prisma.leaderboardEntry.findFirst({
      where: { poolId: pool.id },
      orderBy: { totalPoints: "desc" },
      select: { userId: true, totalPoints: true },
    })
    const oldLeaderId = oldLeader && oldLeader.totalPoints > 0 ? oldLeader.userId : null

    for (const member of pool.memberships) {
      const uid = member.userId

      // Match points (pool-specifiek: telt alleen voorspellingen van deze pool)
      const predictions = await prisma.prediction.findMany({
        where: { userId: uid, poolId: pool.id, pointsAwarded: { not: null } },
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

      const newTotal = matchPts + bonusPts + champPts
      const today = new Date().toISOString().slice(0, 10)

      // Check existing entry for daily snapshot
      const existing = await prisma.leaderboardEntry.findUnique({
        where: { userId_poolId: { userId: uid, poolId: pool.id } },
      })

      // Snapshot previous points once per day (when the date changes)
      const lastSnapshotDate = existing?.snapshotAt?.toISOString().slice(0, 10) ?? null
      const shouldSnapshot = existing && lastSnapshotDate !== today

      await prisma.leaderboardEntry.upsert({
        where: { userId_poolId: { userId: uid, poolId: pool.id } },
        create: {
          userId: uid,
          poolId: pool.id,
          matchPoints: matchPts,
          bonusPoints: bonusPts,
          championPoints: champPts,
          totalPoints: newTotal,
          previousTotalPoints: null,
          snapshotAt: null,
          lastCalculatedAt: new Date(),
        },
        update: {
          matchPoints: matchPts,
          bonusPoints: bonusPts,
          championPoints: champPts,
          totalPoints: newTotal,
          ...(shouldSnapshot
            ? {
                previousTotalPoints: existing.totalPoints,
                snapshotAt: new Date(),
              }
            : {}),
          lastCalculatedAt: new Date(),
        },
      })
    }

    // Na alle leden: detecteer leider-overname en achievements
    const newLeader = await prisma.leaderboardEntry.findFirst({
      where: { poolId: pool.id },
      orderBy: { totalPoints: "desc" },
      select: { userId: true, totalPoints: true },
    })
    const newLeaderId = newLeader && newLeader.totalPoints > 0 ? newLeader.userId : null
    if (newLeaderId !== oldLeaderId) {
      await detectLeaderTakeover(pool.id, oldLeaderId, newLeaderId)
    }

    await detectAchievementsForPool(pool.id)
  }
}

// ─── Admin: wachtwoord reset ──────────────────────────────────────────────────

export async function adminResetPassword(formData: FormData) {
  const session = await auth()
  if (!session?.user?.isAdmin) return { error: "Geen toegang" }

  const userId = formData.get("userId") as string
  const newPassword = formData.get("newPassword") as string

  if (!userId) return { error: "Gebruiker niet gevonden" }
  if (!newPassword || newPassword.length < 6) return { error: "Min. 6 tekens" }

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) return { error: "Gebruiker niet gevonden" }

  const passwordHash = await bcrypt.hash(newPassword, 12)
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } })

  return { success: true }
}

// ─── Admin: gebruiker verwijderen ─────────────────────────────────────────────

export async function adminDeleteUser(userId: string) {
  const session = await auth()
  if (!session?.user?.isAdmin) return { error: "Geen toegang" }
  if (userId === session.user.id) return { error: "Je kunt je eigen account niet verwijderen" }

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } })
  if (!user) return { error: "Gebruiker niet gevonden" }

  // De meeste relaties cascaden bij user.delete. LeaderboardEntry heeft alleen
  // een userId-veld (geen FK naar User), dus die ruimen we expliciet op.
  await prisma.$transaction([
    prisma.leaderboardEntry.deleteMany({ where: { userId } }),
    prisma.user.delete({ where: { id: userId } }),
  ])

  revalidatePath("/admin")
  revalidatePath("/dashboard")
  return { success: true }
}

// ─── Prikbord ────────────────────────────────────────────────────────────────

export async function postPoolMessage(formData: FormData) {
  const session = await auth()
  if (!session?.user) return { error: "Niet ingelogd" }

  const poolId = formData.get("poolId") as string
  const content = (formData.get("content") as string)?.trim()

  if (!content || content.length < 1) return { error: "Bericht is leeg" }
  if (content.length > 500) return { error: "Max 500 tekens" }

  const membership = await prisma.poolMembership.findUnique({
    where: { userId_poolId: { userId: session.user.id, poolId } },
  })
  if (!membership) return { error: "Geen toegang tot deze poule" }

  await prisma.poolMessage.create({
    data: { poolId, userId: session.user.id, content },
  })

  revalidatePath(`/pools/${poolId}/prikbord`)
  return { success: true }
}

export async function deletePoolMessage(formData: FormData) {
  const session = await auth()
  if (!session?.user) return { error: "Niet ingelogd" }

  const messageId = formData.get("messageId") as string
  const message = await prisma.poolMessage.findUnique({ where: { id: messageId } })

  if (!message) return { error: "Bericht niet gevonden" }

  const isGlobalAdmin = session.user.isAdmin
  const isAuthor = message.userId === session.user.id
  let isPoolAdmin = false
  if (!isGlobalAdmin && !isAuthor) {
    const membership = await prisma.poolMembership.findUnique({
      where: { userId_poolId: { userId: session.user.id, poolId: message.poolId } },
    })
    isPoolAdmin = membership?.role === "ADMIN"
  }

  if (!isAuthor && !isGlobalAdmin && !isPoolAdmin) return { error: "Geen toegang" }

  await prisma.poolMessage.delete({ where: { id: messageId } })
  revalidatePath(`/pools/${message.poolId}/prikbord`)
  return { success: true }
}

// ─── Profiel instellingen ────────────────────────────────────────────────────

export async function updateName(formData: FormData) {
  const session = await auth()
  if (!session?.user) return { error: "Niet ingelogd" }

  const name = (formData.get("name") as string)?.trim()
  if (!name || name.length < 2) return { error: "Naam moet minimaal 2 tekens zijn" }
  if (name.length > 50) return { error: "Naam mag maximaal 50 tekens zijn" }

  await prisma.user.update({ where: { id: session.user.id }, data: { name } })
  revalidatePath("/profile")
  revalidatePath("/dashboard")
  return { success: true }
}

export async function changePassword(formData: FormData) {
  const session = await auth()
  if (!session?.user) return { error: "Niet ingelogd" }

  const currentPassword = formData.get("currentPassword") as string
  const newPassword = formData.get("newPassword") as string
  const confirmPassword = formData.get("confirmPassword") as string

  if (!currentPassword || !newPassword || !confirmPassword) return { error: "Vul alle velden in" }
  if (newPassword.length < 6) return { error: "Nieuw wachtwoord minimaal 6 tekens" }
  if (newPassword !== confirmPassword) return { error: "Wachtwoorden komen niet overeen" }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user) return { error: "Gebruiker niet gevonden" }

  const valid = await bcrypt.compare(currentPassword, user.passwordHash)
  if (!valid) return { error: "Huidig wachtwoord klopt niet" }

  const passwordHash = await bcrypt.hash(newPassword, 12)
  await prisma.user.update({ where: { id: session.user.id }, data: { passwordHash } })
  return { success: true }
}

// ─── WK Survivor ─────────────────────────────────────────────────────────────

export async function joinSurvivor() {
  const session = await auth()
  if (!session?.user) return { error: "Niet ingelogd" }

  const existing = await prisma.survivorEntry.findUnique({
    where: { userId: session.user.id },
  })
  if (existing) return { error: "Je doet al mee aan WK Survivor" }

  await prisma.survivorEntry.create({
    data: { userId: session.user.id },
  })

  revalidatePath("/survivor")
  return { success: true }
}

export async function makeSurvivorPick(mode: "HARDCORE" | "HIGHSCORE", teamId: string, round: string) {
  const session = await auth()
  if (!session?.user) return { error: "Niet ingelogd" }

  const entry = await prisma.survivorEntry.findUnique({
    where: { userId: session.user.id },
  })
  if (!entry) return { error: "Je doet niet mee aan WK Survivor" }

  // HARDCORE: must still be alive
  if (mode === "HARDCORE" && !entry.hardcoreAlive) {
    return { error: "Je bent uitgeschakeld in HARDCORE modus" }
  }

  // Check deadline
  const firstMatch = await getFirstMatchOfRound(round as SurvivorRound)
  if (!firstMatch) return { error: "Ronde niet gevonden" }
  const deadline = new Date(firstMatch.kickoff.getTime() - 30 * 60 * 1000)
  if (new Date() > deadline) return { error: "De deadline voor deze ronde is verstreken" }

  // Determine cycle: HIGHSCORE uses reset cycle, HARDCORE always 0
  const cycle = mode === "HIGHSCORE" && entry.resetUsed ? 1 : 0

  // Check: team already scored a result for this round's pick (can't change after match)
  const existingPick = await prisma.survivorPick.findUnique({
    where: { entryId_round_mode: { entryId: entry.id, round, mode } },
  })
  if (existingPick && existingPick.result !== "PENDING") {
    return { error: "De uitslag van jouw pick is al verwerkt" }
  }

  // If changing team: check new team not already used in another round this cycle+mode
  // (The DB unique constraint catches this, but give a friendly error first)
  if (!existingPick || existingPick.teamId !== teamId) {
    const alreadyUsed = await prisma.survivorPick.findFirst({
      where: {
        userId: session.user.id,
        mode,
        teamId,
        cycle,
        NOT: existingPick ? { id: existingPick.id } : undefined,
      },
    })
    if (alreadyUsed) {
      return { error: "Je hebt dit team al gebruikt in deze cyclus" }
    }
  }

  await prisma.survivorPick.upsert({
    where: { entryId_round_mode: { entryId: entry.id, round, mode } },
    create: {
      entryId: entry.id,
      userId: session.user.id,
      mode,
      teamId,
      round,
      cycle,
    },
    update: { teamId, cycle, result: "PENDING", goalDiff: null },
  })

  revalidatePath("/survivor")
  return { success: true }
}

// Admin: handmatig een Survivor-pick zetten voor een gebruiker (coulance bij
// een net gemiste deadline). Slaat de deadline-check over; overige spelregels
// (team speelt in de ronde, niet al gebruikt, nog niet verwerkt) gelden wel.
export async function adminSetSurvivorPick(
  userId: string,
  mode: "HARDCORE" | "HIGHSCORE",
  round: string,
  teamId: string,
) {
  const session = await auth()
  if (!session?.user?.isAdmin) return { error: "Geen toegang" }

  const entry = await prisma.survivorEntry.findUnique({ where: { userId } })
  if (!entry) return { error: "Deze gebruiker doet niet mee aan WK Survivor" }

  if (mode === "HARDCORE" && !entry.hardcoreAlive) {
    return { error: "Gebruiker is uitgeschakeld in HARDCORE — geen pick mogelijk" }
  }

  // Team moet daadwerkelijk in deze ronde spelen
  const teamIds = await getTeamIdsInRound(round as SurvivorRound)
  if (!teamIds.has(teamId)) return { error: "Dit team speelt niet in deze ronde" }

  const cycle = mode === "HIGHSCORE" && entry.resetUsed ? 1 : 0

  const existingPick = await prisma.survivorPick.findUnique({
    where: { entryId_round_mode: { entryId: entry.id, round, mode } },
  })
  if (existingPick && existingPick.result !== "PENDING") {
    return { error: "De uitslag van deze pick is al verwerkt — niet meer te wijzigen" }
  }

  // Team niet al gebruikt in deze cyclus (afgezien van de huidige pick)
  if (!existingPick || existingPick.teamId !== teamId) {
    const alreadyUsed = await prisma.survivorPick.findFirst({
      where: { userId, mode, teamId, cycle, NOT: existingPick ? { id: existingPick.id } : undefined },
    })
    if (alreadyUsed) return { error: "Gebruiker heeft dit team al gebruikt in deze cyclus" }
  }

  await prisma.survivorPick.upsert({
    where: { entryId_round_mode: { entryId: entry.id, round, mode } },
    create: { entryId: entry.id, userId, mode, teamId, round, cycle },
    update: { teamId, cycle, result: "PENDING", goalDiff: null },
  })

  revalidatePath("/survivor")
  revalidatePath("/admin")
  return { success: true }
}

// ─── Push notificaties ───────────────────────────────────────────────────────

/**
 * Stuur herinneringen voor wedstrijden die binnen 90 minuten beginnen,
 * aan gebruikers die nog geen voorspelling hebben gedaan.
 * Sla daarna notificationSentAt op zodat we niet dubbel sturen.
 */
async function sendMatchReminders() {
  const { pushEnabled, sendPush } = await import("./push")
  if (!pushEnabled) return

  const now = new Date()
  const windowEnd = new Date(now.getTime() + 90 * 60 * 1000)

  // Vind wedstrijden die binnenkort beginnen en nog geen notificatie hebben gehad
  const upcomingMatches = await prisma.match.findMany({
    where: {
      kickoff: { gte: now, lte: windowEnd },
      status: "SCHEDULED",
      notificationSentAt: null,
    },
    include: {
      homeTeam: { select: { nameNl: true, name: true } },
      awayTeam: { select: { nameNl: true, name: true } },
    },
  })

  if (upcomingMatches.length === 0) return

  for (const match of upcomingMatches) {
    const homeLabel = match.homeTeam?.nameNl ?? match.homeTeam?.name ?? "?"
    const awayLabel = match.awayTeam?.nameNl ?? match.awayTeam?.name ?? "?"
    const minutesLeft = Math.round((match.kickoff.getTime() - now.getTime()) / 60000)

    // Haal alle subscribers op met hun pool-lidmaatschappen en bestaande voorspellingen
    const allSubscriptions = await prisma.pushSubscription.findMany({
      select: {
        endpoint: true,
        p256dh: true,
        auth: true,
        userId: true,
        user: {
          select: {
            memberships: { select: { poolId: true } },
            predictions: {
              where: { matchId: match.id },
              select: { poolId: true },
            },
          },
        },
      },
    })

    // Stuur reminder aan gebruikers die in minstens één pool nog geen voorspelling hebben
    type SubWithPool = { endpoint: string; p256dh: string; auth: string; firstMissingPool: string }
    const subscribers: SubWithPool[] = []
    for (const sub of allSubscriptions) {
      const poolIds = sub.user.memberships.map((m) => m.poolId)
      if (poolIds.length === 0) continue
      const predictedPoolIds = new Set(sub.user.predictions.map((p) => p.poolId))
      const firstMissing = poolIds.find((id) => !predictedPoolIds.has(id))
      if (firstMissing) {
        subscribers.push({ endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth, firstMissingPool: firstMissing })
      }
    }

    const expiredEndpoints: string[] = []

    for (const sub of subscribers) {
      const result = await sendPush(sub, {
        title: "⚽ Wedstrijd begint bijna!",
        body: `${homeLabel} – ${awayLabel} begint over ${minutesLeft} minuten. Maak snel je voorspelling!`,
        url: `/pools/${sub.firstMissingPool}/predictions`,
        tag: `match-reminder-${match.id}`,
      })
      if (result.expired) expiredEndpoints.push(sub.endpoint)
    }

    // Verwijder verlopen subscriptions
    if (expiredEndpoints.length > 0) {
      await prisma.pushSubscription.deleteMany({
        where: { endpoint: { in: expiredEndpoints } },
      })
    }

    // Markeer de wedstrijd als notificatie verstuurd
    await prisma.match.update({
      where: { id: match.id },
      data: { notificationSentAt: new Date() },
    })
  }
}

export async function resetHighscore() {
  const session = await auth()
  if (!session?.user) return { error: "Niet ingelogd" }

  const entry = await prisma.survivorEntry.findUnique({
    where: { userId: session.user.id },
  })
  if (!entry) return { error: "Je doet niet mee" }
  if (entry.resetUsed) return { error: "Je hebt je reset al gebruikt" }

  await prisma.survivorEntry.update({
    where: { id: entry.id },
    data: { resetUsed: true },
  })

  revalidatePath("/survivor")
  return { success: true }
}

// ─── Fantasy WK ───────────────────────────────────────────────────────────────

// Maakt het Fantasy-team aan of vervangt de volledige selectie. Tot de
// FANTASY_DEADLINE (eerste wedstrijd) mag dit ONBEPERKT — zo kun je je team
// vrij blijven aanpassen tot het toernooi begint.
export async function saveFantasyTeam(formData: FormData) {
  const session = await auth()
  if (!session?.user) return { error: "Niet ingelogd" }

  if (new Date() > FANTASY_DEADLINE) {
    return { error: "De deadline is verstreken — je team is vergrendeld." }
  }

  const nickname = (formData.get("nickname") as string)?.trim()
  if (!nickname) return { error: "Geef je team een naam" }
  if (nickname.length > 30) return { error: "Teamnaam mag maximaal 30 tekens zijn" }

  const playerIds = (formData.getAll("playerIds") as string[]).filter(Boolean)
  if (playerIds.length !== SQUAD_SIZE) {
    return { error: `Selecteer precies ${SQUAD_SIZE} spelers (nu: ${playerIds.length})` }
  }

  // Spelers ophalen voor validatie
  const players = await prisma.player.findMany({
    where: { id: { in: playerIds }, isActive: true },
    include: { team: { select: { code: true } } },
  })

  if (players.length !== SQUAD_SIZE) {
    return { error: "Een of meer geselecteerde spelers zijn ongeldig" }
  }

  const validation = validateSquad(
    players.map((p) => ({ position: p.position, teamCode: p.team.code })),
    false
  )
  if (!validation.valid) {
    return { error: validation.errors.join(", ") }
  }

  const existing = await prisma.fantasyTeam.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  })

  if (existing) {
    // Volledige selectie vervangen (onbeperkt vóór de deadline)
    await prisma.$transaction([
      prisma.fantasyPick.deleteMany({ where: { fantasyTeamId: existing.id } }),
      prisma.fantasyTeam.update({ where: { id: existing.id }, data: { nickname } }),
      prisma.fantasyPick.createMany({
        data: playerIds.map((playerId) => ({ fantasyTeamId: existing.id, playerId, addedInRound: "GROUP_1" })),
      }),
    ])
  } else {
    await prisma.fantasyTeam.create({
      data: {
        userId: session.user.id,
        nickname,
        picks: { create: playerIds.map((playerId) => ({ playerId, addedInRound: "GROUP_1" })) },
      },
    })
  }

  revalidatePath("/fantasy")
  return { success: true }
}

export async function updateFantasyNickname(nickname: string) {
  const session = await auth()
  if (!session?.user) return { error: "Niet ingelogd" }

  const trimmed = nickname.trim()
  if (!trimmed) return { error: "Teamnaam mag niet leeg zijn" }
  if (trimmed.length > 30) return { error: "Teamnaam mag maximaal 30 tekens zijn" }

  const team = await prisma.fantasyTeam.findUnique({
    where: { userId: session.user.id },
  })
  if (!team) return { error: "Je hebt nog geen Fantasy-team" }

  await prisma.fantasyTeam.update({
    where: { id: team.id },
    data: { nickname: trimmed },
  })

  revalidatePath("/fantasy")
  return { success: true }
}

export async function makeFantasyTransfers(
  round: FantasyRound,
  transfers: Array<{ playerOutId: string; playerInId: string }>
) {
  const session = await auth()
  if (!session?.user) return { error: "Niet ingelogd" }

  if (!TRANSFER_ROUNDS.includes(round)) {
    return { error: "Transfers zijn niet meer mogelijk in deze fase" }
  }

  // Tot de eerste wedstrijd pas je je team onbeperkt aan (geen transfers)
  if (new Date() < FANTASY_DEADLINE) {
    return { error: "Transfers gaan pas open zodra het toernooi begint — tot dan kun je je team vrij aanpassen." }
  }

  // Transfers voor een ronde sluiten bij de eerste wedstrijd van die ronde
  const roundDeadline = await getRoundDeadline(round as SurvivorRound)
  if (!roundDeadline) return { error: "Deze ronde is nog niet ingepland." }
  if (new Date() >= roundDeadline) return { error: "De transferdeadline voor deze ronde is verstreken." }

  if (transfers.length === 0) return { error: "Geen transfers opgegeven" }
  if (transfers.length > MAX_TRANSFERS_PER_ROUND) {
    return { error: `Maximaal ${MAX_TRANSFERS_PER_ROUND} transfers per ronde` }
  }

  const team = await prisma.fantasyTeam.findUnique({
    where: { userId: session.user.id },
    include: { picks: { include: { player: { include: { team: { select: { code: true } } } } } } },
  })
  if (!team) return { error: "Je hebt nog geen Fantasy-team" }

  // Check hoeveel transfers al gebruikt in deze ronde
  const usedTransfers = await prisma.fantasyTransfer.count({
    where: { fantasyTeamId: team.id, round },
  })
  if (usedTransfers + transfers.length > MAX_TRANSFERS_PER_ROUND) {
    return { error: `Je hebt al ${usedTransfers} transfer(s) gebruikt in deze ronde` }
  }

  // Valideer elke transfer
  const currentPickIds = new Set(team.picks.map((p) => p.playerId))

  for (const t of transfers) {
    if (!currentPickIds.has(t.playerOutId)) {
      return { error: "Speler die eruit gaat zit niet in je team" }
    }
    if (currentPickIds.has(t.playerInId)) {
      return { error: "Speler die erin komt zit al in je team" }
    }
  }

  // Simuleer nieuwe selectie
  const newPickIds = new Set(currentPickIds)
  for (const t of transfers) {
    newPickIds.delete(t.playerOutId)
    newPickIds.add(t.playerInId)
  }

  const newPlayers = await prisma.player.findMany({
    where: { id: { in: Array.from(newPickIds) }, isActive: true },
    include: { team: { select: { code: true } } },
  })

  const isKO = !["GROUP_1", "GROUP_2", "GROUP_3"].includes(round)
  const validation = validateSquad(
    newPlayers.map((p) => ({ position: p.position, teamCode: p.team.code })),
    isKO
  )
  if (!validation.valid) {
    return { error: validation.errors.join(", ") }
  }

  // Voer transfers door
  await prisma.$transaction(async (tx) => {
    for (const t of transfers) {
      await tx.fantasyPick.deleteMany({
        where: { fantasyTeamId: team.id, playerId: t.playerOutId },
      })
      await tx.fantasyPick.create({
        data: { fantasyTeamId: team.id, playerId: t.playerInId, addedInRound: round },
      })
      await tx.fantasyTransfer.create({
        data: {
          fantasyTeamId: team.id,
          round,
          playerOutId: t.playerOutId,
          playerInId: t.playerInId,
        },
      })
    }
  })

  revalidatePath("/fantasy")
  return { success: true }
}

// ─── WK Manager: puntentelling ────────────────────────────────────────────────

const FANTASY_ROUND_INDEX: Record<string, number> = {
  GROUP_1: 0, GROUP_2: 1, GROUP_3: 2,
  ROUND_OF_32: 3, ROUND_OF_16: 4, QUARTER_FINAL: 5, SEMI_FINAL: 6, FINAL: 7,
}

// Herberekent alle teamtotalen met eerlijke per-ronde-attributie: een speler
// levert alleen punten op voor wedstrijden in de rondes waarin hij in de
// selectie zat (gereconstrueerd uit de huidige picks + transferhistorie).
async function recalcFantasyTeams() {
  const finishedMatches = await prisma.match.findMany({
    where: { status: "FINISHED" },
    select: { id: true, stage: true, matchday: true },
  })
  const matchRound = new Map<string, string>()
  for (const m of finishedMatches) {
    // De derde-plaatswedstrijd telt voor WK Manager mee in de finale-ronde
    const r = m.stage === "THIRD_PLACE" ? "FINAL" : matchToSurvivorRound({ stage: m.stage, matchday: m.matchday })
    if (r) matchRound.set(m.id, r)
  }
  const matchIds = [...matchRound.keys()]
  if (matchIds.length === 0) return

  const stats = await prisma.fantasyPlayerStats.findMany({
    where: { matchId: { in: matchIds } },
    select: { playerId: true, matchId: true, totalPoints: true },
  })
  const pointsByMatch = new Map<string, Map<string, number>>()
  for (const s of stats) {
    let m = pointsByMatch.get(s.matchId)
    if (!m) { m = new Map(); pointsByMatch.set(s.matchId, m) }
    m.set(s.playerId, s.totalPoints)
  }

  const teams = await prisma.fantasyTeam.findMany({
    include: {
      picks: { select: { playerId: true } },
      transfers: { select: { round: true, playerOutId: true, playerInId: true } },
    },
  })

  for (const team of teams) {
    const currentSquad = new Set(team.picks.map((p) => p.playerId))
    let total = 0
    for (const [matchId, round] of matchRound) {
      const matchPoints = pointsByMatch.get(matchId)
      if (!matchPoints || matchPoints.size === 0) continue
      // Selectie zoals die was in deze ronde: draai transfers van latere rondes terug
      const ri = FANTASY_ROUND_INDEX[round] ?? 99
      const squad = new Set(currentSquad)
      for (const t of team.transfers) {
        if ((FANTASY_ROUND_INDEX[t.round] ?? 99) > ri) {
          squad.delete(t.playerInId)
          squad.add(t.playerOutId)
        }
      }
      for (const playerId of squad) {
        total += matchPoints.get(playerId) ?? 0
      }
    }
    await prisma.fantasyTeam.update({ where: { id: team.id }, data: { totalPoints: total } })
  }
}

type FantasyStatEntry = {
  playerId: string
  minutesPlayed: number
  goals: number
  assists: number
  shotsSaved: number
  penaltySaved: number
  penaltyMissed: number
  yellowCards: number
  redCards: number
  ownGoals: number
  bonusPoints: number
}

// Admin: spelersstatistieken voor één wedstrijd opslaan. Tegendoelpunten en
// clean sheet worden afgeleid uit de uitslag. Daarna worden alle teamtotalen
// herberekend.
export async function saveFantasyPlayerStats(matchId: string, entries: FantasyStatEntry[]) {
  const session = await auth()
  if (!session?.user?.isAdmin) return { error: "Geen toegang" }

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    select: { id: true, homeTeamId: true, awayTeamId: true, homeScore: true, awayScore: true },
  })
  if (!match) return { error: "Wedstrijd niet gevonden" }
  if (match.homeScore === null || match.awayScore === null) return { error: "Wedstrijd heeft nog geen uitslag" }

  const players = await prisma.player.findMany({
    where: { id: { in: entries.map((e) => e.playerId) } },
    select: { id: true, position: true, teamId: true },
  })
  const playerMap = new Map(players.map((p) => [p.id, p]))

  for (const e of entries) {
    const p = playerMap.get(e.playerId)
    if (!p) continue
    const conceded = p.teamId === match.homeTeamId ? match.awayScore! : match.homeScore!
    const cleanSheet = conceded === 0
    const totalPoints = calculateFantasyPoints({
      position: p.position,
      minutesPlayed: e.minutesPlayed,
      goals: e.goals,
      assists: e.assists,
      cleanSheet,
      goalsConceded: conceded,
      shotsSaved: e.shotsSaved,
      penaltySaved: e.penaltySaved,
      penaltyMissed: e.penaltyMissed,
      yellowCards: e.yellowCards,
      redCards: e.redCards,
      ownGoals: e.ownGoals,
      bonusPoints: e.bonusPoints,
    })
    const data = {
      minutesPlayed: e.minutesPlayed,
      goals: e.goals,
      assists: e.assists,
      cleanSheet,
      goalsConceded: conceded,
      shotsSaved: e.shotsSaved,
      penaltySaved: e.penaltySaved,
      penaltyMissed: e.penaltyMissed,
      yellowCards: e.yellowCards,
      redCards: e.redCards,
      ownGoals: e.ownGoals,
      bonusPoints: e.bonusPoints,
      totalPoints,
    }
    await prisma.fantasyPlayerStats.upsert({
      where: { playerId_matchId: { playerId: e.playerId, matchId } },
      create: { playerId: e.playerId, matchId, ...data },
      update: data,
    })
  }

  await recalcFantasyTeams()
  revalidatePath("/admin/fantasy")
  revalidatePath(`/admin/fantasy/${matchId}`)
  revalidatePath("/fantasy")
  return { success: true }
}

// Admin: haalt spelersstatistieken op bij API-Football en levert ze terug om
// het invoerscherm voor te vullen (opslaan doet de admin daarna zelf).
type StatPrefill = {
  minutesPlayed: number; goals: number; assists: number; shotsSaved: number
  penaltySaved: number; penaltyMissed: number; yellowCards: number; redCards: number
}
type AutofillResult =
  | { error: string }
  | { ok: true; prefill: Record<string, StatPrefill>; matched: number; total: number }

export async function autofillFantasyStatsFromApi(matchId: string): Promise<AutofillResult> {
  const session = await auth()
  if (!session?.user?.isAdmin) return { error: "Geen toegang" }

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    select: {
      kickoff: true, homeScore: true, awayScore: true,
      homeTeamId: true, awayTeamId: true,
      homeTeam: { select: { name: true } },
      awayTeam: { select: { name: true } },
    },
  })
  if (!match) return { error: "Wedstrijd niet gevonden" }
  if (match.homeScore === null || match.awayScore === null) return { error: "Wedstrijd heeft nog geen uitslag" }
  if (!match.homeTeam || !match.awayTeam) return { error: "Teams onbekend voor deze wedstrijd" }

  const { findFixtureId, fetchFixturePlayerStats, normalizeName } = await import("./api-football")

  const prefill: Record<string, StatPrefill> = {}
  let matched = 0
  let total = 0

  try {
    const fixtureId = await findFixtureId(
      match.kickoff.toISOString(), match.homeTeam.name, match.awayTeam.name,
      match.homeScore, match.awayScore,
    )
    if (!fixtureId) return { error: "Geen overeenkomende wedstrijd gevonden in API-Football" }

    const apiStats = await fetchFixturePlayerStats(fixtureId)

    // Onze ooit-gekozen spelers van de twee teams (zelfde set als het invoerscherm)
    const teamIds = [match.homeTeamId, match.awayTeamId].filter(Boolean) as string[]
    const candidateIds = new Set<string>()
    ;(await prisma.fantasyPick.findMany({ select: { playerId: true } })).forEach((p) => candidateIds.add(p.playerId))
    ;(await prisma.fantasyTransfer.findMany({ select: { playerOutId: true, playerInId: true } })).forEach((t) => {
      candidateIds.add(t.playerOutId)
      candidateIds.add(t.playerInId)
    })
    const ourPlayers = await prisma.player.findMany({
      where: { id: { in: [...candidateIds] }, teamId: { in: teamIds } },
      select: { id: true, name: true, nameNl: true },
    })
    total = ourPlayers.length

    // Volgorde-onafhankelijke tokensleutel: "Son Heung-Min" == "Heung-Min Son"
    const tokenKey = (n: string) => n.split(/[\s\-.]+/).map(normalizeName).filter(Boolean).sort().join("|")

    // Index API-spelers op volledige naam, tokenset en achternaam
    const byFull = new Map<string, (typeof apiStats)[number]>()
    const byTokens = new Map<string, (typeof apiStats)[number][]>()
    const byLast = new Map<string, (typeof apiStats)[number][]>()
    for (const s of apiStats) {
      byFull.set(normalizeName(s.name), s)
      const tk = tokenKey(s.name)
      ;(byTokens.get(tk) ?? byTokens.set(tk, []).get(tk)!).push(s)
      const parts = s.name.trim().split(/\s+/)
      const last = normalizeName(parts[parts.length - 1])
      ;(byLast.get(last) ?? byLast.set(last, []).get(last)!).push(s)
    }

    for (const p of ourPlayers) {
      const candidates = [p.name, p.nameNl].filter(Boolean) as string[]
      // 1) volledige naam
      let s = candidates.map((n) => byFull.get(normalizeName(n))).find(Boolean)
      // 2) zelfde tokenset (volgorde-onafhankelijk), uniek
      if (!s) {
        for (const n of candidates) {
          const arr = byTokens.get(tokenKey(n))
          if (arr && arr.length === 1) { s = arr[0]; break }
        }
      }
      // 3) zelfde achternaam, uniek
      if (!s) {
        for (const n of candidates) {
          const parts = n.trim().split(/\s+/)
          const last = normalizeName(parts[parts.length - 1])
          const arr = byLast.get(last)
          if (arr && arr.length === 1) { s = arr[0]; break }
        }
      }
      if (s) {
        prefill[p.id] = {
          minutesPlayed: s.minutes, goals: s.goals, assists: s.assists, shotsSaved: s.saves,
          penaltySaved: s.penaltySaved, penaltyMissed: s.penaltyMissed, yellowCards: s.yellow, redCards: s.red,
        }
        matched++
      }
    }
  } catch (err) {
    console.error("[autofillFantasyStats]", err)
    return { error: `API-Football: ${(err as Error).message}` }
  }

  return { ok: true as const, prefill, matched, total }
}
