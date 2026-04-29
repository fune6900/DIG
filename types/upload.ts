import { z } from "zod";

/**
 * クライアント直接アップロード（署名URL方式）で許可する MIME タイプ。
 * HEIC/HEIF はブラウザ表示互換性のためサーバーサイド変換経路（/api/upload）に回すので除外。
 */
export const DIRECT_UPLOAD_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;
export type DirectUploadMimeType = (typeof DIRECT_UPLOAD_MIME_TYPES)[number];

/**
 * サーバーサイドで JPEG 変換してから保存する MIME タイプ（iPhone 由来）。
 */
export const HEIC_MIME_TYPES = ["image/heic", "image/heif"] as const;
export type HeicMimeType = (typeof HEIC_MIME_TYPES)[number];

/**
 * /api/upload-url リクエスト。
 */
export const SignedUploadUrlRequestSchema = z.object({
  mimeType: z.enum(DIRECT_UPLOAD_MIME_TYPES),
  originalName: z.string().min(1).max(255),
});
export type SignedUploadUrlRequest = z.infer<typeof SignedUploadUrlRequestSchema>;

/**
 * /api/upload-url レスポンス（成功時）。
 *  - signedUrl: ブラウザから直接 PUT する署名付きURL（短期有効）
 *  - path: バケット内のオブジェクトパス
 *  - publicUrl: アップロード後にアプリ側で参照する公開URL
 */
export const SignedUploadUrlResponseSchema = z.object({
  signedUrl: z.string().min(1),
  path: z.string().min(1),
  publicUrl: z.string().min(1),
});
export type SignedUploadUrlResponse = z.infer<typeof SignedUploadUrlResponseSchema>;
