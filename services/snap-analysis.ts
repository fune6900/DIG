import { analyzeOutfit } from "@/services/ai-analysis";
import type { OotdAnalysisResult } from "@/types/ootd";

// SSRF 対策: server-side fetch を許可する画像ホストの allow-list。
// next.config.ts の images.remotePatterns と同期させること。
// 内部 IP / file:// / 任意ホストへの踏み台化を防ぐ。
const ALLOWED_IMAGE_HOSTS = new Set<string>(["images.unsplash.com"]);

function assertAllowedImageUrl(rawUrl: string): URL {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error(`Invalid image URL: ${rawUrl}`);
  }

  if (url.protocol !== "https:") {
    throw new Error(`Disallowed protocol: ${url.protocol}`);
  }
  if (!ALLOWED_IMAGE_HOSTS.has(url.hostname)) {
    throw new Error(`Disallowed image host: ${url.hostname}`);
  }
  return url;
}

export async function analyzeSnapImage(
  imageUrl: string,
): Promise<OotdAnalysisResult> {
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
