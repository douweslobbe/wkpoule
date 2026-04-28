-- Per-pool predictions: add poolId to Prediction
-- Tournament hasn't started yet, so we can safely truncate existing test predictions.

-- 1. Clean up any existing predictions (no real data yet)
TRUNCATE "Prediction";

-- 2. Drop the old unique constraint
ALTER TABLE "Prediction" DROP CONSTRAINT IF EXISTS "Prediction_userId_matchId_key";

-- 3. Add poolId column (NOT NULL — safe after truncate)
ALTER TABLE "Prediction" ADD COLUMN "poolId" TEXT NOT NULL;

-- 4. Add foreign key to Pool
DO $$ BEGIN
  ALTER TABLE "Prediction" ADD CONSTRAINT "Prediction_poolId_fkey"
    FOREIGN KEY ("poolId") REFERENCES "Pool"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 5. New unique constraint: one prediction per user per match per pool
DO $$ BEGIN
  ALTER TABLE "Prediction" ADD CONSTRAINT "Prediction_userId_matchId_poolId_key"
    UNIQUE ("userId", "matchId", "poolId");
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 6. Index on poolId
CREATE INDEX IF NOT EXISTS "Prediction_poolId_idx" ON "Prediction"("poolId");

-- 7. Max question limits on Pool (with safe defaults)
ALTER TABLE "Pool" ADD COLUMN IF NOT EXISTS "maxQuestionsTotal" INTEGER NOT NULL DEFAULT 25;
ALTER TABLE "Pool" ADD COLUMN IF NOT EXISTS "maxQuestionsOpen"  INTEGER NOT NULL DEFAULT 10;
ALTER TABLE "Pool" ADD COLUMN IF NOT EXISTS "maxQuestionsEst"   INTEGER NOT NULL DEFAULT 5;
ALTER TABLE "Pool" ADD COLUMN IF NOT EXISTS "maxQuestionsStmt"  INTEGER NOT NULL DEFAULT 10;
