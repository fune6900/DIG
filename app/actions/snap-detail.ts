"use server";

import { z } from "zod";
import { Prisma } from "@prisma/client";
import type { SnapDetail, SnapSummary } from "@/types/snap";
import {
  getSnapById,
  updateSnap,
  findSimilarSnaps,
} from "@/services/snap-service";
import { analyzeSnapImage } from "@/services/snap-analysis";

type ActionResult<T> =
  | { data: T; error: null }
  | { data: null; error: { message: string; code: string } };

// UUID 形式チェック（8-4-4-4-12 の hex）。
// z.string().uuid() は RFC 4122 バージョン・バリアントビットまで検証するため、
// テストフィクスチャの UUID が弾かれる。形式確認のみを行う正規表現で代替する。
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const UuidSchema = z.string().regex(UUID_REGEX, "Invalid UUID format");

const FindSimilarSnapsInputSchema = z.object({
  snapId: z.string().regex(UUID_REGEX, "Invalid UUID format"),
  searchQueries: z.array(z.string()),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(30).default(10),
});

export async function getSnapDetailAction(
  id: unknown,
): Promise<ActionResult<SnapDetail>> {
  const parsed = UuidSchema.safeParse(id);
  if (!parsed.success) {
    return {
      data: null,
      error: { message: "Invalid id", code: "VALIDATION_ERROR" },
    };
  }

  const snap = await getSnapById(parsed.data);
  if (snap === null) {
    return {
      data: null,
      error: { message: "Snap not found", code: "NOT_FOUND" },
    };
  }

  return { data: snap as SnapDetail, error: null };
}

export async function analyzeSnapAction(
  id: unknown,
): Promise<ActionResult<SnapDetail>> {
  const parsed = UuidSchema.safeParse(id);
  if (!parsed.success) {
    return {
      data: null,
      error: { message: "Invalid id", code: "VALIDATION_ERROR" },
    };
  }

  const snap = await getSnapById(parsed.data);
  if (snap === null) {
    return {
      data: null,
      error: { message: "Snap not found", code: "NOT_FOUND" },
    };
  }

  if (snap.analyzedAt !== null) {
    return { data: snap as SnapDetail, error: null };
  }

  try {
    const analysisResult = await analyzeSnapImage(snap.imageUrl);
    const updatedSnap = await updateSnap(parsed.data, {
      oneLiner: analysisResult.oneLiner,
      colorPalette: analysisResult.colorPalette as Prisma.InputJsonValue,
      styles: analysisResult.styles as Prisma.InputJsonValue,
      aiDescription: analysisResult.description,
      detectedItems: analysisResult.detectedItems as Prisma.InputJsonValue,
      radarScores:
        analysisResult.radarScores != null
          ? (analysisResult.radarScores as Prisma.InputJsonValue)
          : Prisma.DbNull,
      analyzedAt: new Date(),
    });
    return { data: updatedSnap as SnapDetail, error: null };
  } catch (error) {
    // 本番環境のデバッグのためサーバーログに残す（レスポンスには内部情報を含めない）
    console.error("[analyzeSnapAction]", { snapId: parsed.data, error });
    return {
      data: null,
      error: { message: "AI analysis failed", code: "ANALYSIS_FAILED" },
    };
  }
}

export async function findSimilarSnapsAction(
  input: unknown,
): Promise<ActionResult<SnapSummary[]>> {
  const parsed = FindSimilarSnapsInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      data: null,
      error: { message: "Invalid input", code: "VALIDATION_ERROR" },
    };
  }

  const items = await findSimilarSnaps(parsed.data);
  return { data: items, error: null };
}
