import { redirect } from "next/navigation"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { SURVIVOR_ROUNDS, ROUND_LABELS } from "@/lib/survivor"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "De Megalomane Ranglijst — WK Pool 2026" }

export default async function RanglijstPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const memberships = await prisma.poolMembership.findMany({
    where: { userId: session.user.id },
    include: {
      pool: {
        include: {
          _count: { select: { memberships: true } },
        },
      },
    },
    orderBy: { joinedAt: "asc" },
  })

  // Per pool: leaderboard entries + naam-map via members
  const poolIds = memberships.map((m) => m.pool.id)

  const [allEntries, allMembers] = await Promise.all([
    prisma.leaderboardEntry.findMany({
      where: { poolId: { in: poolIds } },
      orderBy: { totalPoints: "desc" },
    }),
    prisma.poolMembership.findMany({
      where: { poolId: { in: poolIds } },
      include: { user: { select: { id: true, name: true } } },
    }),
  ])

  // Naam-map: poolId + userId → name
  const nameMap = new Map<string, string>()
  for (const m of allMembers) {
    nameMap.set(`${m.poolId}:${m.userId}`, m.user.name ?? "—")
  }

  // ─── Globale data: combi-ranglijst (alle pools) + per-modus standen ──────────
  const [allPools, allLbEntries, allBonusQuestions, allUsers, survivorEntries, fantasyTeams] = await Promise.all([
    prisma.pool.findMany({ select: { id: true, name: true } }),
    prisma.leaderboardEntry.findMany({ select: { userId: true, poolId: true, matchPoints: true, championPoints: true } }),
    prisma.bonusQuestion.findMany({ select: { id: true, poolId: true, question: true } }),
    prisma.user.findMany({ select: { id: true, name: true } }),
    prisma.survivorEntry.findMany({ include: { user: { select: { id: true, name: true } } } }),
    prisma.fantasyTeam.findMany({ orderBy: { totalPoints: "desc" }, take: 10, select: { id: true, nickname: true, totalPoints: true, userId: true } }),
  ])
  const userName = new Map(allUsers.map((u) => [u.id, u.name]))
  const poolNameMap = new Map(allPools.map((p) => [p.id, p.name]))

  // Eerlijke meetlat: wedstrijdpunten + kampioen + alléén bonusvragen die in
  // élke pool met vragen identiek zijn (gemeenschappelijke meetlat).
  const textsByPool = new Map<string, Set<string>>()
  for (const q of allBonusQuestions) {
    const t = q.question.trim().toLowerCase()
    if (!textsByPool.has(q.poolId)) textsByPool.set(q.poolId, new Set())
    textsByPool.get(q.poolId)!.add(t)
  }
  const poolTextSets: Set<string>[] = Array.from(textsByPool.values())
  let commonArr: string[] = poolTextSets.length > 0 ? Array.from(poolTextSets[0]) : []
  for (let i = 1; i < poolTextSets.length; i++) {
    const s = poolTextSets[i]
    commonArr = commonArr.filter((t) => s.has(t))
  }
  const commonSet: Set<string> = new Set<string>(commonArr)
  const commonQIds = new Set(allBonusQuestions.filter((q) => commonSet.has(q.question.trim().toLowerCase())).map((q) => q.id))
  const qToPool = new Map(allBonusQuestions.map((q) => [q.id, q.poolId]))

  const commonAnswers = commonQIds.size > 0
    ? await prisma.bonusAnswer.findMany({ where: { questionId: { in: [...commonQIds] }, pointsAwarded: { not: null } }, select: { userId: true, questionId: true, pointsAwarded: true } })
    : []
  const commonBonus = new Map<string, number>()
  for (const a of commonAnswers) {
    const key = `${a.userId}:${qToPool.get(a.questionId)}`
    commonBonus.set(key, (commonBonus.get(key) ?? 0) + (a.pointsAwarded ?? 0))
  }

  const combined = allLbEntries
    .map((e) => ({
      userId: e.userId,
      poolId: e.poolId,
      score: e.matchPoints + e.championPoints + (commonBonus.get(`${e.userId}:${e.poolId}`) ?? 0),
    }))
    .filter((e) => e.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 30)

  // Per-modus standen (globaal)
  const ROUND_IDX = Object.fromEntries(SURVIVOR_ROUNDS.map((r, i) => [r, i]))
  const survHC = [...survivorEntries]
    .sort((a, b) => {
      if (a.hardcoreAlive !== b.hardcoreAlive) return a.hardcoreAlive ? -1 : 1
      const ai = a.hardcoreElimRound ? ROUND_IDX[a.hardcoreElimRound] ?? -1 : 99
      const bi = b.hardcoreElimRound ? ROUND_IDX[b.hardcoreElimRound] ?? -1 : 99
      return bi - ai
    })
    .slice(0, 10)
  const survHS = [...survivorEntries].sort((a, b) => b.highscoreTotal - a.highscoreTotal).slice(0, 10)

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <Link href="/arena" className="font-pixel" style={{ fontSize: "7px", color: "#7070a0" }}>
          ◄ DE ARENA
        </Link>
        <h1 className="font-pixel text-white" style={{ fontSize: "10px" }}>
          📊 DE MEGALOMANE RANGLIJST
        </h1>
      </div>

      <div className="space-y-5">
        {memberships.map(({ pool }) => {
          const poolEntries = allEntries
            .filter((e) => e.poolId === pool.id)
            .sort((a, b) => b.totalPoints - a.totalPoints)

          const myRank = poolEntries.findIndex((e) => e.userId === session.user.id) + 1

          return (
            <div key={pool.id} className="pixel-card overflow-hidden">
              <div
                className="px-5 py-3 flex items-center justify-between"
                style={{ background: "#0a1220", borderBottom: "3px solid #000" }}
              >
                <h2 className="font-pixel text-white" style={{ fontSize: "9px" }}>
                  {pool.name.toUpperCase()}
                </h2>
                {myRank > 0 && (
                  <span className="font-pixel" style={{
                    fontSize: "8px",
                    color: myRank === 1 ? "#FFD700" : myRank <= 3 ? "#FF6200" : "var(--c-text-3)",
                  }}>
                    Jij: #{myRank}/{pool._count.memberships}
                  </span>
                )}
              </div>

              {poolEntries.length === 0 ? (
                <div className="px-5 py-4">
                  <p className="font-pixel" style={{ fontSize: "7px", color: "var(--c-text-5)" }}>
                    Nog geen punten gescoord.
                  </p>
                </div>
              ) : (
                <div>
                  {poolEntries.slice(0, 10).map((entry, i) => {
                    const isMe = entry.userId === session.user.id
                    const rank = i + 1
                    const name = nameMap.get(`${pool.id}:${entry.userId}`) ?? "—"
                    return (
                      <div
                        key={entry.id}
                        className="flex items-center gap-3 px-5 py-2.5"
                        style={{
                          borderBottom: "1px solid var(--c-border)",
                          background: isMe ? "#0d1a0d" : "transparent",
                          borderLeft: isMe ? "3px solid #4af56a" : "3px solid transparent",
                        }}
                      >
                        <span className="font-pixel shrink-0" style={{
                          fontSize: "9px", minWidth: "2rem",
                          color: rank === 1 ? "#FFD700" : rank === 2 ? "#aaaaaa" : rank === 3 ? "#cd7f32" : "var(--c-text-5)",
                        }}>
                          {rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : `#${rank}`}
                        </span>
                        <span className="flex-1 font-pixel truncate" style={{
                          fontSize: "8px",
                          color: isMe ? "#4af56a" : "var(--c-text-2)",
                          fontWeight: isMe ? "bold" : "normal",
                        }}>
                          {name}{isMe ? " ◄" : ""}
                        </span>
                        <span className="font-pixel shrink-0" style={{ fontSize: "9px", color: "#FFD700" }}>
                          {entry.totalPoints} pt
                        </span>
                      </div>
                    )
                  })}
                  {poolEntries.length > 10 && (
                    <div className="px-5 py-2 text-right" style={{ borderTop: "1px solid var(--c-border)", background: "var(--c-surface-deep)" }}>
                      <Link href={`/pools/${pool.id}`} className="font-pixel" style={{ fontSize: "7px", color: "#FF6200" }}>
                        Volledige ranglijst →
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}

        {memberships.length === 0 && (
          <div className="pixel-card p-10 text-center">
            <p className="font-pixel" style={{ fontSize: "8px", color: "var(--c-text-4)" }}>
              Geen pools gevonden.{" "}
              <Link href="/arena" style={{ color: "#FF6200" }}>Ga naar De Arena →</Link>
            </p>
          </div>
        )}

        {/* Gecombineerde ranglijst over alle pools */}
        <div className="pixel-card overflow-hidden">
          <div className="px-5 py-3" style={{ background: "#2a1500", borderBottom: "3px solid #000" }}>
            <h2 className="font-pixel text-white" style={{ fontSize: "9px" }}>🌍 ALLE POOLS GECOMBINEERD</h2>
            <p className="font-pixel mt-1" style={{ fontSize: "6px", color: "#FFD700", lineHeight: "1.8" }}>
              Eerlijke meetlat: wedstrijden + kampioen + de bonusvragen die in élke pool gelijk waren. Wie in
              meerdere pools zit, komt vaker voor — de échte kenner staat bovenaan.
            </p>
          </div>
          {combined.length === 0 ? (
            <p className="p-5 text-center font-pixel" style={{ fontSize: "7px", color: "var(--c-text-4)" }}>Nog geen punten gescoord.</p>
          ) : (
            combined.map((e, i) => {
              const isMe = e.userId === session.user.id
              const rank = i + 1
              return (
                <div key={`${e.userId}:${e.poolId}`} className="flex items-center gap-3 px-5 py-2.5"
                  style={{ borderBottom: "1px solid var(--c-border)", background: isMe ? "#0d1a0d" : undefined, borderLeft: isMe ? "3px solid #4af56a" : "3px solid transparent" }}>
                  <span className="font-pixel shrink-0" style={{ fontSize: "9px", minWidth: "2rem", color: rank === 1 ? "#FFD700" : rank === 2 ? "#aaaaaa" : rank === 3 ? "#cd7f32" : "var(--c-text-5)" }}>
                    {rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : `#${rank}`}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="font-pixel truncate" style={{ fontSize: "8px", color: isMe ? "#4af56a" : "var(--c-text-2)", fontWeight: isMe ? "bold" : "normal" }}>
                      {userName.get(e.userId) ?? "—"}{isMe ? " ◄" : ""}
                    </div>
                    <div className="font-pixel truncate" style={{ fontSize: "6px", color: "var(--c-text-5)" }}>{poolNameMap.get(e.poolId) ?? ""}</div>
                  </div>
                  <span className="font-pixel shrink-0" style={{ fontSize: "9px", color: "#FFD700" }}>{e.score} pt</span>
                </div>
              )
            })
          )}
        </div>

        {/* Per modus */}
        <div className="grid sm:grid-cols-2 gap-5">
          {/* Survivor HARDCORE */}
          <div className="pixel-card overflow-hidden">
            <div className="px-5 py-3" style={{ background: "#1a0000", borderBottom: "3px solid #000" }}>
              <h2 className="font-pixel text-white" style={{ fontSize: "8px" }}>💀 SURVIVOR — HARDCORE</h2>
            </div>
            {survHC.length === 0 ? (
              <p className="p-4 text-center font-pixel" style={{ fontSize: "7px", color: "var(--c-text-4)" }}>Nog geen deelnemers.</p>
            ) : survHC.map((e, i) => {
              const isMe = e.userId === session.user.id
              return (
                <div key={e.id} className="flex items-center gap-2 px-4 py-2" style={{ borderBottom: "1px solid var(--c-border)", background: isMe ? "#0d1a0d" : undefined }}>
                  <span className="font-pixel shrink-0" style={{ fontSize: "7px", color: "var(--c-text-5)", minWidth: "16px" }}>{i + 1}.</span>
                  <span className="font-pixel flex-1 truncate" style={{ fontSize: "7px", color: isMe ? "#4af56a" : "var(--c-text-2)" }}>{e.user.name}</span>
                  {e.hardcoreAlive ? (
                    <span className="font-pixel shrink-0" style={{ fontSize: "6px", color: "#4af56a" }}>✓ ALIVE</span>
                  ) : (
                    <span className="font-pixel shrink-0" style={{ fontSize: "5px", color: "#ff4444" }}>💀 {e.hardcoreElimRound ? (ROUND_LABELS[e.hardcoreElimRound as keyof typeof ROUND_LABELS] ?? e.hardcoreElimRound) : "uit"}</span>
                  )}
                </div>
              )
            })}
          </div>

          {/* Survivor HIGHSCORE */}
          <div className="pixel-card overflow-hidden">
            <div className="px-5 py-3" style={{ background: "#1a1500", borderBottom: "3px solid #000" }}>
              <h2 className="font-pixel text-white" style={{ fontSize: "8px" }}>📊 SURVIVOR — HIGHSCORE</h2>
            </div>
            {survHS.length === 0 ? (
              <p className="p-4 text-center font-pixel" style={{ fontSize: "7px", color: "var(--c-text-4)" }}>Nog geen deelnemers.</p>
            ) : survHS.map((e, i) => {
              const isMe = e.userId === session.user.id
              return (
                <div key={e.id} className="flex items-center gap-2 px-4 py-2" style={{ borderBottom: "1px solid var(--c-border)", background: isMe ? "#0d1a0d" : undefined }}>
                  <span className="font-pixel shrink-0" style={{ fontSize: "7px", color: "var(--c-text-5)", minWidth: "16px" }}>{i + 1}.</span>
                  <span className="font-pixel flex-1 truncate" style={{ fontSize: "7px", color: isMe ? "#4af56a" : "var(--c-text-2)" }}>{e.user.name}</span>
                  <span className="font-pixel shrink-0" style={{ fontSize: "7px", color: e.highscoreTotal > 0 ? "#4af56a" : e.highscoreTotal < 0 ? "#ff4444" : "var(--c-text-3)" }}>
                    {e.highscoreTotal > 0 ? "+" : ""}{e.highscoreTotal} pt
                  </span>
                </div>
              )
            })}
          </div>

          {/* WK Manager */}
          <div className="pixel-card overflow-hidden sm:col-span-2">
            <div className="px-5 py-3" style={{ background: "#0a2a0a", borderBottom: "3px solid #000" }}>
              <h2 className="font-pixel text-white" style={{ fontSize: "8px" }}>🎮 WK MANAGER</h2>
            </div>
            {fantasyTeams.length === 0 ? (
              <p className="p-4 text-center font-pixel" style={{ fontSize: "7px", color: "var(--c-text-4)" }}>Nog geen teams.</p>
            ) : fantasyTeams.map((t, i) => {
              const isMe = t.userId === session.user.id
              return (
                <Link key={t.id} href={`/fantasy/team/${t.userId}`} className="flex items-center gap-2 px-4 py-2 transition-opacity hover:opacity-80" style={{ borderBottom: "1px solid var(--c-border)", background: isMe ? "#0d1a0d" : undefined }}>
                  <span className="font-pixel shrink-0" style={{ fontSize: "7px", color: i === 0 ? "#FFD700" : "var(--c-text-5)", minWidth: "16px" }}>{i + 1}.</span>
                  <span className="font-pixel flex-1 truncate" style={{ fontSize: "7px", color: isMe ? "#4af56a" : "var(--c-text-2)" }}>
                    {t.nickname} <span style={{ color: "var(--c-text-5)" }}>· {userName.get(t.userId) ?? "—"}</span>
                  </span>
                  <span className="font-pixel shrink-0" style={{ fontSize: "7px", color: "#FFD700" }}>{t.totalPoints} pt</span>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
