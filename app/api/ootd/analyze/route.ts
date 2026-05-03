import { NextResponse } from "next/server";
import { z } from "zod";
import { analyzeOutfit } from "@/services/ai-analysis";
import { loadImageBuffer } from "@/lib/image-loader";

const BodySchema = z.object({
  imageUrl: z.string().min(1),
});

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
    const base64 = buffer.toString("base64");
    const result = await analyzeOutfit(base64, mimeType);
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
