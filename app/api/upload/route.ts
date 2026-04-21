import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join, extname } from "path";
import { randomUUID } from "crypto";

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("image");

  if (!file || !(file instanceof File)) {
    return NextResponse.json(
      { data: null, error: { message: "No image file provided", code: "MISSING_FILE" } },
      { status: 400 },
    );
  }

  if (!file.type.startsWith("image/")) {
    return NextResponse.json(
      { data: null, error: { message: "Only image files are allowed", code: "INVALID_FILE_TYPE" } },
      { status: 400 },
    );
  }

  try {
    const ext = extname(file.name) || ".jpg";
    const filename = `${randomUUID()}${ext}`;
    const uploadsDir = join(process.cwd(), "public", "uploads");

    await mkdir(uploadsDir, { recursive: true });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(join(uploadsDir, filename), buffer);

    return NextResponse.json({ url: `/uploads/${filename}` }, { status: 200 });
  } catch (error) {
    console.error("[upload]", error);
    return NextResponse.json(
      { data: null, error: { message: "Internal server error", code: "INTERNAL_ERROR" } },
      { status: 500 },
    );
  }
}
