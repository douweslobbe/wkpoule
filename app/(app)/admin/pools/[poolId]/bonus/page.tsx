import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { SetAnswerForm } from "./SetAnswerForm"
import { AddQuestionForm } from "./AddQuestionForm"
import { BonusQuestionType } from "@prisma/client"

const TYPE_LABELS: Record<BonusQuestionType, string> = {
  OPEN: "Openvraag",
  ESTIMATION: "Benaderingsvraag",
  STATEMENT: "Stelling",
}

export default async function AdminBonusPage({ params }: { params: Promise<{ poolId: string }> }) {
  const { poolId } = await params
  const session = await auth()
  if (!session?.user) redirect("/login")

  // Allow pool admin OR global admin
  const membership = await prisma.poolMembership.findUnique({
    where: { userId_poolId: { userId: session.user.id, poolId } },
  })
  if (!membership || (membership.role !== "ADMIN" && !session.user.isAdmin)) {
    redirect("/dashboard")
  }

  const pool = await prisma.pool.findUnique({ where: { id: poolId } })
  if (!pool) notFound()

  const questions = await prisma.bonusQuestion.findMany({
    where: { poolId },
    include: { _count: { select: { answers: true } } },
    orderBy: { orderIndex: "asc" },
  })

  return (
    <div>
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <Link href="/admin" className="text-sm text-gray-500 hover:text-gray-700">
          ← Admin
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Bonusvragen — {pool.name}</h1>
      </div>

      <div className="space-y-3 mb-8">
        {questions.map((q) => (
          <div key={q.id} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div>
                <span className="text-xs font-semibold text-orange-600 bg-orange-50 px-2 py-0.5 rounded mr-2">
                  {TYPE_LABELS[q.type]}
                </span>
                <span className="font-medium text-gray-900">{q.question}</span>
              </div>
              <span className="text-xs text-gray-400 shrink-0">{q._count.answers} antwoorden</span>
            </div>
            {q.description && <p className="text-xs text-gray-500 mb-2">{q.description}</p>}
            <SetAnswerForm questionId={q.id} currentAnswer={q.correctAnswer} type={q.type} />
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-900 mb-4">Vraag toevoegen</h2>
        <AddQuestionForm poolId={poolId} />
      </div>
    </div>
  )
}
