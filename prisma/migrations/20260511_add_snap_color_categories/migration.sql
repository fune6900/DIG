ALTER TABLE "Snap" ADD COLUMN "colorCategories" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
CREATE INDEX "Snap_colorCategories_idx" ON "Snap" USING GIN ("colorCategories");
