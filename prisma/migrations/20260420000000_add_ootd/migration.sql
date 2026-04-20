-- CreateTable
CREATE TABLE "Ootd" (
    "id" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "oneLiner" TEXT NOT NULL,
    "colorPalette" JSONB NOT NULL,
    "styles" JSONB NOT NULL,
    "description" TEXT NOT NULL,
    "detectedItems" JSONB NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ootd_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Ootd_date_idx" ON "Ootd"("date");
