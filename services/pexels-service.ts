import { z } from "zod";

// Pexels Search API のレスポンス型。UI 上は "Pinterest" バッジとして表示する
// が、内部実装・DB・型はすべて "pexels" で統一する。
export interface PexelsPhoto {
  id: number;
  width: number;
  height: number;
  url: string;
  photographer: string;
  photographer_url: string;
  src: {
    original: string;
    large: string;
    medium: string;
  };
  alt: string;
}

const PexelsPhotoSchema = z.object({
  id: z.number(),
  width: z.number().optional(),
  height: z.number().optional(),
  url: z.url(),
  photographer: z.string(),
  photographer_url: z.url(),
  src: z.object({
    original: z.url(),
    large: z.url(),
    medium: z.url().optional(),
  }),
  alt: z.string().optional(),
});

const PexelsApiResponseSchema = z.object({
  total_results: z.number().optional(),
  per_page: z.number().optional(),
  page: z.number().optional(),
  photos: z.array(z.unknown()),
});

/**
 * Pexels /v1/search を叩いてファッション系画像を取得する。
 *
 * 並列検索（Unsplash と Promise.allSettled で同時実行）で片方の失敗が
 * 全体を倒さないよう、すべての失敗パスで `{ photos: [], totalPages: 0 }`
 * を返す（throws しない）。
 */
export async function searchPexelsPhotos(params: {
  query: string;
  page: number;
  perPage: number;
}): Promise<{ photos: PexelsPhoto[]; totalPages: number }> {
  const accessKey = process.env.PEXELS_API_KEY;
  if (!accessKey) return { photos: [], totalPages: 0 };

  // Pexels は keyword ベース。fashion 系のサフィックスを付けて検索精度を底上げ。
  const enhancedQuery = `${params.query} outfit fashion`;
  const searchParams = new URLSearchParams({
    query: enhancedQuery,
    page: String(params.page),
    per_page: String(params.perPage),
  });

  const url = `https://api.pexels.com/v1/search?${searchParams.toString()}`;

  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(8000),
      // Pexels の Authorization は Bearer プレフィックスなしで API キーを直接渡す
      headers: { Authorization: accessKey },
    });

    if (!response.ok) return { photos: [], totalPages: 0 };

    const data = (await response.json().catch(() => null)) as unknown;
    if (data === null) return { photos: [], totalPages: 0 };

    const parsedEnvelope = PexelsApiResponseSchema.safeParse(data);
    if (!parsedEnvelope.success) return { photos: [], totalPages: 0 };

    // 配列内の不正要素は個別に弾いて有効分のみ返す
    const validPhotos: PexelsPhoto[] = [];
    for (const raw of parsedEnvelope.data.photos) {
      const parsed = PexelsPhotoSchema.safeParse(raw);
      if (parsed.success) validPhotos.push(parsed.data as PexelsPhoto);
    }

    const totalResults = parsedEnvelope.data.total_results ?? 0;
    const perPage = parsedEnvelope.data.per_page ?? params.perPage;
    const totalPages = perPage > 0 ? Math.ceil(totalResults / perPage) : 0;

    return { photos: validPhotos, totalPages };
  } catch {
    return { photos: [], totalPages: 0 };
  }
}
