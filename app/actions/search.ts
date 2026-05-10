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

  // キャッシュ不足時は要求 page を Unsplash から補完する。page=1 に限定すると
  // 2ページ目以降が空で打ち止めになるため、全ページで補完を試みる。
  if (initialItems.length < pageSize) {
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
