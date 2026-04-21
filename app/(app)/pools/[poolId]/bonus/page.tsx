import { redirect, notFound } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { BonusQuestionBlock } from "./BonusQuestionBlock"
import { QuestionStats } from "./QuestionStats"
import { BonusQuestionType } from "@prisma/client"
import { PoolSubNav } from "../PoolSubNav"
import { ChampionForm } from "../champion/ChampionForm"
import { PixelFlag } from "@/components/PixelFlag"

const TYPE_LABELS: Record<BonusQuestionType, string> = {
  OPEN: "Openvragen",
  ESTIMATION: "Benaderingsvragen",
  STATEMENT: "Stellingen",
}

const TOURNAMENT_START = new Date("2026-06-11T20:00:00Z")

export default async function BonusPage({ params }: { params: Promise<{ poolId: string }> }) {
  const { poolId } = await params
  const session = await auth()
  if (!session?.user) redirect("/login")

  const membership = await prisma.poolMembership.findUnique({
    where: { userId_poolId: { userId: session.user.id, poolId } },
    include: { pool: true },
  })
  if (!membership) notFound()

  const questions = await prisma.bonusQuestion.findMany({
    where: { poolId },
    orderBy: { orderIndex: "asc" },
  })

  const myAnswers = await prisma.bonusAnswer.findMany({
    where: { userId: session.user.id, questionId: { in: questions.map((q) => q.id) } },
  })
  const answerMap = new Map(myAnswers.map((a) => [a.questionId, a]))

  // Alle antwoorden van de hele pool (voor statistieken)
  const allAnswers = await prisma.bonusAnswer.findMany({
    where: { questionId: { in: questions.map((q) => q.id) } },
    select: { questionId: true, answer: true },
  })
  const allAnswersByQuestion = new Map<string, { answer: string }[]>()
  for (const a of allAnswers) {
    const list = allAnswersByQuestion.get(a.questionId) ?? []
    list.push({ answer: a.answer })
    allAnswersByQuestion.set(a.questionId, list)
  }

  // Champion pick data
  const teams = await prisma.team.findMany({ orderBy: { name: "asc" } })
  const myPick = await prisma.championPick.findUnique({
    where: { userId_poolId: { userId: session.user.id, poolId } },
    include: { team: true },
  })
  const locked = new Date() > TOURNAMENT_START

  // Alle champion picks (altijd laden voor de verdeling)
  const poolChampionPicks = await prisma.championPick.findMany({
    where: { poolId },
    include: { team: true, user: { select: { name: true } } },
  })
  const memberCount = await prisma.poolMembership.count({ where: { poolId } })

  const now = new Date()

  const groups: Record<string, typeof questions> = {}
  for (const q of questions) {
    const key = q.type
    if (!groups[key]) groups[key] = []
    groups[key].push(q)
  }

  // Champion picks grouped by team
  const champPicksByTeam = poolChampionPicks.reduce<
    Record<string, { teamName: string; teamCode: string; count: number; names: string[] }>
  >((acc, p) => {
    const key = p.team.id
    if (!acc[key]) {
      acc[key] = {
        teamName: p.team.nameNl ?? p.team.name,
        teamCode: p.team.code,
        count: 0,
        names: [],
      }
    }
    acc[key].count++
    acc[key].names.push(p.user.name)
    return acc
  }, {})

  const sortedChampPicks = Object.entries(champPicksByTeam)
    .sort((a, b) => b[1].count - a[1].count)

  return (
    <div>
      <PoolSubNav poolId={poolId} />

      <div className="pixel-card p-4 mb-6" style={{ background: "#0d1a10", borderLeft: "4px solid #FFD700" }}>
        <p className="text-xs" style={{ color: "#9999cc" }}>
          <span style={{ color: "#FFD700", fontWeight: "bold" }}>7 punten</span> per goed beantwoorde bonusvraag ·{" "}
          <span style={{ color: "#FFD700", fontWeight: "bold" }}>15 punten</span> voor de juiste kampioen<br />
          Deadline:{" "}
          <span style={{ color: "#FF6200", fontWeight: "bold" }}>
            {TOURNAMENT_START.toLocaleString("nl-NL", {
              weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit",
            })}
          </span>
        </p>
      </div>

      {/* Kampioen kiezen */}
      <div className="pixel-card mb-6 overflow-hidden">
        <div className="px-5 py-3" style={{ background: "#1a1200", borderBottom: "3px solid #000" }}>
          <h2 className="font-pixel" style={{ fontSize: "9px", color: "#FFD700" }}>🏆 KAMPIOEN KIEZEN</h2>
          <p className="mt-1 font-bold" style={{ fontSize: "10px", color: "#666644" }}>15 punten · deadline start toernooi</p>
        </div>
        <div className="p-5">
          {locked ? (
            <div>
              {myPick && (
                <div className="flex items-center gap-3 mb-4 p-3" style={{ background: "#1e1200", border: "2px solid #FF6200", boxShadow: "2px 2px 0 #000" }}>
                  <span className="text-2xl">🔒</span>
                  <PixelFlag code={myPick.team.code} size="md" />
                  <span className="font-bold" style={{ color: "#e0e0f0" }}>{myPick.team.nameNl ?? myPick.team.name}</span>
                  {myPick.pointsAwarded !== null && (
                    <span className="ml-auto font-pixel" style={{ fontSize: "9px", color: myPick.pointsAwarded > 0 ? "#4af56a" : "#444466" }}>
                      {myPick.pointsAwarded > 0 ? `+${myPick.pointsAwarded}pt` : "0pt"}
                    </span>
                  )}
                </div>
              )}
              {poolChampionPicks.length > 0 && (
                <div className="space-y-1.5">
                  <p className="mb-2 font-pixel uppercase" style={{ fontSize: "7px", color: "#555577" }}>Alle picks:</p>
                  {poolChampionPicks.map((pick) => (
                    <div key={pick.id} className="flex items-center gap-2 py-1.5 text-sm" style={{ borderBottom: "1px solid #1a1d30" }}>
                      <PixelFlag code={pick.team.code} size="sm" />
                      <span className="flex-1" style={{ color: "#8888aa" }}>{pick.user.name}</span>
                      <span className="font-semibold" style={{ color: "#e0e0f0" }}>{pick.team.nameNl ?? pick.team.name}</span>
                      {pick.pointsAwarded !== null && (
                        <span className="font-pixel ml-2" style={{ fontSize: "7px", color: pick.pointsAwarded > 0 ? "#4af56a" : "#444466" }}>
                          {pick.pointsAwarded > 0 ? `+${pick.pointsAwarded}` : "0"}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <ChampionForm
              poolId={poolId}
              teams={teams.map((t) => ({ id: t.id, name: t.nameNl ?? t.name, code: t.code, flagUrl: t.flagUrl ?? undefined }))}
              currentTeamId={myPick?.teamId}
            />
          )}

          {/* Poule-verdeling (altijd zichtbaar, ook voor deadline) */}
          {sortedChampPicks.length > 0 && (
            <div className="mt-5 pt-4" style={{ borderTop: "2px solid #1a1d30" }}>
              <p className="mb-3 font-pixel uppercase" style={{ fontSize: "7px", color: "#555577" }}>
                Kampioenskeuze in de pool ({poolChampionPicks.length}/{memberCount} gekozen):
              </p>
              <div className="space-y-2">
                {sortedChampPicks.map(([teamId, info]) => {
                  const pct = Math.round((info.count / poolChampionPicks.length) * 100)
                  const isMyPick = myPick?.team.id === teamId
                  return (
                    <div key={teamId} className="flex items-center gap-2">
                      <PixelFlag code={info.teamCode} size="sm" />
                      <div className="flex-1 relative h-6 overflow-hidden" style={{ border: "2px solid #000" }}>
                        <div
                          className="h-full transition-all"
                          style={{ width: `${pct}%`, background: isMyPick ? "#FF6200" : "#0a3d1f" }}
                        />
                        <span className="absolute inset-0 flex items-center px-2 text-xs font-bold" style={{ color: "#e0e0f0" }}>
                          {info.teamName}
                        </span>
                      </div>
                      <span className="text-xs font-bold w-8 text-right" style={{ color: "#9999cc" }}>{info.count}×</span>
                      {isMyPick && (
                        <span className="font-pixel" style={{ color: "#FF6200", fontSize: "7px" }}>◄ JIJ</span>
                      )}
                    </div>
                  )
                })}
              </div>
              {!locked && myPick && (
                <p className="text-xs mt-2 italic" style={{ color: "#444466" }}>
                  Tip: anderen zien jouw keuze pas na de deadline.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bonus questions */}
      <div className="space-y-6">
        {(["OPEN", "ESTIMATION", "STATEMENT"] as BonusQuestionType[]).map((type) => {
          const qs = groups[type]
          if (!qs?.length) return null
          return (
            <div key={type} className="pixel-card overflow-hidden">
              <div className="px-5 py-3" style={{ background: "#0a3d1f", borderBottom: "3px solid #000" }}>
                <h2 className="font-pixel text-white" style={{ fontSize: "9px" }}>{TYPE_LABELS[type].toUpperCase()}</h2>
                {type === "ESTIMATION" && (
                  <p className="mt-0.5" style={{ fontSize: "10px", color: "#4af56a" }}>3 dichtstbijzijnde voorspellingen worden beloond.</p>
                )}
                {type === "STATEMENT" && (
                  <p className="mt-0.5" style={{ fontSize: "10px", color: "#4af56a" }}>Kies Eens of Oneens.</p>
                )}
              </div>
              <div>
                {qs.map((q) => {
                  const ans = answerMap.get(q.id)
                  const deadline = q.deadline ?? TOURNAMENT_START
                  const qLocked = now > deadline
                  return (
                    <div key={q.id} className="px-5 py-4" style={{ borderBottom: "2px solid #1a1d30" }}>
                      <BonusQuestionBlock
                        question={q}
                        currentAnswer={ans?.answer}
                        pointsAwarded={ans?.pointsAwarded}
                        locked={qLocked}
                        correctAnswer={q.correctAnswer}
                      />
                      <QuestionStats
                        type={q.type}
                        answers={allAnswersByQuestion.get(q.id) ?? []}
                        myAnswer={ans?.answer}
                      />
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
