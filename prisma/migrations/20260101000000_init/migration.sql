-- Initial schema baseline
-- Uses IF NOT EXISTS so it's safe to run against an already-initialised database.

-- Enums
DO $$ BEGIN
  CREATE TYPE "PoolRole" AS ENUM ('ADMIN', 'MEMBER');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "MatchStage" AS ENUM ('GROUP', 'ROUND_OF_32', 'ROUND_OF_16', 'QUARTER_FINAL', 'SEMI_FINAL', 'THIRD_PLACE', 'FINAL');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "MatchStatus" AS ENUM ('SCHEDULED', 'LIVE', 'FINISHED', 'POSTPONED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "BonusQuestionType" AS ENUM ('OPEN', 'ESTIMATION', 'STATEMENT');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Tables
CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Pool" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "inviteCode" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT NOT NULL,
    CONSTRAINT "Pool_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "PoolMembership" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "poolId" TEXT NOT NULL,
    "role" "PoolRole" NOT NULL DEFAULT 'MEMBER',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PoolMembership_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Team" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameNl" TEXT,
    "code" TEXT NOT NULL,
    "flagUrl" TEXT,
    "externalId" INTEGER,
    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Match" (
    "id" TEXT NOT NULL,
    "externalId" INTEGER NOT NULL,
    "stage" "MatchStage" NOT NULL,
    "groupName" TEXT,
    "matchday" INTEGER,
    "homeTeamId" TEXT,
    "awayTeamId" TEXT,
    "homeScore" INTEGER,
    "awayScore" INTEGER,
    "status" "MatchStatus" NOT NULL DEFAULT 'SCHEDULED',
    "kickoff" TIMESTAMP(3) NOT NULL,
    "venue" TEXT,
    "lastSyncedAt" TIMESTAMP(3),
    "notificationSentAt" TIMESTAMP(3),
    CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Prediction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "homeScore" INTEGER NOT NULL,
    "awayScore" INTEGER NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "pointsAwarded" INTEGER,
    "isJoker" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Prediction_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Achievement" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "poolId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "matchId" TEXT,
    "detail" TEXT,
    CONSTRAINT "Achievement_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ChampionPick" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "poolId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "pointsAwarded" INTEGER,
    CONSTRAINT "ChampionPick_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "BonusQuestion" (
    "id" TEXT NOT NULL,
    "poolId" TEXT NOT NULL,
    "type" "BonusQuestionType" NOT NULL,
    "question" TEXT NOT NULL,
    "description" TEXT,
    "options" TEXT,
    "category" TEXT,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "correctAnswer" TEXT,
    "deadline" TIMESTAMP(3),
    CONSTRAINT "BonusQuestion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "BonusAnswer" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "pointsAwarded" INTEGER,
    CONSTRAINT "BonusAnswer_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "PoolMessage" (
    "id" TEXT NOT NULL,
    "poolId" TEXT NOT NULL,
    "userId" TEXT,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "kind" TEXT,
    CONSTRAINT "PoolMessage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "PushSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PushSubscription_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "SurvivorEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "hardcoreAlive" BOOLEAN NOT NULL DEFAULT true,
    "hardcoreElimRound" TEXT,
    "highscoreTotal" INTEGER NOT NULL DEFAULT 0,
    "resetUsed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SurvivorEntry_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "SurvivorPick" (
    "id" TEXT NOT NULL,
    "entryId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "round" TEXT NOT NULL,
    "cycle" INTEGER NOT NULL DEFAULT 0,
    "result" TEXT NOT NULL DEFAULT 'PENDING',
    "goalDiff" INTEGER,
    "pickedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SurvivorPick_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "LeaderboardEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "poolId" TEXT NOT NULL,
    "totalPoints" INTEGER NOT NULL DEFAULT 0,
    "matchPoints" INTEGER NOT NULL DEFAULT 0,
    "bonusPoints" INTEGER NOT NULL DEFAULT 0,
    "championPoints" INTEGER NOT NULL DEFAULT 0,
    "previousTotalPoints" INTEGER,
    "snapshotAt" TIMESTAMP(3),
    "lastCalculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LeaderboardEntry_pkey" PRIMARY KEY ("id")
);

