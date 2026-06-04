import { NextRequest, NextResponse } from "next/server"
import { runMatchReminderEmails } from "@/lib/reminders"

// Beveiligd met CRON_SECRET — roep aan met:
// Authorization: Bearer <CRON_SECRET>
export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization")
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const result = await runMatchReminderEmails()
  return NextResponse.json({ ok: true, ...result })
}
