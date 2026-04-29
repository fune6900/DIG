import { NextResponse } from "next/server";
import { uploadImage, convertHeicToJpeg } from "@/lib/storage";
import { HEIC_MIME_TYPES } from "@/types/upload";

const MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const HEIC_MIME_SET = new Set<string>(HEIC_MIME_TYPES);

function isHeic(mimeType: string): boolean {
  return HEIC_MIME_SET.has(mimeType.toLowerCase());
}

function replaceExtensionToJpg(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot > 0 ? `${name.slice(0, dot)}.jpg` : `${name}.jpg`;
}

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

  if (!file.type.startsWith("image/")) {
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
    let buffer: Buffer = Buffer.from(bytes);
    let mimeType: string = file.type;
    let name: string = file.name;

    if (isHeic(file.type)) {
      // ブラウザ表示互換のため HEIC/HEIF はサーバーサイドで JPEG 化してから保存。
      buffer = await convertHeicToJpeg(buffer);
      mimeType = "image/jpeg";
      name = replaceExtensionToJpg(file.name);
    }

    const { url } = await uploadImage(buffer, mimeType, name);
    return NextResponse.json({ url }, { status: 200 });
  } catch (error) {
    console.error("[upload]", error);
    return NextResponse.json(
      {
        data: null,
        error: { message: "Internal server error", code: "INTERNAL_ERROR" },
      },
      { status: 500 },
    );
  }
}
