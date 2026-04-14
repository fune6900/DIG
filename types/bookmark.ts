import { z } from "zod";

export const BookmarkSchema = z.object({
  id: z.string().uuid(),
  knowledgeId: z.string().uuid(),
  createdAt: z.date(),
});
export type Bookmark = z.infer<typeof BookmarkSchema>;

// ローカルストレージ保存用（createdAt を ISO 文字列で保持）
export const BookmarkStorageSchema = z.object({
  id: z.string().uuid(),
  knowledgeId: z.string().uuid(),
  createdAt: z.string().datetime(),
});
export type BookmarkStorage = z.infer<typeof BookmarkStorageSchema>;
