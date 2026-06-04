-- Winnaar van de wedstrijd (incl. beslissing op strafschoppen in de knock-out).
-- Bron: football-data.org score.winner — HOME_TEAM | AWAY_TEAM | DRAW.
ALTER TABLE "Match" ADD COLUMN IF NOT EXISTS "winner" TEXT;
