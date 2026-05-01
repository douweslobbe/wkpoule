-- CreateEnum
CREATE TYPE "PlayerPosition" AS ENUM ('GK', 'DEF', 'MID', 'FWD');

-- CreateTable
CREATE TABLE "Player" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameNl" TEXT,
    "teamId" TEXT NOT NULL,
    "position" "PlayerPosition" NOT NULL,
    "shirtNumber" INTEGER,
    "photoUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "externalId" INTEGER,

    CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FantasyTeam" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "nickname" TEXT NOT NULL,
    "totalPoints" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FantasyTeam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FantasyPick" (
    "id" TEXT NOT NULL,
    "fantasyTeamId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "addedInRound" TEXT NOT NULL,

    CONSTRAINT "FantasyPick_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FantasyTransfer" (
    "id" TEXT NOT NULL,
    "fantasyTeamId" TEXT NOT NULL,
    "round" TEXT NOT NULL,
    "playerOutId" TEXT NOT NULL,
    "playerInId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FantasyTransfer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FantasyPlayerStats" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "minutesPlayed" INTEGER NOT NULL DEFAULT 0,
    "goals" INTEGER NOT NULL DEFAULT 0,
    "assists" INTEGER NOT NULL DEFAULT 0,
    "cleanSheet" BOOLEAN NOT NULL DEFAULT false,
    "goalsConceded" INTEGER NOT NULL DEFAULT 0,
    "shotsSaved" INTEGER NOT NULL DEFAULT 0,
    "penaltySaved" INTEGER NOT NULL DEFAULT 0,
    "penaltyMissed" INTEGER NOT NULL DEFAULT 0,
    "yellowCards" INTEGER NOT NULL DEFAULT 0,
    "redCards" INTEGER NOT NULL DEFAULT 0,
    "ownGoals" INTEGER NOT NULL DEFAULT 0,
    "bonusPoints" INTEGER NOT NULL DEFAULT 0,
    "totalPoints" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FantasyPlayerStats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Player_externalId_key" ON "Player"("externalId");

-- CreateIndex
CREATE INDEX "Player_teamId_idx" ON "Player"("teamId");

-- CreateIndex
CREATE INDEX "Player_position_idx" ON "Player"("position");

-- CreateIndex
CREATE UNIQUE INDEX "FantasyTeam_userId_key" ON "FantasyTeam"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "FantasyPick_fantasyTeamId_playerId_key" ON "FantasyPick"("fantasyTeamId", "playerId");

-- CreateIndex
CREATE INDEX "FantasyPick_fantasyTeamId_idx" ON "FantasyPick"("fantasyTeamId");

-- CreateIndex
CREATE INDEX "FantasyTransfer_fantasyTeamId_round_idx" ON "FantasyTransfer"("fantasyTeamId", "round");

-- CreateIndex
CREATE UNIQUE INDEX "FantasyPlayerStats_playerId_matchId_key" ON "FantasyPlayerStats"("playerId", "matchId");

-- CreateIndex
CREATE INDEX "FantasyPlayerStats_matchId_idx" ON "FantasyPlayerStats"("matchId");

-- CreateIndex
CREATE INDEX "FantasyPlayerStats_playerId_idx" ON "FantasyPlayerStats"("playerId");

-- AddForeignKey
ALTER TABLE "Player" ADD CONSTRAINT "Player_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FantasyTeam" ADD CONSTRAINT "FantasyTeam_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FantasyPick" ADD CONSTRAINT "FantasyPick_fantasyTeamId_fkey" FOREIGN KEY ("fantasyTeamId") REFERENCES "FantasyTeam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FantasyPick" ADD CONSTRAINT "FantasyPick_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FantasyTransfer" ADD CONSTRAINT "FantasyTransfer_fantasyTeamId_fkey" FOREIGN KEY ("fantasyTeamId") REFERENCES "FantasyTeam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FantasyPlayerStats" ADD CONSTRAINT "FantasyPlayerStats_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FantasyPlayerStats" ADD CONSTRAINT "FantasyPlayerStats_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
