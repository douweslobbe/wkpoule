-- Verwijder limietkolommen voor bonusvragen uit de Pool-tabel.
-- LET OP: timestamp is bewust ná 20260601000001 (die deze kolommen toevoegt),
-- zodat op een verse database de DROP ná de ADD draait en er geen drift ontstaat.
ALTER TABLE "Pool" DROP COLUMN IF EXISTS "maxQuestionsTotal";
ALTER TABLE "Pool" DROP COLUMN IF EXISTS "maxQuestionsOpen";
ALTER TABLE "Pool" DROP COLUMN IF EXISTS "maxQuestionsEst";
ALTER TABLE "Pool" DROP COLUMN IF EXISTS "maxQuestionsStmt";
