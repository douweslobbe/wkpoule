import { redirect } from "next/navigation"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { FANTASY_DEADLINE } from "@/lib/fantasy"
import { PlayerPicker } from "./PlayerPicker"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Elftal samenstellen — WK Manager 2026",
}

export default async function FantasySelectPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  // Controleer deadline
  if (new Date() > FANTASY_DEADLINE) {
    redirect("/fantasy")
  }

  // Controleer of gebruiker al een team heeft
  const existing = await prisma.fantasyTeam.findUnique({
    where: { userId: session.user.id },
  })
  if (existing) redirect("/fantasy")

  // Alle actieve spelers met team-info
  const players = await prisma.player.findMany({
    where: { isActive: true },
    include: {
      team: {
        select: { id: true, code: true, nameNl: true, name: true, flagUrl: true },
      },
    },
    orderBy: [{ team: { code: "asc" } }, { position: "asc" }, { shirtNumber: "asc" }],
  })

  return (
    <div>
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <Link href="/fantasy" className="font-pixel" style={{ fontSize: "7px", color: "#7070a0" }}>
          ◄ WK MANAGER
        </Link>
        <h1 className="font-pixel text-white" style={{ fontSize: "10px" }}>
          🎮 ELFTAL SAMENSTELLEN
        </h1>
      </div>

      <PlayerPicker players={players} />
    </div>
  )
}
