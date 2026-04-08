-- CreateEnum
CREATE TYPE "FiatDenomination" AS ENUM ('ONE_HUNDRED', 'FIFTY', 'TWENTY', 'TEN', 'FIVE', 'ONE');

-- CreateTable
CREATE TABLE "MonopolyExercise" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "welcomeContent" TEXT NOT NULL DEFAULT '',
    "completionContent" TEXT NOT NULL DEFAULT '',
    "randomizeCards" BOOLEAN NOT NULL DEFAULT false,
    "requireAllFiatSpent" BOOLEAN NOT NULL DEFAULT false,
    "allowMultipleDenominationsPerCard" BOOLEAN NOT NULL DEFAULT false,
    "allowCardComments" BOOLEAN NOT NULL DEFAULT false,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MonopolyExercise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonopolyCard" (
    "id" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "MonopolyCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonopolyParticipantSession" (
    "id" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "MonopolyParticipantSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonopolyAllocation" (
    "id" TEXT NOT NULL,
    "participantSessionId" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "denomination" "FiatDenomination" NOT NULL,

    CONSTRAINT "MonopolyAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonopolyParticipantCardComment" (
    "id" TEXT NOT NULL,
    "participantSessionId" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "body" TEXT NOT NULL,

    CONSTRAINT "MonopolyParticipantCardComment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MonopolyExercise_slug_key" ON "MonopolyExercise"("slug");

-- CreateIndex
CREATE INDEX "MonopolyCard_exerciseId_idx" ON "MonopolyCard"("exerciseId");

-- CreateIndex
CREATE INDEX "MonopolyParticipantSession_exerciseId_idx" ON "MonopolyParticipantSession"("exerciseId");

-- CreateIndex
CREATE INDEX "MonopolyAllocation_participantSessionId_idx" ON "MonopolyAllocation"("participantSessionId");

-- CreateIndex
CREATE INDEX "MonopolyAllocation_cardId_idx" ON "MonopolyAllocation"("cardId");

-- CreateIndex
CREATE UNIQUE INDEX "MonopolyAllocation_participantSessionId_denomination_key" ON "MonopolyAllocation"("participantSessionId", "denomination");

-- CreateIndex
CREATE INDEX "MonopolyParticipantCardComment_participantSessionId_idx" ON "MonopolyParticipantCardComment"("participantSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "MonopolyParticipantCardComment_participantSessionId_cardId_key" ON "MonopolyParticipantCardComment"("participantSessionId", "cardId");

-- AddForeignKey
ALTER TABLE "MonopolyCard" ADD CONSTRAINT "MonopolyCard_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "MonopolyExercise"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonopolyParticipantSession" ADD CONSTRAINT "MonopolyParticipantSession_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "MonopolyExercise"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonopolyAllocation" ADD CONSTRAINT "MonopolyAllocation_participantSessionId_fkey" FOREIGN KEY ("participantSessionId") REFERENCES "MonopolyParticipantSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonopolyAllocation" ADD CONSTRAINT "MonopolyAllocation_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "MonopolyCard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonopolyParticipantCardComment" ADD CONSTRAINT "MonopolyParticipantCardComment_participantSessionId_fkey" FOREIGN KEY ("participantSessionId") REFERENCES "MonopolyParticipantSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonopolyParticipantCardComment" ADD CONSTRAINT "MonopolyParticipantCardComment_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "MonopolyCard"("id") ON DELETE CASCADE ON UPDATE CASCADE;
