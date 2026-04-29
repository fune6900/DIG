import { NextResponse } from "next/server";
import { createSignedUploadUrl } from "@/lib/storage";
import { SignedUploadUrlRequestSchema } from "@/types/upload";

/**
 * POST /api/upload-url
 *
 * クライアント直接アップロード（署名URL方式）の入口。
 * 入力 mimeType は HEIC/HEIF 以外の主要画像形式のみ受理する。
 * HEIC/HEIF は別経路（POST /api/upload）でサーバーサイド変換してから保存する。
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        data: null,
        error: { message: "Invalid JSON body", code: "VALIDATION_ERROR" },
      },
      { status: 400 },
    );
  }

  const parsed = SignedUploadUrlRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        data: null,
        error: {
          message: "Invalid input",
          code: "VALIDATION_ERROR",
        },
      },
      { status: 400 },
    );
  }

  try {
    const { signedUrl, path, publicUrl } = await createSignedUploadUrl(
      parsed.data.mimeType,
      parsed.data.originalName,
    );
    return NextResponse.json(
      { signedUrl, path, publicUrl },
      { status: 200 },
    );
  } catch (error) {
    console.error("[upload-url]", error);
    return NextResponse.json(
      {
        data: null,
        error: { message: "Internal server error", code: "INTERNAL_ERROR" },
      },
      { status: 500 },
    );
  }
}
