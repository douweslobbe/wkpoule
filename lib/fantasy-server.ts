import { getRoundDeadline, type SurvivorRound } from "./survivor"
import { TRANSFER_ROUNDS, type FantasyRound } from "./fantasy"

/**
 * De eerstvolgende ronde met een open transfervenster (2 transfers), of null
 * wanneer er geen venster open is (vóór het toernooi, of vanaf de halve finale).
 * Het venster voor een ronde sluit bij de eerste wedstrijd van die ronde.
 */
export async function getCurrentTransferRound(): Promise<{ round: FantasyRound; deadline: Date } | null> {
  const now = new Date()
  for (const round of TRANSFER_ROUNDS) {
    const deadline = await getRoundDeadline(round as SurvivorRound)
    if (deadline && now < deadline) return { round, deadline }
  }
  return null
}
