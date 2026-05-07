import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { sendWelcomeEmail } from "@/lib/email"

export async function POST(req: NextRequest) {
  const { name, email, password } = await req.json()

  if (!name || !email || !password) {
    return NextResponse.json({ error: "Vul alle velden in" }, { status: 400 })
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "Wachtwoord moet minimaal 6 tekens zijn" }, { status: 400 })
  }

  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
  if (existing) {
    return NextResponse.json({ error: "Dit e-mailadres is al in gebruik" }, { status: 409 })
  }

  const passwordHash = await bcrypt.hash(password, 12)
  const user = await prisma.user.create({
    data: { name, email: email.toLowerCase(), passwordHash },
  })

  // Welkomstmail — fire and forget
  sendWelcomeEmail(user.email, user.name).catch((err) =>
    console.error("[register] welkomstmail error:", err)
  )

  return NextResponse.json({ success: true })
}
