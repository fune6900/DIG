"use server";

import { SnapSearchInputSchema } from "@/types/snap";
import type { SnapSummary } from "@/types/snap";
import {
  findSnapsByQuery,
  upsertPexelsSnaps,
  upsertSnaps,
} from "@/services/snap-service";
import { searchUnsplashPhotos } from "@/services/unsplash-service";
import { searchPexelsPhotos } from "@/services/pexels-service";

/**
 * Unsplash と Pexels を Promise.allSettled で並列取得し、得られたものを DB
 * にキャッシュする。両方失敗時は `fetchedFromApi=false`、片方成功時は
 * 成功側の totalPages を採用する。
 */
async function fetchAndCacheFromSources(
  query: string,
  page: number,
  pageSize: number,
): Promise<{ fetchedFromApi: boolean; totalPages: number }> {
  const [unsplashResult, pexelsResult] = await Promise.allSettled([
    searchUnsplashPhotos({ query, page, perPage: pageSize }),
    searchPexelsPhotos({ query, page, perPage: pageSize }),
  ]);

  let fetchedFromApi = false;
  let totalPages = 0;

  if (unsplashResult.status === "fulfilled") {
    const { photos, totalPages: tp } = unsplashResult.value;
    try {
      await upsertSnaps(photos, query);
      fetchedFromApi = true;
      totalPages = Math.max(totalPages, tp);
    } catch {
      // DB 書き込み失敗は黙殺（後段 findSnapsByQuery で初回 items を返す）
    }
  }

  if (pexelsResult.status === "fulfilled") {
    const { photos, totalPages: tp } = pexelsResult.value;
    try {
      await upsertPexelsSnaps(photos, query);
      fetchedFromApi = true;
      totalPages = Math.max(totalPages, tp);
    } catch {
      // 同上
    }
  }

  return { fetchedFromApi, totalPages };
}

type ActionResult<T> =
  | { data: T; error: null }
  | { data: null; error: { message: string; code: string } };

export async function searchSnapsAction(input: unknown): Promise<
  ActionResult<{
    items: SnapSummary[];
    hasMore: boolean;
    page: number;
  }>
> {
  const parsed = SnapSearchInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      data: null,
      error: { message: "Invalid input", code: "VALIDATION_ERROR" },
    };
  }

  const { query, styles, colorCategories, page, pageSize } = parsed.data;

  // フィルタのみ（query なし）→ DB 照会のみ、Unsplash 補完なし
  const hasQuery = Boolean(query);
  const hasFilters =
    (styles?.length ?? 0) > 0 || (colorCategories?.length ?? 0) > 0;

  if (!hasQuery || hasFilters) {
    // query があってもフィルタ付きの場合は一発 DB 照会
    // query なしの場合もここを通る
    if (!hasQuery && !hasFilters) {
      // refine で弾かれているはずだが念のため
      return {
        data: null,
        error: { message: "Invalid input", code: "VALIDATION_ERROR" },
      };
    }

    if (hasQuery && hasFilters) {
      // query + フィルタ: Unsplash 補完あり（query で補完して、フィルタで絞る）
      const initialItems = await findSnapsByQuery({
        query,
        styles,
        colorCategories,
        page,
        pageSize,
      });

      const shouldFetchFromApi =
        initialItems.length < pageSize &&
        (page === 1 || initialItems.length > 0);

      if (shouldFetchFromApi) {
        let items = initialItems;

        const { fetchedFromApi, totalPages } = await fetchAndCacheFromSources(
          query as string,
          page,
          pageSize,
        );

        if (fetchedFromApi) {
          items = await findSnapsByQuery({
            query,
            styles,
            colorCategories,
            page,
            pageSize,
          });
        }

        const hasMore = fetchedFromApi
          ? totalPages > page
          : items.length === pageSize;

        return {
          data: { items, hasMore, page },
          error: null,
        };
      }

      const hasMore = initialItems.length === pageSize;
      return {
        data: { items: initialItems, hasMore, page },
        error: null,
      };
    }

    // フィルタのみ（query なし）
    const items = await findSnapsByQuery({
      query,
      styles,
      colorCategories,
      page,
      pageSize,
    });

    return {
      data: { items, hasMore: items.length === pageSize, page },
      error: null,
    };
  }

  // query のみ（フィルタなし）: 既存の Unsplash 補完ロジック
  const initialItems = await findSnapsByQuery({ query, page, pageSize });

  // キャッシュ不足時は要求 page を Unsplash から補完する。
  // ただし page>1 で DB に 1 件もキャッシュが無い場合は「末尾を超えた」と
  // 判断して Unsplash を呼ばない（無駄な API コール・無限ループ防止）。
  // page=1 で 0 件 のときは Unsplash で初回フェッチが必要なので補完する。
  const shouldFetchFromApi =
    initialItems.length < pageSize && (page === 1 || initialItems.length > 0);

  if (shouldFetchFromApi) {
    let items = initialItems;

    const { fetchedFromApi, totalPages } = await fetchAndCacheFromSources(
      query as string,
      page,
      pageSize,
    );

    if (fetchedFromApi) {
      items = await findSnapsByQuery({ query, page, pageSize });
    }

    const hasMore = fetchedFromApi
      ? totalPages > page
      : items.length === pageSize;

    return {
      data: { items, hasMore, page },
      error: null,
    };
  }

  const hasMore = initialItems.length === pageSize;

  return {
    data: { items: initialItems, hasMore, page },
    error: null,
  };
}
