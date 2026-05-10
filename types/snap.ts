import { z } from "zod";

export const SnapSchema = z.object({
  id: z.string().uuid(),
  source: z.string().min(1),
  externalId: z.string().min(1),
  imageUrl: z.string().min(1),
  sourceUrl: z.string().min(1),
  authorName: z.string().nullable(),
  authorUrl: z.string().nullable(),
  title: z.string().nullable(),
  description: z.string().nullable(),
  tags: z.array(z.string()),
  searchQuery: z.string(),
  oneLiner: z.string().nullable(),
  colorPalette: z.unknown().nullable(),
  styles: z.unknown().nullable(),
  aiDescription: z.string().nullable(),
  detectedItems: z.unknown().nullable(),
  radarScores: z.unknown().nullable(),
  analyzedAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type Snap = z.infer<typeof SnapSchema>;

export const SnapSummarySchema = SnapSchema.pick({
  id: true,
  imageUrl: true,
  authorName: true,
  sourceUrl: true,
});
export type SnapSummary = z.infer<typeof SnapSummarySchema>;

export const SnapSearchInputSchema = z.object({
  // trim を先に適用して "   " のような空白のみ入力を弾く（サーバー側ガード）
  query: z.string().trim().min(1).max(200),
  page: z.number().int().min(1).default(1),
  // Unsplash Search Photos API の per_page 上限が 30 のため合わせる
  pageSize: z.number().int().min(1).max(30).default(30),
});
export type SnapSearchInput = z.infer<typeof SnapSearchInputSchema>;

export const SnapSearchResultSchema = z.object({
  items: z.array(SnapSummarySchema),
  hasMore: z.boolean(),
  page: z.number().int().min(1),
});
export type SnapSearchResult = z.infer<typeof SnapSearchResultSchema>;
