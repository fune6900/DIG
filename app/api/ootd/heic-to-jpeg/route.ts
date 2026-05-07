import { NextResponse } from "next/server";
import { convertHeicToJpeg } from "@/lib/storage";
import { HEIC_MIME_TYPES } from "@/types/upload";

const MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const HEIC_MIME_SET = new Set<string>(HEIC_MIME_TYPES);

/**
 * POST /api/ootd/heic-to-jpeg
 *
 * HEIC/HEIF を JPEG に変換するだけのエンドポイント。Storage には保存しない。
 * /ootd/new のフローで「画像選択直後はプレビュー用に変換だけする。Storage には
 * 投稿処理が確定した時点で初めて上げる」というポリシーを満たすために存在する。
 *
 * 入力: multipart/form-data の "image" フィールドに HEIC/HEIF File
 * 出力: image/jpeg バイナリ（Blob）
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
  if (!HEIC_MIME_SET.has(mimeType)) {
    return NextResponse.json(
      {
        data: null,
        error: {
          message: "Only HEIC/HEIF files are supported",
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
    const buffer = Buffer.from(bytes);
    const jpeg = await convertHeicToJpeg(buffer);
    return new NextResponse(new Uint8Array(jpeg), {
      status: 200,
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[heic-to-jpeg]", error);
    return NextResponse.json(
      {
        data: null,
        error: { message: "Internal server error", code: "INTERNAL_ERROR" },
      },
      { status: 500 },
    );
  }
}
