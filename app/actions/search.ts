"use server";

import { SnapSearchInputSchema } from "@/types/snap";
import type { SnapSummary } from "@/types/snap";
import { findSnapsByQuery, upsertSnaps } from "@/services/snap-service";
import { searchUnsplashPhotos } from "@/services/unsplash-service";

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

  const { query, page, pageSize } = parsed.data;

  const initialItems = await findSnapsByQuery({ query, page, pageSize });

  // キャッシュ不足時は要求 page を Unsplash から補完する。
  // ただし page>1 で DB に 1 件もキャッシュが無い場合は「末尾を超えた」と
  // 判断して Unsplash を呼ばない（無駄な API コール・無限ループ防止）。
  // page=1 で 0 件 のときは Unsplash で初回フェッチが必要なので補完する。
  const shouldFetchFromApi =
    initialItems.length < pageSize && (page === 1 || initialItems.length > 0);

  if (shouldFetchFromApi) {
    let items = initialItems;
    let totalPages = 0;
    let fetchedFromApi = false;

    try {
      const { photos, totalPages: tp } = await searchUnsplashPhotos({
        query,
        page,
        perPage: pageSize,
      });
      totalPages = tp;
      await upsertSnaps(photos, query);
      items = await findSnapsByQuery({ query, page, pageSize });
      fetchedFromApi = true;
    } catch {
      // Unsplash 失敗時は初回取得の items をそのまま使う
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
