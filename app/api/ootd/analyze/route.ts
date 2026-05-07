import { NextResponse } from "next/server";
import { analyzeOutfit } from "@/services/ai-analysis";
import { convertHeicToJpeg } from "@/lib/storage";
import { DIRECT_UPLOAD_MIME_TYPES, HEIC_MIME_TYPES } from "@/types/upload";

const MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const HEIC_MIME_SET = new Set<string>(HEIC_MIME_TYPES);
// image/svg+xml 等のアクティブコンテンツを排除するため、サポート MIME を allowlist で固定する。
const ALLOWED_MIME_TYPES = new Set<string>([
  ...DIRECT_UPLOAD_MIME_TYPES,
  ...HEIC_MIME_TYPES,
]);

/**
 * POST /api/ootd/analyze
 *
 * multipart/form-data で画像 File を受け取り、AI コーデ分析結果を返す。
 * Storage には何も保存しない（投稿確定時にのみ Storage に上げるポリシー）。
 *
 * 入力: form field "image" に File
 * 出力: { data: OotdAnalysisResult, error: null }
 */
export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("image");

  if (!file || !(file instanceof File)) {
    return NextResponse.json(
      {
        data: null,
        error: { message: "No image file provided", code: "MISSING_FILE" },
      },
      { status: 400 },
    );
  }

  const mimeType = file.type.toLowerCase();
  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    return NextResponse.json(
      {
        data: null,
        error: {
          message: "Only image files are allowed",
          code: "INVALID_FILE_TYPE",
        },
      },
      { status: 400 },
    );
  }

  if (file.size > MAX_UPLOAD_SIZE_BYTES) {
    return NextResponse.json(
      {
        data: null,
        error: { message: "File is too large", code: "FILE_TOO_LARGE" },
      },
      { status: 413 },
    );
  }

  try {
    const bytes = await file.arrayBuffer();
    // 入力 Buffer と HEIC 変換後 Buffer は @types/node 上で異なる generic 引数を持つため、
    // 受け側の型を最も広い ArrayBufferLike に揃えて再代入を許容する。
    let buffer: Buffer<ArrayBufferLike> = Buffer.from(bytes);
    let geminiMime = mimeType;

    if (HEIC_MIME_SET.has(mimeType)) {
      // Gemini 側で HEIC を直接扱えないケースに備え、JPEG に正規化する。
      buffer = await convertHeicToJpeg(buffer);
      geminiMime = "image/jpeg";
    }

    const base64 = buffer.toString("base64");
    const result = await analyzeOutfit(base64, geminiMime);
    return NextResponse.json({ data: result, error: null }, { status: 200 });
  } catch (error) {
    console.error("[analyze]", error);
    return NextResponse.json(
      {
        data: null,
        error: { message: "Internal server error", code: "INTERNAL_ERROR" },
      },
      { status: 500 },
    );
  }
}
