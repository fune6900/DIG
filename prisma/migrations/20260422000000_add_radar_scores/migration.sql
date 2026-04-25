-- AlterTable: add radarScores column that was missing from initial migration
ALTER TABLE "Ootd" ADD COLUMN "radarScores" JSONB;
