-- Coulance: verleng de bonusvraag-deadline naar 12 juni 2026 21:00 CEST
-- (= 19:00 UTC) voor iedereen, voor alle pools. De opgeslagen deadline per
-- vraag stond nog op de oude toernooistart (11 juni 22:00); die wordt hiermee
-- opgerekt zodat antwoorden weer ingediend kunnen worden tot vanavond.
UPDATE "BonusQuestion"
SET "deadline" = '2026-06-12T19:00:00Z'
WHERE "deadline" IS NULL OR "deadline" < '2026-06-12T19:00:00Z';
