import { NextRequest, NextResponse } from "next/server"
import { syncMatchesViaCron } from "@/lib/actions"

// Geautomatiseerde synchronisatie — roep periodiek aan (bijv. elke 15 min) met:
//   POST /api/cron/sync   Authorization: Bearer <CRON_SECRET>
//
// Haalt uitslagen op van football-data.org, herberekent punten, werkt de
// standen bij, post speeldagoverzichten en stuurt push-herinneringen.
export async function POST(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? ""

  const result = await syncMatchesViaCron(token)

  if (!result.ok) {
    const status = result.error === "Unauthorized" ? 401 : 500
    return NextResponse.json(result, { status })
  }

  console.log(`[cron/sync] ${result.synced} wedstrijd(en) gesynct, ${result.updated} nieuw afgerond`)
  return NextResponse.json(result)
}
