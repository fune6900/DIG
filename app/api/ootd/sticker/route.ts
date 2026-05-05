import { NextResponse } from "next/server";
import sharp from "sharp";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";
import { loadImageBuffer } from "@/lib/image-loader";
import { uploadImage } from "@/lib/storage";

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

  try {
    const { buffer, mimeType } = await loadImageBuffer(parsed.data.imageUrl);

    const metadata = await sharp(buffer).metadata();
    const imgWidth = metadata.width ?? 512;
    const imgHeight = metadata.height ?? 512;

    const base64 = buffer.toString("base64");

    // Gemini でバウンディングボックス取得
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
    });

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

    const cropped = await sharp(buffer)
      .extract({ left, top, width, height })
      .webp({ quality: 90 })
      .toBuffer();

    // 出力もストレージドライバ経由（本番は Supabase Storage）。
    const { url: stickerUrl } = await uploadImage(
      cropped,
      "image/webp",
      "sticker.webp",
    );
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
