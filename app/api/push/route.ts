import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"

// POST /api/push — sla een subscription op
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const endpoint: string = body?.endpoint
  const p256dh: string = body?.keys?.p256dh
  const authKey: string = body?.keys?.auth

  if (!endpoint || !p256dh || !authKey) {
    return NextResponse.json({ error: "Invalid subscription data" }, { status: 400 })
  }

  await prisma.pushSubscription.upsert({
    where: { endpoint },
    create: { userId: session.user.id, endpoint, p256dh, auth: authKey },
    update: { p256dh, auth: authKey, userId: session.user.id },
  })

  return NextResponse.json({ success: true })
}

// DELETE /api/push — verwijder een subscription
export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const endpoint: string = body?.endpoint
  if (!endpoint) return NextResponse.json({ error: "Missing endpoint" }, { status: 400 })

  await prisma.pushSubscription.deleteMany({
    where: { endpoint, userId: session.user.id },
  })

  return NextResponse.json({ success: true })
}
