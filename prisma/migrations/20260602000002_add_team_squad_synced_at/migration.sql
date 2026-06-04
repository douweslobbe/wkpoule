-- Bijhouden wanneer de selectie (squad) van een team voor het laatst is
-- opgehaald van football-data.org, t.b.v. de batchgewijze selectie-sync.
ALTER TABLE "Team" ADD COLUMN IF NOT EXISTS "squadSyncedAt" TIMESTAMP(3);
