import { redirect, notFound } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { BonusQuestionBlock } from "./BonusQuestionBlock"
import { QuestionStats } from "./QuestionStats"
import { ChampionForm } from "../champion/ChampionForm"
import { PixelFlag } from "@/components/PixelFlag"

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

  // Groepeer per categorie (val terug op type als er geen categorie is)
  const TYPE_FALLBACK: Record<string, string> = {
    OPEN: "Openvragen",
    ESTIMATION: "Schattingsvragen",
    STATEMENT: "Stellingen",
  }
  const categoryOrder: string[] = []
  const groups: Record<string, typeof questions> = {}
  for (const q of questions) {
    const key = q.category ?? TYPE_FALLBACK[q.type] ?? q.type
    if (!groups[key]) {
      groups[key] = []
      categoryOrder.push(key)
    }
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
      <div className="pixel-card p-4 mb-6" style={{ background: "#0d1a10", borderLeft: "4px solid #FFD700" }}>
        <p style={{ color: "var(--c-text-2)", fontSize: "8px", fontFamily: "var(--font-pixel), monospace", lineHeight: "2" }}>
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
          <p className="mt-1 font-pixel" style={{ fontSize: "7px", color: "#666644" }}>15 punten</p>
        </div>
        <div className="p-5">
          {locked ? (
            <div>
              {myPick && (
                <div className="flex items-center gap-3 mb-4 p-3" style={{ background: "#1e1200", border: "2px solid #FF6200", boxShadow: "2px 2px 0 #000" }}>
                  <span className="text-2xl">🔒</span>
                  <PixelFlag code={myPick.team.code} size="md" />
                  <span className="font-bold" style={{ color: "var(--c-text)" }}>{myPick.team.nameNl ?? myPick.team.name}</span>
                  {myPick.pointsAwarded !== null && (
                    <span className="ml-auto font-pixel" style={{ fontSize: "9px", color: myPick.pointsAwarded > 0 ? "#4af56a" : "var(--c-text-4)" }}>
                      {myPick.pointsAwarded > 0 ? `+${myPick.pointsAwarded}pt` : "0pt"}
                    </span>
                  )}
                </div>
              )}
              {poolChampionPicks.length > 0 && (
                <div className="space-y-1.5">
                  <p className="mb-2 font-pixel uppercase" style={{ fontSize: "7px", color: "var(--c-text-3)" }}>Alle picks:</p>
                  {poolChampionPicks.map((pick) => (
                    <div key={pick.id} className="flex items-center gap-2 py-1.5" style={{ borderBottom: "1px solid var(--c-border)", fontSize: "8px", fontFamily: "var(--font-pixel), monospace" }}>
                      <PixelFlag code={pick.team.code} size="sm" />
                      <span className="flex-1" style={{ color: "var(--c-text-nav)" }}>{pick.user.name}</span>
                      <span className="font-semibold" style={{ color: "var(--c-text)" }}>{pick.team.nameNl ?? pick.team.name}</span>
                      {pick.pointsAwarded !== null && (
                        <span className="font-pixel ml-2" style={{ fontSize: "7px", color: pick.pointsAwarded > 0 ? "#4af56a" : "var(--c-text-4)" }}>
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
            <div className="mt-5 pt-4" style={{ borderTop: "2px solid var(--c-border)" }}>
              <p className="mb-3 font-pixel uppercase" style={{ fontSize: "7px", color: "var(--c-text-3)" }}>
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
                        <span className="absolute inset-0 flex items-center px-2 text-xs font-bold" style={{ color: "var(--c-text)" }}>
                          {info.teamName}
                        </span>
                      </div>
                      <span className="text-xs font-bold w-8 text-right" style={{ color: "var(--c-text-2)" }}>{info.count}×</span>
                      {isMyPick && (
                        <span className="font-pixel" style={{ color: "#FF6200", fontSize: "7px" }}>◄ JIJ</span>
                      )}
                    </div>
                  )
                })}
              </div>
              {!locked && myPick && (
                <p className="text-xs mt-2 italic" style={{ color: "var(--c-text-4)" }}>
                  Tip: anderen zien jouw keuze pas na de deadline.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bonus questions – gegroepeerd per categorie */}
      {categoryOrder.length === 0 ? (
        <div className="pixel-card p-8 text-center">
          <p className="font-pixel" style={{ fontSize: "8px", color: "var(--c-text-4)" }}>
            De pool-admin heeft nog geen bonusvragen toegevoegd.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {categoryOrder.map((cat) => {
            const qs = groups[cat]
            if (!qs?.length) return null
            // Detecteer type voor de subtitle
            const firstType = qs[0].type
            const subtitle =
              firstType === "ESTIMATION"
                ? "7 punten · top 20% dichtst bij het juiste antwoord wint"
                : firstType === "STATEMENT"
                ? "7 punten · kies Eens of Oneens"
                : "7 punten · admin bepaalt het correcte antwoord"
            return (
              <div key={cat} className="pixel-card overflow-hidden">
                <div className="px-5 py-3" style={{ background: "#0a3d1f", borderBottom: "3px solid #000" }}>
                  <h2 className="font-pixel text-white" style={{ fontSize: "9px" }}>{cat.toUpperCase()}</h2>
                  <p className="mt-1 font-pixel" style={{ fontSize: "7px", color: "#4a7a4a" }}>
                    {subtitle}
                  </p>
                </div>
                <div>
                  {qs.map((q) => {
                    const ans = answerMap.get(q.id)
                    const deadline = q.deadline ?? TOURNAMENT_START
                    const qLocked = now > deadline
                    return (
                      <div key={q.id} className="px-5 py-4" style={{ borderBottom: "2px solid var(--c-border)" }}>
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
      )}
    </div>
  )
}
