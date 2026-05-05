import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function POST(req: NextRequest) {
  const { token, password } = await req.json()

  if (!token || !password || password.length < 6) {
    return NextResponse.json({ error: "Ongeldig verzoek" }, { status: 400 })
  }

  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token },
    include: { user: true },
  })

  if (!resetToken) {
    return NextResponse.json({ error: "Ongeldige of verlopen link" }, { status: 400 })
  }
  if (resetToken.usedAt) {
    return NextResponse.json({ error: "Deze link is al gebruikt" }, { status: 400 })
  }
  if (resetToken.expiresAt < new Date()) {
    return NextResponse.json({ error: "Deze link is verlopen" }, { status: 400 })
  }

  const passwordHash = await bcrypt.hash(password, 12)

  await prisma.$transaction([
    prisma.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash },
    }),
    prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { usedAt: new Date() },
    }),
  ])

  return NextResponse.json({ ok: true })
}
