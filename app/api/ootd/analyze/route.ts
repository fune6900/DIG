import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join, extname } from "path";
import { z } from "zod";
import { analyzeOutfit } from "@/services/ai-analysis";

const BodySchema = z.object({
  imageUrl: z.string().min(1),
});

const MIME_MAP: Record<string, "image/jpeg" | "image/png" | "image/gif" | "image/webp"> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
};

export async function POST(request: Request) {
  const body = (await request.json()) as unknown;
  const parsed = BodySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { data: null, error: { message: "Invalid input", code: "VALIDATION_ERROR" } },
      { status: 400 },
    );
  }

  const { imageUrl } = parsed.data;

  if (!imageUrl.startsWith("/uploads/")) {
    return NextResponse.json(
      { data: null, error: { message: "Invalid image URL", code: "VALIDATION_ERROR" } },
      { status: 400 },
    );
  }

  try {
    const filePath = join(process.cwd(), "public", imageUrl);
    const buffer = await readFile(filePath);
    const base64 = buffer.toString("base64");

    const ext = extname(imageUrl).toLowerCase();
    const mimeType = MIME_MAP[ext] ?? "image/jpeg";

    const result = await analyzeOutfit(base64, mimeType);
    return NextResponse.json({ data: result, error: null }, { status: 200 });
  } catch (error) {
    console.error("[analyze]", error);
    return NextResponse.json(
      { data: null, error: { message: "Internal server error", code: "INTERNAL_ERROR" } },
      { status: 500 },
    );
  }
}
