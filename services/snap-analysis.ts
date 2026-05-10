import { analyzeOutfit } from "@/services/ai-analysis";
import { assertAllowedImageUrl } from "@/lib/image-hosts";
import type { OotdAnalysisResult } from "@/types/ootd";

export async function analyzeSnapImage(
  imageUrl: string,
): Promise<OotdAnalysisResult> {
  // SSRF 対策: lib/image-hosts.ts で next.config.ts と同期した allow-list
  // （images.unsplash.com + 必要なら SUPABASE_URL のホスト）に限定。
  const safeUrl = assertAllowedImageUrl(imageUrl);

  const response = await fetch(safeUrl.toString(), {
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch image: ${response.status} ${response.statusText}`,
    );
  }

  const contentType = response.headers.get("Content-Type") ?? "";
  const mimeType = contentType.split(";")[0].trim();

  if (!mimeType.startsWith("image/")) {
    throw new Error(
      `Unexpected Content-Type: ${contentType}. Expected image/*.`,
    );
  }

  const arrayBuffer = await response.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");

  return analyzeOutfit(base64, mimeType);
}
