import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { runMatchReminderEmails } from "@/lib/reminders"

export async function POST() {
  const session = await auth()
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Geen toegang" }, { status: 403 })
  }

  const result = await runMatchReminderEmails()
  const message =
    result.matches === 0 ? "Geen wedstrijden in het 2u-venster" : undefined

  return NextResponse.json({ ok: true, ...result, message })
}
