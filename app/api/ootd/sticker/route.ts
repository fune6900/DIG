import { NextResponse } from "next/server";
import { readFile, mkdir } from "fs/promises";
import { join, extname } from "path";
import { randomUUID } from "crypto";
import sharp from "sharp";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";

const BodySchema = z.object({
  imageUrl: z.string().min(1),
});

const BoundingBoxSchema = z.object({
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
  width: z.number().min(0.05).max(1),
  height: z.number().min(0.05).max(1),
});

const GEMINI_PROMPT = `Analyze this outfit photo. Return ONLY a JSON object with the bounding box of the main subject (person wearing the outfit, or the main clothing item if no person is visible).
The bounding box should tightly frame the subject with minimal background.
Format: {"x": 0.1, "y": 0.05, "width": 0.8, "height": 0.9}
Where x, y are the top-left corner (0=left/top, 1=right/bottom), width and height are fractions of the image.
Return ONLY the JSON object, no markdown, no explanation.`;

const MIME_MAP: Record<
  string,
  "image/jpeg" | "image/png" | "image/gif" | "image/webp"
> = {
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
      {
        data: null,
        error: { message: "Invalid input", code: "VALIDATION_ERROR" },
      },
      { status: 400 },
    );
  }

  const { imageUrl } = parsed.data;

  if (!imageUrl.startsWith("/uploads/")) {
    return NextResponse.json(
      {
        data: null,
        error: { message: "Invalid image URL", code: "VALIDATION_ERROR" },
      },
      { status: 400 },
    );
  }

  try {
    const filePath = join(process.cwd(), "public", imageUrl);
    const buffer = await readFile(filePath);

    const metadata = await sharp(buffer).metadata();
    const imgWidth = metadata.width ?? 512;
    const imgHeight = metadata.height ?? 512;

    const ext = extname(imageUrl).toLowerCase();
    const mimeType = MIME_MAP[ext] ?? "image/jpeg";
    const base64 = buffer.toString("base64");

    // Gemini でバウンディングボックス取得
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

    const result = await model.generateContent([
      { inlineData: { data: base64, mimeType } },
      GEMINI_PROMPT,
    ]);

    const text = result.response.text().trim();
    const jsonText = text.startsWith("```")
      ? text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "")
      : text;

    let bbox = { x: 0.05, y: 0.0, width: 0.9, height: 1.0 };
    try {
      const rawBbox = JSON.parse(jsonText) as unknown;
      const bboxParsed = BoundingBoxSchema.safeParse(rawBbox);
      if (bboxParsed.success) {
        bbox = bboxParsed.data;
      }
    } catch {
      // fallback to default bbox
    }

    // 少しパディングを加えてクロップ
    const PAD = 0.04;
    const cropX = Math.max(0, bbox.x - PAD);
    const cropY = Math.max(0, bbox.y - PAD);
    const cropW = Math.min(1 - cropX, bbox.width + PAD * 2);
    const cropH = Math.min(1 - cropY, bbox.height + PAD * 2);

    const left = Math.round(cropX * imgWidth);
    const top = Math.round(cropY * imgHeight);
    const width = Math.round(cropW * imgWidth);
    const height = Math.round(cropH * imgHeight);

    const stickersDir = join(process.cwd(), "public", "uploads", "stickers");
    await mkdir(stickersDir, { recursive: true });

    const filename = `${randomUUID()}.webp`;
    const outputPath = join(stickersDir, filename);

    await sharp(buffer)
      .extract({ left, top, width, height })
      .webp({ quality: 90 })
      .toFile(outputPath);

    const stickerUrl = `/uploads/stickers/${filename}`;
    return NextResponse.json(
      { data: { stickerUrl }, error: null },
      { status: 200 },
    );
  } catch (error) {
    console.error("[sticker]", error);
    return NextResponse.json(
      {
        data: null,
        error: { message: "Internal server error", code: "INTERNAL_ERROR" },
      },
      { status: 500 },
    );
  }
}
