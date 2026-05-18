import { z } from "zod";
import {
  ColorPaletteItemSchema,
  StyleItemSchema,
  DetectedItemSchema,
  EvaluationRadarSchema,
} from "@/types/ootd";
import { COLOR_CATEGORIES } from "@/lib/color-catalog";

// 16 系統のカラー系統を型安全に制限する enum。
// 保存(Snap.colorCategories)・検索入力(SnapSearchInput.colorCategories) 双方で
// 同じ enum を共有し、16 系統以外の値が DB / API 経由で混入するのを防ぐ。
const ColorCategoryEnum = z.enum(COLOR_CATEGORIES);

// 着こなし検索で取得元として使うサービス。
// "pexels" は UI 上は "Pinterest" と表示する（ブランディング都合）が、
// 内部実装・DB・型はすべて "pexels" で統一する。
export const SNAP_SOURCES = ["unsplash", "pexels"] as const;
export const SnapSourceEnum = z.enum(SNAP_SOURCES);
export type SnapSource = z.infer<typeof SnapSourceEnum>;

export const SnapSchema = z.object({
  id: z.string().uuid(),
  source: SnapSourceEnum,
  externalId: z.string().min(1),
  imageUrl: z.string().min(1),
  sourceUrl: z.string().min(1),
  authorName: z.string().nullable(),
  authorUrl: z.string().nullable(),
  title: z.string().nullable(),
  description: z.string().nullable(),
  tags: z.array(z.string()),
  // 同一画像が複数キーワードでヒットした履歴を全て保持する。
  // findSnapsByQuery は `{ has: query }` で配列内に当該キーワードがあるか判定する。
  searchQueries: z.array(z.string()),
  // AI 解析で算出したカラー系統（lib/color-catalog.ts の 16 系統）。
  // GIN インデックスで colorCategories フィルタ検索に使用する。
  // 入力スキーマ(SnapSearchInputSchema.colorCategories) と同じ enum で揃える。
  colorCategories: z.array(ColorCategoryEnum),
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
  source: true,
});
export type SnapSummary = z.infer<typeof SnapSummarySchema>;

// query / styles / colorCategories のいずれかを必ず指定する。
// 既存テスト（query のみ指定）は refine を満たすため互換性は維持される。
export const SnapSearchInputSchema = z
  .object({
    // trim を先に適用して "   " のような空白のみ入力を弾く（サーバー側ガード）
    query: z.string().trim().max(200).optional(),
    styles: z.array(z.string()).optional(),
    colorCategories: z.array(ColorCategoryEnum).optional(),
    page: z.number().int().min(1).default(1),
    // Unsplash Search Photos API の per_page 上限が 30 のため合わせる
    pageSize: z.number().int().min(1).max(30).default(30),
  })
  .refine(
    (v) =>
      Boolean(v.query) ||
      (v.styles?.length ?? 0) > 0 ||
      (v.colorCategories?.length ?? 0) > 0,
    { message: "query, styles, colorCategories のいずれか必須" },
  );
export type SnapSearchInput = z.infer<typeof SnapSearchInputSchema>;

export const SnapSearchResultSchema = z.object({
  items: z.array(SnapSummarySchema),
  hasMore: z.boolean(),
  page: z.number().int().min(1),
});
export type SnapSearchResult = z.infer<typeof SnapSearchResultSchema>;

// SnapSchema の AI 解析フィールドを z.unknown() から具体型に置き換えた詳細ビュー用スキーマ。
// services/snap-analysis.ts の解析結果を格納し、/search/[id] 画面で使用する。
export const SnapDetailSchema = SnapSchema.extend({
  colorPalette: z.array(ColorPaletteItemSchema).nullable(),
  styles: z.array(StyleItemSchema).nullable(),
  detectedItems: z.array(DetectedItemSchema).nullable(),
  radarScores: EvaluationRadarSchema.nullable(),
});
export type SnapDetail = z.infer<typeof SnapDetailSchema>;

// 類似コーデ取得 Server Action / Service 関数の入力スキーマ。
// searchQueries の hasSome で OR 検索し、snapId 自身を除外する。
export const FindSimilarSnapsInputSchema = z.object({
  snapId: z.string().uuid(),
  searchQueries: z.array(z.string()),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(30).default(10),
});
export type FindSimilarSnapsInput = z.infer<typeof FindSimilarSnapsInputSchema>;

// 画像検索 Server Action の入力。
// imageUrl は SSRF allow-list 経由の HTTPS URL のみ許可する。
// 厳密なホスト検証は Server Action 内の assertAllowedImageUrl で行うため、
// ここでは URL 形式チェックのみ実施する。
export const AnalyzeImageForSearchInputSchema = z.object({
  imageUrl: z.string().url(),
});
export type AnalyzeImageForSearchInput = z.infer<
  typeof AnalyzeImageForSearchInputSchema
>;

// 画像検索 Server Action の戻り値（成功時）。
// styles は STYLE_CATALOG 内の文字列（AI が prompt に従って返す）。
// colorCategories は 16 系統に正規化済み（categorizeColorPalette の結果）。
export const AnalyzeImageForSearchResultSchema = z.object({
  styles: z.array(z.string()),
  colorCategories: z.array(ColorCategoryEnum),
});
export type AnalyzeImageForSearchResult = z.infer<
  typeof AnalyzeImageForSearchResultSchema
>;
