import { z } from "zod";

export const IDENTIFICATION_POINT_TYPES = [
  "タグ",
  "縫製",
  "素材",
  "シルエット",
  "ディテール",
] as const;

export const IdentificationPointSchema = z.object({
  type: z.enum(IDENTIFICATION_POINT_TYPES),
  description: z.string().min(1),
  imageHint: z.string().optional(),
});
export type IdentificationPoint = z.infer<typeof IdentificationPointSchema>;

export const KnowledgeSchema = z.object({
  id: z.string().uuid(),
  brand: z.string().min(1).max(100),
  category: z.string().min(1),
  era: z.string().min(1),
  description: z.string().nullable(),
  tags: z.array(z.string()),
  identificationPoints: z.array(IdentificationPointSchema),
  imageUrls: z.array(z.string().url()),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type Knowledge = z.infer<typeof KnowledgeSchema>;

export const KnowledgeSummarySchema = KnowledgeSchema.pick({
  id: true,
  brand: true,
  category: true,
  era: true,
  tags: true,
  imageUrls: true,
});
export type KnowledgeSummary = z.infer<typeof KnowledgeSummarySchema>;

export const KnowledgeSearchInputSchema = z.object({
  query: z.string().max(200).optional(),
  brand: z.string().max(100).optional(),
  category: z.string().optional(),
  era: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
});
export type KnowledgeSearchInput = z.infer<typeof KnowledgeSearchInputSchema>;

export const KnowledgeSearchResultSchema = z.object({
  items: z.array(KnowledgeSummarySchema),
  total: z.number().int(),
  page: z.number().int(),
  totalPages: z.number().int(),
});
export type KnowledgeSearchResult = z.infer<typeof KnowledgeSearchResultSchema>;
