import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sendPasswordResetEmail } from "@/lib/email"
import { nanoid } from "nanoid"

export async function POST(req: NextRequest) {
  const { email } = await req.json()

  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "Ongeldig e-mailadres" }, { status: 400 })
  }

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } })

  // Altijd dezelfde response teruggeven (voorkomt user-enumeration)
  const ok = NextResponse.json({ ok: true })

  if (!user) return ok

  // Verwijder oude tokens voor deze gebruiker
  await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } })

  // Maak nieuw token aan (1 uur geldig)
  const token = nanoid(48)
  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      token,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    },
  })

  const baseUrl = process.env.NEXTAUTH_URL ?? "https://wkpool2026.wesl.nl"
  const resetUrl = `${baseUrl}/reset-password/${token}`

  try {
    await sendPasswordResetEmail(user.email, user.name, resetUrl)
  } catch (err) {
    console.error("[forgot-password] email error", err)
    // Geen fout tonen aan gebruiker — link is aangemaakt
  }

  return ok
}
