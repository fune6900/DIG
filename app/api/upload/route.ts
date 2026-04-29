import { NextResponse } from "next/server";
import { uploadImage } from "@/lib/storage";

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

  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const { url } = await uploadImage(buffer, file.type, file.name);
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
