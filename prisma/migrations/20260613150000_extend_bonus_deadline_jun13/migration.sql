-- Nogmaals coulance: verleng de bonusvraag-deadline naar 13 juni 2026 21:00
-- CEST (= 19:00 UTC). De opgeslagen deadlines schuiven mee.
UPDATE "BonusQuestion"
SET "deadline" = '2026-06-13T19:00:00Z'
WHERE "deadline" IS NULL OR "deadline" < '2026-06-13T19:00:00Z';
