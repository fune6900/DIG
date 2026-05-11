"use server";

import { AnalyzeImageForSearchInputSchema } from "@/types/snap";
import type { AnalyzeImageForSearchResult } from "@/types/snap";
import { analyzeSnapImage } from "@/services/snap-analysis";
import { categorizeColorPalette } from "@/lib/color-categorize";
import { deleteUploadedImagesAction } from "@/app/actions/ootd";

type ActionResult<T> =
  | { data: T; error: null }
  | { data: null; error: { message: string; code: string } };

export async function analyzeImageForSearchAction(
  input: unknown,
): Promise<ActionResult<AnalyzeImageForSearchResult>> {
  const parsed = AnalyzeImageForSearchInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      data: null,
      error: { message: "Invalid input", code: "VALIDATION_ERROR" },
    };
  }

  const { imageUrl } = parsed.data;

  // SSRF 対策: https のみ許可（http は VALIDATION_ERROR）
  if (!imageUrl.startsWith("https://")) {
    return {
      data: null,
      error: { message: "imageUrl must use https", code: "VALIDATION_ERROR" },
    };
  }

  let analysisError: Error | null = null;
  let result: AnalyzeImageForSearchResult | null = null;

  try {
    const analysisResult = await analyzeSnapImage(imageUrl);
    const styles = analysisResult.styles.map((s) => s.name);
    const colorCategories = categorizeColorPalette(analysisResult.colorPalette);
    result = { styles, colorCategories };
  } catch (err) {
    analysisError = err instanceof Error ? err : new Error(String(err));
    console.error("[analyzeImageForSearchAction]", analysisError);
  } finally {
    // best-effort: 成功・失敗どちらでも一時画像を削除する（孤児防止）
    try {
      await deleteUploadedImagesAction({ urls: [imageUrl] });
    } catch (cleanupErr) {
      console.error("[analyzeImageForSearchAction] cleanup failed", cleanupErr);
    }
  }

  if (analysisError !== null) {
    return {
      data: null,
      error: {
        message: analysisError.message,
        code: "ANALYSIS_FAILED",
      },
    };
  }

  return {
    data: result as AnalyzeImageForSearchResult,
    error: null,
  };
}
