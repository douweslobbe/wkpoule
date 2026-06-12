-- Extra coulance: verleng de bonusvraag-deadline naar 12 juni 2026 23:59 CEST
-- (= 21:59 UTC). De opgeslagen deadlines stonden op 21:00; die schuiven mee.
UPDATE "BonusQuestion"
SET "deadline" = '2026-06-12T21:59:00Z'
WHERE "deadline" IS NULL OR "deadline" < '2026-06-12T21:59:00Z';
