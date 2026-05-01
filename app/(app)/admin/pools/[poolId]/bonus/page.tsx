import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { SetAnswerForm } from "./SetAnswerForm"
import { AddQuestionForm } from "./AddQuestionForm"
import { TemplateLibrary } from "./TemplateLibrary"
import { DeleteQuestionButton } from "./DeleteQuestionButton"
import { PoolSettingsForm } from "./PoolSettingsForm"
import { PoolMaxQuestionsForm } from "./PoolMaxQuestionsForm"
import { MemberManageRow } from "./MemberManageRow"
import { DeletePoolButton } from "./DeletePoolButton"
import { CopyButton } from "@/components/CopyButton"
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

  // Aantallen per type (voor limieten-UI)
  const questionCountsByType = questions.reduce(
    (acc, q) => { acc[q.type] = (acc[q.type] ?? 0) + 1; return acc },
    {} as Record<string, number>
  )
  const currentCounts = {
    total: questions.length,
    OPEN: questionCountsByType["OPEN"] ?? 0,
    ESTIMATION: questionCountsByType["ESTIMATION"] ?? 0,
    STATEMENT: questionCountsByType["STATEMENT"] ?? 0,
  }

  // Groepeer per categorie
  const byCategory = new Map<string, typeof questions>()
  for (const q of questions) {
    const cat = q.category ?? "Eigen vragen"
    const list = byCategory.get(cat) ?? []
    list.push(q)
    byCategory.set(cat, list)
  }

  const isGlobalAdmin = session.user.isAdmin
  const BONUS_EDIT_DEADLINE = new Date("2026-06-11T20:00:00Z")
  const canEdit = new Date() < BONUS_EDIT_DEADLINE
  const daysUntilDeadline = Math.ceil((BONUS_EDIT_DEADLINE.getTime() - Date.now()) / (1000 * 60 * 60 * 24))

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

      {/* Banner: eigen antwoorden invullen */}
      {canEdit && (
        <div
          className="flex items-center gap-3 justify-between flex-wrap mb-6 px-4 py-3"
          style={{ background: "#0a1f3d", border: "2px solid #1a3a6a", boxShadow: "2px 2px 0 #000" }}
        >
          <div>
            <p className="font-pixel" style={{ fontSize: "7px", color: "#4499ff" }}>
              💡 Je eigen antwoorden invullen doe je via de deelnemerspagina
            </p>
            <p className="font-pixel mt-0.5" style={{ fontSize: "6px", color: "var(--c-text-4)" }}>
              Als admin beheer je hier de vragen — maar je voorspellingen staan op een aparte pagina
            </p>
          </div>
          <Link
            href={`/pools/${poolId}/bonus`}
            className="font-pixel px-3 py-1.5 shrink-0 transition-all hover:opacity-80"
            style={{
              background: "#1a3a6a",
              color: "#4499ff",
              border: "2px solid #2a4a8a",
              boxShadow: "1px 1px 0 #000",
              fontSize: "7px",
              whiteSpace: "nowrap",
            }}
          >
            🏆 MIJN ANTWOORDEN →
          </Link>
        </div>
      )}

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

      {/* Max bonusvragen per type */}
      <div className="pixel-card overflow-hidden mb-6">
        <div className="px-5 py-3" style={{ background: "#0a1f3d", borderBottom: "3px solid #000" }}>
          <h2 className="font-pixel text-white" style={{ fontSize: "9px" }}>🎯 MAX BONUSVRAGEN</h2>
          <p className="mt-1 font-pixel" style={{ fontSize: "7px", color: "#4499ff" }}>
            Stel in hoeveel vragen er per type en totaal mogen worden toegevoegd
          </p>
        </div>
        <div className="p-5">
          <PoolMaxQuestionsForm
            poolId={poolId}
            maxQuestionsTotal={pool.maxQuestionsTotal}
            maxQuestionsOpen={pool.maxQuestionsOpen}
            maxQuestionsEst={pool.maxQuestionsEst}
            maxQuestionsStmt={pool.maxQuestionsStmt}
            currentCounts={currentCounts}
          />
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
          <CopyButton text={pool.inviteCode} label="KOPIEER CODE" />
          <CopyButton
            text={`https://wkpool2026.wesl.nl/pools/join?code=${pool.inviteCode}`}
            label="KOPIEER LINK"
          />
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
          {canEdit ? (
            <p className="mt-1 font-pixel" style={{ fontSize: "6px", color: daysUntilDeadline <= 7 ? "#FFD700" : "#4a7a4a" }}>
              {daysUntilDeadline <= 7
                ? `⚠ Nog ${daysUntilDeadline} dag${daysUntilDeadline === 1 ? "" : "en"} om vragen te wijzigen — deadline 11 jun 22:00`
                : `Vragen aanpassen kan tot 11 juni 2026, 22:00 · nog ${daysUntilDeadline} dagen`}
            </p>
          ) : (
            <p className="mt-1 font-pixel" style={{ fontSize: "6px", color: "#ff4444" }}>
              🔒 Toernooi gestart — vragen zijn vergrendeld
            </p>
          )}
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
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="font-pixel" style={{ fontSize: "7px", color: "var(--c-text-4)" }}>
                          {q._count.answers} antw.
                        </span>
                        {canEdit && (
                          <DeleteQuestionButton
                            questionId={q.id}
                            poolId={poolId}
                            answerCount={q._count.answers}
                          />
                        )}
                      </div>
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
          <TemplateLibrary
            poolId={poolId}
            existingQuestions={existingQuestionTexts}
            limits={{
              remainingTotal: Math.max(0, pool.maxQuestionsTotal - currentCounts.total),
              remaining: {
                OPEN: Math.max(0, pool.maxQuestionsOpen - currentCounts.OPEN),
                ESTIMATION: Math.max(0, pool.maxQuestionsEst - currentCounts.ESTIMATION),
                STATEMENT: Math.max(0, pool.maxQuestionsStmt - currentCounts.STATEMENT),
              },
            }}
          />
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

      {/* Danger zone */}
      <div className="pixel-card overflow-hidden mt-6" style={{ borderColor: "#550000" }}>
        <div className="px-5 py-3" style={{ background: "#1a0000", borderBottom: "3px solid #000" }}>
          <h2 className="font-pixel text-white" style={{ fontSize: "9px" }}>⚠ GEVAARLIJKE ZONE</h2>
          <p className="mt-1 font-pixel" style={{ fontSize: "7px", color: "#ff8888" }}>
            Onomkeerbare acties — wees voorzichtig
          </p>
        </div>
        <div className="p-5">
          <p className="font-pixel mb-1" style={{ fontSize: "8px", color: "var(--c-text-2)" }}>
            Pool verwijderen
          </p>
          <p className="font-pixel mb-3" style={{ fontSize: "7px", color: "var(--c-text-3)", lineHeight: "1.8" }}>
            Vraagt de globale beheerder om de pool definitief te verwijderen. Alle leden, bonusvragen en scores gaan verloren.
          </p>
          <DeletePoolButton poolId={poolId} poolName={pool.name} />
        </div>
      </div>
    </div>
  )
}
