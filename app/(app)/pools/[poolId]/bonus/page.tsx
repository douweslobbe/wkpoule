import { redirect, notFound } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { BonusQuestionBlock } from "./BonusQuestionBlock"
import { BonusQuestionType } from "@prisma/client"
import { PoolSubNav } from "../PoolSubNav"
import { ChampionForm } from "../champion/ChampionForm"

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

  // Champion pick data
  const teams = await prisma.team.findMany({ orderBy: { name: "asc" } })
  const myPick = await prisma.championPick.findUnique({
    where: { userId_poolId: { userId: session.user.id, poolId } },
    include: { team: true },
  })
  const locked = new Date() > TOURNAMENT_START
  const allPicks = locked
    ? await prisma.championPick.findMany({
        where: { poolId },
        include: { team: true, user: { select: { name: true } } },
      })
    : []

  const now = new Date()

  const groups: Record<string, typeof questions> = {}
  for (const q of questions) {
    const key = q.type
    if (!groups[key]) groups[key] = []
    groups[key].push(q)
  }

  return (
    <div>
      <PoolSubNav poolId={poolId} />

      <div className="pixel-card p-4 mb-6" style={{ background: "#fff8e0" }}>
        <p className="text-xs text-gray-700">
          <strong>7 punten</strong> per goed beantwoorde bonusvraag ·{" "}
          <strong>15 punten</strong> voor de juiste kampioen<br/>
          Deadline: <strong>
            {TOURNAMENT_START.toLocaleString("nl-NL", {
              weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit",
            })}
          </strong>
        </p>
      </div>

      {/* Kampioen kiezen */}
      <div className="pixel-card mb-6 overflow-hidden">
        <div className="px-5 py-3" style={{ background: "#FFD700", borderBottom: "3px solid #1a1a2e" }}>
          <h2 className="font-pixel text-pixel-black" style={{ fontSize: "9px" }}>🏆 KAMPIOEN KIEZEN</h2>
          <p className="text-xs mt-1 font-bold text-gray-700">15 punten · deadline start toernooi</p>
        </div>
        <div className="p-5">
          {locked ? (
            <div>
              {myPick && (
                <div className="flex items-center gap-3 mb-4 p-3 bg-yellow-50" style={{ border: "2px solid #1a1a2e" }}>
                  <span className="text-2xl">🔒</span>
                  {myPick.team.flagUrl && <img src={myPick.team.flagUrl} alt="" className="w-8 h-6 object-contain" />}
                  <span className="font-bold text-gray-900">{myPick.team.nameNl ?? myPick.team.name}</span>
                  {myPick.pointsAwarded !== null && (
                    <span className="ml-auto font-pixel text-xs" style={{ color: myPick.pointsAwarded > 0 ? "#16a34a" : "#6b7280" }}>
                      {myPick.pointsAwarded > 0 ? `+${myPick.pointsAwarded}pt` : "0pt"}
                    </span>
                  )}
                </div>
              )}
              {allPicks.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-bold text-gray-500 uppercase mb-2">Alle picks:</p>
                  {allPicks.map((pick) => (
                    <div key={pick.id} className="flex items-center gap-2 py-1.5 text-sm">
                      {pick.team.flagUrl && <img src={pick.team.flagUrl} alt="" className="w-6 h-4 object-contain" />}
                      <span className="flex-1 text-gray-700">{pick.user.name}</span>
                      <span className="font-semibold">{pick.team.nameNl ?? pick.team.name}</span>
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
        </div>
      </div>

      {/* Bonus questions */}
      <div className="space-y-6">
        {(["OPEN", "ESTIMATION", "STATEMENT"] as BonusQuestionType[]).map((type) => {
          const qs = groups[type]
          if (!qs?.length) return null
          return (
            <div key={type} className="pixel-card overflow-hidden">
              <div className="px-5 py-3" style={{ background: "#0a3d1f", borderBottom: "3px solid #1a1a2e" }}>
                <h2 className="font-pixel text-white" style={{ fontSize: "9px" }}>{TYPE_LABELS[type].toUpperCase()}</h2>
                {type === "ESTIMATION" && (
                  <p className="text-xs text-green-300 mt-0.5">3 dichtstbijzijnde voorspellingen worden beloond.</p>
                )}
                {type === "STATEMENT" && (
                  <p className="text-xs text-green-300 mt-0.5">Kies Eens of Oneens.</p>
                )}
              </div>
              <div className="divide-y-2 divide-gray-200">
                {qs.map((q) => {
                  const ans = answerMap.get(q.id)
                  const deadline = q.deadline ?? TOURNAMENT_START
                  const qLocked = now > deadline
                  return (
                    <BonusQuestionBlock
                      key={q.id}
                      question={q}
                      currentAnswer={ans?.answer}
                      pointsAwarded={ans?.pointsAwarded}
                      locked={qLocked}
                      correctAnswer={q.correctAnswer}
                    />
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
