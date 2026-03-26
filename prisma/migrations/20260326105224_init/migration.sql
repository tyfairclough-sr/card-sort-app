-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Exercise" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "welcomeContent" TEXT NOT NULL DEFAULT '',
    "completionContent" TEXT NOT NULL DEFAULT '',
    "randomizeCards" BOOLEAN NOT NULL DEFAULT false,
    "requireAllSorted" BOOLEAN NOT NULL DEFAULT true,
    "allowDuplicatePlacements" BOOLEAN NOT NULL DEFAULT false,
    "allowCardComments" BOOLEAN NOT NULL DEFAULT false,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Card" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "exerciseId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Card_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CategoryPreset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "exerciseId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "CategoryPreset_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ParticipantSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "exerciseId" TEXT NOT NULL,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    CONSTRAINT "ParticipantSession_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ParticipantCategory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "participantSessionId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "ParticipantCategory_participantSessionId_fkey" FOREIGN KEY ("participantSessionId") REFERENCES "ParticipantSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Placement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "participantSessionId" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "categoryPresetId" TEXT,
    "participantCategoryId" TEXT,
    "comment" TEXT,
    CONSTRAINT "Placement_participantSessionId_fkey" FOREIGN KEY ("participantSessionId") REFERENCES "ParticipantSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Placement_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Card" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Placement_categoryPresetId_fkey" FOREIGN KEY ("categoryPresetId") REFERENCES "CategoryPreset" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Placement_participantCategoryId_fkey" FOREIGN KEY ("participantCategoryId") REFERENCES "ParticipantCategory" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Exercise_slug_key" ON "Exercise"("slug");

-- CreateIndex
CREATE INDEX "Card_exerciseId_idx" ON "Card"("exerciseId");

-- CreateIndex
CREATE INDEX "CategoryPreset_exerciseId_idx" ON "CategoryPreset"("exerciseId");

-- CreateIndex
CREATE INDEX "ParticipantSession_exerciseId_idx" ON "ParticipantSession"("exerciseId");

-- CreateIndex
CREATE INDEX "ParticipantCategory_participantSessionId_idx" ON "ParticipantCategory"("participantSessionId");

-- CreateIndex
CREATE INDEX "Placement_participantSessionId_idx" ON "Placement"("participantSessionId");

-- CreateIndex
CREATE INDEX "Placement_cardId_idx" ON "Placement"("cardId");
