-- Verwijder limietkolommen voor bonusvragen uit de Pool-tabel
ALTER TABLE "Pool" DROP COLUMN IF EXISTS "maxQuestionsTotal";
ALTER TABLE "Pool" DROP COLUMN IF EXISTS "maxQuestionsOpen";
ALTER TABLE "Pool" DROP COLUMN IF EXISTS "maxQuestionsEst";
ALTER TABLE "Pool" DROP COLUMN IF EXISTS "maxQuestionsStmt";
