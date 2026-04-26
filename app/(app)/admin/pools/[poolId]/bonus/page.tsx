import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { SetAnswerForm } from "./SetAnswerForm"
import { AddQuestionForm } from "./AddQuestionForm"
import { TemplateLibrary } from "./TemplateLibrary"
import { PoolSettingsForm } from "./PoolSettingsForm"
import { MemberManageRow } from "./MemberManageRow"
import { BonusQuestionType } from "@prisma/client"
import type { Metadata } from "next"

export async function generateMetadata({ params }: { params: Promise<{ poolId: string }> }): Promise<Metadata> {
  const { poolId } = await params
  const pool = await prisma.pool.findUnique({ where: { id: poolId }, select: { name: true } })
  return { title: pool ? `Beheer: ${pool.name} — WK Pool 2026` : "WK Pool 2026" }
}

const TYPE_LABELS: Record<BonusQuestionType, string> = {
  OPEN: "Openvraag",
  ESTIMATION: "Benaderingsvraag",
  STATEMENT: "Stelling",
}

export default async function AdminBonusPage({ params }: { params: Promise<{ poolId: string }> }) {
  const { poolId } = await params
  const session = await auth()
  if (!session?.user) redirect("/login")

  const membership = await prisma.poolMembership.findUnique({
    where: { userId_poolId: { userId: session.user.id, poolId } },
  })
  if (!membership || (membership.role !== "ADMIN" && !session.user.isAdmin)) {
    redirect("/dashboard")
  }

  const pool = await prisma.pool.findUnique({ where: { id: poolId } })
  if (!pool) notFound()

  const members = await prisma.poolMembership.findMany({
    where: { poolId },
    include: { user: { select: { id: true, name: true } } },
    orderBy: [{ role: "asc" }, { joinedAt: "asc" }],
  })

  const questions = await prisma.bonusQuestion.findMany({
    where: { poolId },
    include: { _count: { select: { answers: true } } },
    orderBy: [{ category: "asc" }, { orderIndex: "asc" }],
  })

  const existingQuestionTexts = questions.map((q) => q.question)

  // Groepeer per categorie
  const byCategory = new Map<string, typeof questions>()
  for (const q of questions) {
    const cat = q.category ?? "Eigen vragen"
    const list = byCategory.get(cat) ?? []
    list.push(q)
    byCategory.set(cat, list)
  }

  const isGlobalAdmin = session.user.isAdmin

  return (
    <div>
      {/* Terug-links */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <Link href={`/pools/${poolId}`} className="font-pixel" style={{ fontSize: "7px", color: "#7070a0" }}>
          ◄ {pool.name.toUpperCase()}
        </Link>
        {isGlobalAdmin && (
          <>
            <span className="font-pixel" style={{ fontSize: "7px", color: "#333360" }}>·</span>
            <Link href="/admin" className="font-pixel" style={{ fontSize: "7px", color: "#555580" }}>
              SYSTEEM-ADMIN
            </Link>
          </>
        )}
        <h1 className="font-pixel text-white" style={{ fontSize: "10px" }}>
          ⚙ BEHEER — {pool.name.toUpperCase()}
        </h1>
      </div>

      {/* Pool instellingen */}
      <div className="pixel-card overflow-hidden mb-6">
        <div className="px-5 py-3" style={{ background: "#1a0d00", borderBottom: "3px solid #000" }}>
          <h2 className="font-pixel text-white" style={{ fontSize: "9px" }}>📋 POOL INSTELLINGEN</h2>
          <p className="mt-1 font-pixel" style={{ fontSize: "7px", color: "#FF6200" }}>
            Poolbericht — zichtbaar voor alle leden (inzet, afspraken, regels)
          </p>
        </div>
        <div className="p-5">
          <PoolSettingsForm poolId={poolId} currentDescription={pool.description ?? ""} />
        </div>
      </div>

      {/* Leden beheren */}
      <div className="pixel-card overflow-hidden mb-6">
        <div className="px-5 py-3" style={{ background: "#0a1f3d", borderBottom: "3px solid #000" }}>
          <h2 className="font-pixel text-white" style={{ fontSize: "9px" }}>
            👥 LEDEN ({members.length})
          </h2>
          <p className="mt-1 font-pixel" style={{ fontSize: "7px", color: "#4499ff" }}>
            Beheer wie lid of beheerder is. Nodig meer mensen uit via de uitnodigingscode.
          </p>
        </div>

        {/* Uitnodigingscode banner */}
        <div className="px-5 py-3 flex items-center gap-3 flex-wrap" style={{ background: "#0d1a30", borderBottom: "2px solid var(--c-border)" }}>
          <span className="font-pixel" style={{ fontSize: "7px", color: "#4499ff" }}>UITNODIGINGSCODE:</span>
          <span
            className="font-pixel tracking-widest px-3 py-1"
            style={{ background: "#FFD700", color: "#000", border: "2px solid #000", boxShadow: "2px 2px 0 #000", fontSize: "11px" }}
          >
            {pool.inviteCode}
          </span>
          <span className="font-pixel" style={{ fontSize: "7px", color: "var(--c-text-4)" }}>
            Deel deze code met vrienden, familie, collega&apos;s
          </span>
        </div>

        <div>
          {members.map((m) => (
            <MemberManageRow
              key={m.userId}
              poolId={poolId}
              userId={m.userId}
              name={m.user.name}
              role={m.role}
              isMe={m.userId === session.user.id}
            />
          ))}
        </div>

        {members.length === 1 && (
          <div className="px-5 py-4 text-center" style={{ background: "var(--c-surface-deep)", borderTop: "2px solid var(--c-border)" }}>
            <p className="font-pixel" style={{ fontSize: "7px", color: "var(--c-text-4)" }}>
              Je bent voorlopig de enige. Deel de code om vrienden, familie of collega&apos;s uit te nodigen!
            </p>
          </div>
        )}
      </div>

      {/* Huidige vragen */}
      <div className="pixel-card overflow-hidden mb-6">
        <div className="px-5 py-3" style={{ background: "#0a3d1f", borderBottom: "3px solid #000" }}>
          <h2 className="font-pixel text-white" style={{ fontSize: "9px" }}>
            📋 BONUSVRAGEN IN DEZE POOL ({questions.length})
          </h2>
        </div>

        {questions.length === 0 ? (
          <div className="p-6 text-center">
            <p className="font-pixel" style={{ fontSize: "8px", color: "var(--c-text-4)" }}>
              Nog geen vragen toegevoegd. Kies hieronder uit de bibliotheek of maak een eigen vraag.
            </p>
          </div>
        ) : (
          <div>
            {Array.from(byCategory.entries()).map(([cat, qs]) => (
              <div key={cat}>
                <div
                  className="px-5 py-2"
                  style={{ background: "var(--c-surface-deep)", borderBottom: "1px solid var(--c-border)" }}
                >
                  <span className="font-pixel" style={{ fontSize: "7px", color: "var(--c-text-3)" }}>
                    {cat.toUpperCase()}
                  </span>
                </div>
                {qs.map((q) => (
                  <div
                    key={q.id}
                    className="px-5 py-3"
                    style={{ borderBottom: "1px solid var(--c-border)" }}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex-1">
                        <span
                          className="font-pixel mr-2 px-1.5 py-0.5"
                          style={{
                            fontSize: "6px",
                            background: "#0a3d1f",
                            color: "#4af56a",
                            border: "1px solid #0a5a2a",
                          }}
                        >
                          {TYPE_LABELS[q.type]}
                        </span>
                        <span style={{ color: "var(--c-text)", fontSize: "9px" }}>{q.question}</span>
                      </div>
                      <span className="font-pixel shrink-0" style={{ fontSize: "7px", color: "var(--c-text-4)" }}>
                        {q._count.answers} antw.
                      </span>
                    </div>
                    {q.description && (
                      <p className="font-pixel mb-2" style={{ fontSize: "6px", color: "var(--c-text-4)", lineHeight: "1.8" }}>
                        {q.description}
                      </p>
                    )}
                    <SetAnswerForm questionId={q.id} currentAnswer={q.correctAnswer} type={q.type} />
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Vragenbibliotheek */}
      <div className="pixel-card overflow-hidden mb-6">
        <div className="px-5 py-3" style={{ background: "#0a3d1f", borderBottom: "3px solid #000" }}>
          <h2 className="font-pixel text-white" style={{ fontSize: "9px" }}>📚 VRAGENBIBLIOTHEEK</h2>
          <p className="mt-1 font-pixel" style={{ fontSize: "7px", color: "#4a7a4a" }}>
            Klik op een categorie om vragen te bekijken. Voeg ze individueel of per categorie toe.
          </p>
        </div>
        <div className="p-4">
          <TemplateLibrary poolId={poolId} existingQuestions={existingQuestionTexts} />
        </div>
      </div>

      {/* Eigen vraag toevoegen */}
      <div className="pixel-card overflow-hidden">
        <div className="px-5 py-3" style={{ background: "#0a3d1f", borderBottom: "3px solid #000" }}>
          <h2 className="font-pixel text-white" style={{ fontSize: "9px" }}>✏ EIGEN VRAAG TOEVOEGEN</h2>
          <p className="mt-1 font-pixel" style={{ fontSize: "7px", color: "#4a7a4a" }}>
            Maak een vraag die niet in de bibliotheek staat
          </p>
        </div>
        <div className="p-5">
          <AddQuestionForm poolId={poolId} />
        </div>
      </div>
    </div>
  )
}
