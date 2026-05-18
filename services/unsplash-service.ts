import { z } from "zod";

export interface UnsplashPhoto {
  id: string;
  urls: { regular: string; small: string };
  description: string | null;
  alt_description: string | null;
  user: { name: string; links: { html: string } };
  links: { html: string };
  tags?: { title: string }[];
}

const UnsplashPhotoSchema = z.object({
  id: z.string().min(1),
  urls: z.object({
    regular: z.url(),
    small: z.url(),
  }),
  description: z.string().nullable().optional(),
  alt_description: z.string().nullable().optional(),
  user: z.object({
    name: z.string(),
    links: z.object({ html: z.url() }),
  }),
  links: z.object({ html: z.url() }),
});

interface UnsplashApiResponse {
  total: number;
  total_pages: number;
  results: UnsplashPhoto[];
}

export async function searchUnsplashPhotos(params: {
  query: string;
  page: number;
  perPage: number;
}): Promise<{ photos: UnsplashPhoto[]; totalPages: number }> {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey) {
    throw new Error("UNSPLASH_ACCESS_KEY is not set");
  }

  const enhancedQuery = `${params.query} outfit fashion`;
  const searchParams = new URLSearchParams({
    query: enhancedQuery,
    page: String(params.page),
    per_page: String(params.perPage),
  });

  const url = `https://api.unsplash.com/search/photos?${searchParams.toString()}`;

  const response = await fetch(url, {
    signal: AbortSignal.timeout(8000),
    headers: {
      Authorization: `Client-ID ${accessKey}`,
    },
  });

  if (!response.ok) {
    throw new Error(
      `Unsplash API error: ${response.status} ${response.statusText}`,
    );
  }

  const data = (await response.json()) as UnsplashApiResponse;

  return {
    photos: data.results,
    totalPages: data.total_pages,
  };
}

/**
 * Unsplash /photos/random から 1 枚のランダム写真を取得する。
 *
 * - LP の Showcase で使用するため、API キー未設定・HTTP 失敗・ネットワーク
 *   エラー・スキーマ不整合のすべてで `null` を返し、呼び出し側がグラデーション
 *   等のフォールバックに切り替えられるようにする（throws しない）。
 * - `cache: "no-store"` で毎リクエスト新しい画像を取得する。
 */
export async function fetchRandomUnsplashPhoto(
  query: string,
): Promise<UnsplashPhoto | null> {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey) return null;

  const searchParams = new URLSearchParams({
    query,
    orientation: "portrait",
  });
  const url = `https://api.unsplash.com/photos/random?${searchParams.toString()}`;

  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
      headers: {
        Authorization: `Client-ID ${accessKey}`,
      },
    });

    if (!response.ok) return null;

    const data = (await response.json().catch(() => null)) as unknown;
    if (data === null) return null;

    const parsed = UnsplashPhotoSchema.safeParse(data);
    if (!parsed.success) return null;

    return parsed.data as UnsplashPhoto;
  } catch {
    return null;
  }
}
