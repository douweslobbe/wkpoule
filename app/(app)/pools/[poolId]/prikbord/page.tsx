import { redirect, notFound } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { PoolSubNav } from "../PoolSubNav"
import { MessageForm } from "./MessageForm"
import { DeleteButton } from "./DeleteButton"
import { AutoRefresh } from "./AutoRefresh"
import { PrikbordSeenMarker } from "./PrikbordSeenMarker"
import { formatDistanceToNow } from "date-fns"
import { nl } from "date-fns/locale"
import { UserBadges } from "@/components/UserBadges"
import type { Metadata } from "next"

export async function generateMetadata({ params }: { params: Promise<{ poolId: string }> }): Promise<Metadata> {
  const { poolId } = await params
  const pool = await prisma.pool.findUnique({ where: { id: poolId }, select: { name: true } })
  return { title: pool ? `Prikbord · ${pool.name} — WK Pool 2026` : "Prikbord — WK Pool 2026" }
}

export default async function PrikbordPage({ params }: { params: Promise<{ poolId: string }> }) {
  const { poolId } = await params
  const session = await auth()
  if (!session?.user) redirect("/login")

  const membership = await prisma.poolMembership.findUnique({
    where: { userId_poolId: { userId: session.user.id, poolId } },
    include: { pool: true },
  })
  if (!membership) notFound()

  const messages = await prisma.poolMessage.findMany({
    where: { poolId },
    include: { user: { select: { id: true, name: true } } },
    orderBy: { createdAt: "asc" },
  })

  const latestMessage = messages[messages.length - 1]

  // Achievements + joker-gebruik per poolgenoot voor badges
  const allAchievements = await prisma.achievement.findMany({ where: { poolId } })
  const achievementsByUser = new Map<string, typeof allAchievements>()
  for (const a of allAchievements) {
    const list = achievementsByUser.get(a.userId) ?? []
    list.push(a)
    achievementsByUser.set(a.userId, list)
  }
  const memberIds = await prisma.poolMembership.findMany({ where: { poolId }, select: { userId: true } })
    .then((ms) => ms.map((m) => m.userId))
  const jokerUsage = await prisma.prediction.groupBy({
    by: ["userId"],
    where: { userId: { in: memberIds }, isJoker: true },
    _count: { id: true },
  })
  const jokerUsageMap = new Map(jokerUsage.map((j) => [j.userId, j._count.id]))

  return (
    <div>
      <AutoRefresh />
      <PrikbordSeenMarker poolId={poolId} />
      <PoolSubNav poolId={poolId} latestMessageAt={latestMessage?.createdAt.getTime()} />

      <div className="pixel-card overflow-hidden mb-5">
        <div className="px-5 py-3" style={{ background: "#0a3d1f", borderBottom: "3px solid #000" }}>
          <h2 className="font-pixel text-white" style={{ fontSize: "9px" }}>📌 PRIKBORD — {membership.pool.name.toUpperCase()}</h2>
          <p className="mt-1 font-pixel" style={{ fontSize: "7px", color: "#4af56a" }}>
            Praat met je poolgenoten over het WK
          </p>
        </div>

        {/* Berichten */}
        <div style={{ minHeight: "200px" }}>
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <p className="font-pixel" style={{ fontSize: "8px", color: "var(--c-text-4)" }}>
                Nog geen berichten. Wees de eerste!
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const isSystem = msg.isSystem
              const isMe = !isSystem && msg.userId === session.user.id
              const canDelete = !isSystem && (isMe || session.user.isAdmin)
              const timeAgo = formatDistanceToNow(new Date(msg.createdAt), {
                addSuffix: true,
                locale: nl,
              })

              return (
                <div
                  key={msg.id}
                  className="px-5 py-4"
                  style={{
                    borderBottom: "2px solid var(--c-border)",
                    background: isSystem ? "#0d1a10" : isMe ? "var(--c-surface-deep)" : "var(--c-surface-alt)",
                    borderLeft: isSystem ? "3px solid #FFD700" : isMe ? "3px solid #FF6200" : "3px solid transparent",
                  }}
                >
                  <div className="flex items-baseline gap-2 mb-1.5 flex-wrap">
                    <span
                      className="font-pixel"
                      style={{ fontSize: "7px", color: isSystem ? "#FFD700" : isMe ? "#FF6200" : "var(--c-text-2)" }}
                    >
                      {isSystem ? "🤖 POOL-BOT" : msg.user?.name ?? "Onbekend"}
                      {isMe && <span style={{ color: "#FF6200", opacity: 0.6 }}> ◄ jij</span>}
                    </span>
                    {!isSystem && msg.user?.id && (
                      <UserBadges
                        achievements={achievementsByUser.get(msg.user.id) ?? []}
                        jokerCount={jokerUsageMap.get(msg.user.id) ?? 0}
                        size="xs"
                        max={4}
                      />
                    )}
                    <span className="font-pixel" style={{ fontSize: "6px", color: "var(--c-text-4)" }}>
                      {timeAgo}
                    </span>
                    {canDelete && (
                      <span className="ml-auto">
                        <DeleteButton messageId={msg.id} />
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: "9px", color: "var(--c-text)", lineHeight: "1.8", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                    {msg.content}
                  </p>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Nieuw bericht */}
      <div className="pixel-card overflow-hidden">
        <div className="px-5 py-3" style={{ background: "#0a3d1f", borderBottom: "3px solid #000" }}>
          <h3 className="font-pixel text-white" style={{ fontSize: "8px" }}>✏ NIEUW BERICHT</h3>
        </div>
        <div className="p-5">
          <MessageForm poolId={poolId} />
        </div>
      </div>
    </div>
  )
}
