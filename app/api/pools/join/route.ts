import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 })

  const { inviteCode } = await req.json()
  if (!inviteCode?.trim()) return NextResponse.json({ error: "Voer een uitnodigingscode in" }, { status: 400 })

  const pool = await prisma.pool.findUnique({ where: { inviteCode: inviteCode.trim().toUpperCase() } })
  if (!pool) return NextResponse.json({ error: "Onbekende uitnodigingscode" }, { status: 404 })

  const existing = await prisma.poolMembership.findUnique({
    where: { userId_poolId: { userId: session.user.id, poolId: pool.id } },
  })
  if (existing) return NextResponse.json({ error: "Je bent al lid van deze pool" }, { status: 409 })

  await prisma.poolMembership.create({
    data: { userId: session.user.id, poolId: pool.id, role: "MEMBER" },
  })

  return NextResponse.json({ poolId: pool.id })
}
