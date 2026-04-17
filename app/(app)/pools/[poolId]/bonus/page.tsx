import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { BonusQuestionBlock } from "./BonusQuestionBlock"
import { BonusQuestionType } from "@prisma/client"

const TYPE_LABELS: Record<BonusQuestionType, string> = {
  OPEN: "Openvragen",
  ESTIMATION: "Benaderingsvragen",
  STATEMENT: "Stellingen",
}

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

  const now = new Date()
  const TOURNAMENT_START = new Date("2026-06-11T20:00:00Z")

  // Group by type
  const groups: Record<string, typeof questions> = {}
  for (const q of questions) {
    const key = q.type
    if (!groups[key]) groups[key] = []
    groups[key].push(q)
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <Link href={`/pools/${poolId}`} className="text-sm text-gray-500 hover:text-gray-700">
          ← {membership.pool.name}
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Bonusvragen</h1>
      </div>

      <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 mb-6 text-sm text-orange-800">
        <strong>7 punten</strong> per goed beantwoorde vraag. Deadline:{" "}
        <strong>
          {TOURNAMENT_START.toLocaleString("nl-NL", {
            weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit",
          })}
        </strong>{" "}
        (start toernooi).
        <br />
        Bij benaderingsvragen winnen de <strong>3 dichtstbijzijnde</strong> voorspellingen.
      </div>

      <div className="space-y-6">
        {(["OPEN", "ESTIMATION", "STATEMENT"] as BonusQuestionType[]).map((type) => {
          const qs = groups[type]
          if (!qs?.length) return null
          return (
            <div key={type} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-5 py-3.5 bg-gray-50 border-b border-gray-100">
                <h2 className="font-semibold text-gray-800">{TYPE_LABELS[type]}</h2>
                {type === "ESTIMATION" && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    De 3 voorspellingen die het dichtst bij de uitkomst liggen worden beloond.
                  </p>
                )}
                {type === "STATEMENT" && (
                  <p className="text-xs text-gray-500 mt-0.5">Kies Eens of Oneens.</p>
                )}
              </div>
              <div className="divide-y divide-gray-100">
                {qs.map((q) => {
                  const ans = answerMap.get(q.id)
                  const deadline = q.deadline ?? TOURNAMENT_START
                  const locked = now > deadline
                  return (
                    <BonusQuestionBlock
                      key={q.id}
                      question={q}
                      currentAnswer={ans?.answer}
                      pointsAwarded={ans?.pointsAwarded}
                      locked={locked}
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
