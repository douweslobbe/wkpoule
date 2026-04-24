import { NextRequest, NextResponse } from "next/server"
import { nanoid } from "nanoid"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 })

  const { name } = await req.json()
  if (!name?.trim()) return NextResponse.json({ error: "Geef de pool een naam" }, { status: 400 })

  const inviteCode = nanoid(8).toUpperCase()

  const pool = await prisma.pool.create({
    data: {
      name: name.trim(),
      inviteCode,
      createdById: session.user.id,
      memberships: {
        create: { userId: session.user.id, role: "ADMIN" },
      },
    },
  })

  return NextResponse.json({ id: pool.id, inviteCode: pool.inviteCode })
}