-- Unique constraints (idempotent via DO blocks)
DO $$ BEGIN
  ALTER TABLE "User" ADD CONSTRAINT "User_email_key" UNIQUE ("email");
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "Pool" ADD CONSTRAINT "Pool_inviteCode_key" UNIQUE ("inviteCode");
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "PoolMembership" ADD CONSTRAINT "PoolMembership_userId_poolId_key" UNIQUE ("userId", "poolId");
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "Team" ADD CONSTRAINT "Team_name_key" UNIQUE ("name");
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "Team" ADD CONSTRAINT "Team_code_key" UNIQUE ("code");
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "Team" ADD CONSTRAINT "Team_externalId_key" UNIQUE ("externalId");
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "Match" ADD CONSTRAINT "Match_externalId_key" UNIQUE ("externalId");
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "Prediction" ADD CONSTRAINT "Prediction_userId_matchId_key" UNIQUE ("userId", "matchId");
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "Achievement" ADD CONSTRAINT "Achievement_userId_poolId_type_key" UNIQUE ("userId", "poolId", "type");
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "ChampionPick" ADD CONSTRAINT "ChampionPick_userId_poolId_key" UNIQUE ("userId", "poolId");
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "BonusAnswer" ADD CONSTRAINT "BonusAnswer_userId_questionId_key" UNIQUE ("userId", "questionId");
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "PushSubscription" ADD CONSTRAINT "PushSubscription_endpoint_key" UNIQUE ("endpoint");
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "SurvivorEntry" ADD CONSTRAINT "SurvivorEntry_userId_key" UNIQUE ("userId");
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "SurvivorPick" ADD CONSTRAINT "SurvivorPick_entryId_round_mode_key" UNIQUE ("entryId", "round", "mode");
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "SurvivorPick" ADD CONSTRAINT "SurvivorPick_userId_mode_teamId_cycle_key" UNIQUE ("userId", "mode", "teamId", "cycle");
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "LeaderboardEntry" ADD CONSTRAINT "LeaderboardEntry_userId_poolId_key" UNIQUE ("userId", "poolId");
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS "User_email_idx" ON "User"("email");
CREATE INDEX IF NOT EXISTS "PoolMembership_poolId_idx" ON "PoolMembership"("poolId");
CREATE INDEX IF NOT EXISTS "Match_stage_idx" ON "Match"("stage");
CREATE INDEX IF NOT EXISTS "Match_kickoff_idx" ON "Match"("kickoff");
CREATE INDEX IF NOT EXISTS "Match_status_idx" ON "Match"("status");
CREATE INDEX IF NOT EXISTS "Prediction_matchId_idx" ON "Prediction"("matchId");
CREATE INDEX IF NOT EXISTS "Prediction_userId_idx" ON "Prediction"("userId");
CREATE INDEX IF NOT EXISTS "Achievement_poolId_earnedAt_idx" ON "Achievement"("poolId", "earnedAt");
CREATE INDEX IF NOT EXISTS "BonusQuestion_poolId_idx" ON "BonusQuestion"("poolId");
CREATE INDEX IF NOT EXISTS "BonusAnswer_questionId_idx" ON "BonusAnswer"("questionId");
CREATE INDEX IF NOT EXISTS "PoolMessage_poolId_createdAt_idx" ON "PoolMessage"("poolId", "createdAt");
CREATE INDEX IF NOT EXISTS "PushSubscription_userId_idx" ON "PushSubscription"("userId");
CREATE INDEX IF NOT EXISTS "SurvivorEntry_idx" ON "SurvivorPick"("entryId");
CREATE INDEX IF NOT EXISTS "SurvivorPick_round_idx" ON "SurvivorPick"("round");
CREATE INDEX IF NOT EXISTS "LeaderboardEntry_poolId_totalPoints_idx" ON "LeaderboardEntry"("poolId", "totalPoints" DESC);

-- Foreign keys (idempotent)
DO $$ BEGIN
  ALTER TABLE "PoolMembership" ADD CONSTRAINT "PoolMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "PoolMembership" ADD CONSTRAINT "PoolMembership_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "Pool"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "Match" ADD CONSTRAINT "Match_homeTeamId_fkey" FOREIGN KEY ("homeTeamId") REFERENCES "Team"("id");
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "Match" ADD CONSTRAINT "Match_awayTeamId_fkey" FOREIGN KEY ("awayTeamId") REFERENCES "Team"("id");
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "Prediction" ADD CONSTRAINT "Prediction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "Prediction" ADD CONSTRAINT "Prediction_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "Achievement" ADD CONSTRAINT "Achievement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "Achievement" ADD CONSTRAINT "Achievement_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "Pool"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "ChampionPick" ADD CONSTRAINT "ChampionPick_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "ChampionPick" ADD CONSTRAINT "ChampionPick_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "Pool"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "ChampionPick" ADD CONSTRAINT "ChampionPick_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id");
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "BonusQuestion" ADD CONSTRAINT "BonusQuestion_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "Pool"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "BonusAnswer" ADD CONSTRAINT "BonusAnswer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "BonusAnswer" ADD CONSTRAINT "BonusAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "BonusQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "PoolMessage" ADD CONSTRAINT "PoolMessage_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "Pool"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "PoolMessage" ADD CONSTRAINT "PoolMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "PushSubscription" ADD CONSTRAINT "PushSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "SurvivorEntry" ADD CONSTRAINT "SurvivorEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "SurvivorPick" ADD CONSTRAINT "SurvivorPick_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "SurvivorEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "SurvivorPick" ADD CONSTRAINT "SurvivorPick_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id");
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "LeaderboardEntry" ADD CONSTRAINT "LeaderboardEntry_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "Pool"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
