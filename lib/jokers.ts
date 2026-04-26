import { MatchStage } from "@prisma/client"

// Hoeveel jokers per fase
export const JOKER_QUOTA: Record<MatchStage, number> = {
  GROUP: 3,
  ROUND_OF_32: 1,
  ROUND_OF_16: 1,
  QUARTER_FINAL: 1,
  SEMI_FINAL: 0,
  THIRD_PLACE: 0,
  FINAL: 0,
}

export const STAGE_LABELS_NL: Record<MatchStage, string> = {
  GROUP: "Poulefase",
  ROUND_OF_32: "Ronde van 32",
  ROUND_OF_16: "Achtste finale",
  QUARTER_FINAL: "Kwartfinale",
  SEMI_FINAL: "Halve finale",
  THIRD_PLACE: "Derde plaats",
  FINAL: "Finale",
}

export function jokersAllowedInStage(stage: MatchStage): boolean {
  return JOKER_QUOTA[stage] > 0
}

export function remainingJokers(stage: MatchStage, usedCount: number): number {
  return Math.max(0, JOKER_QUOTA[stage] - usedCount)
}
