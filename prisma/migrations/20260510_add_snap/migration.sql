-- CreateTable
CREATE TABLE "Snap" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "authorName" TEXT,
    "authorUrl" TEXT,
    "title" TEXT,
    "description" TEXT,
    "tags" TEXT[],
    "searchQuery" TEXT NOT NULL,
    "oneLiner" TEXT,
    "colorPalette" JSONB,
    "styles" JSONB,
    "aiDescription" TEXT,
    "detectedItems" JSONB,
    "radarScores" JSONB,
    "analyzedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Snap_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Snap_searchQuery_idx" ON "Snap"("searchQuery");

-- CreateIndex
CREATE INDEX "Snap_createdAt_idx" ON "Snap"("createdAt");

-- CreateUniqueIndex
CREATE UNIQUE INDEX "Snap_source_externalId_key" ON "Snap"("source", "externalId");
