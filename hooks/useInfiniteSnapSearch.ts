"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { searchSnapsAction } from "@/app/actions/search";

export function useInfiniteSnapSearch(params: {
  query?: string;
  styles?: string[];
  colorCategories?: string[];
}) {
  const { query, styles, colorCategories } = params;

  const hasQuery = Boolean(query?.trim());
  const hasStyles = (styles?.length ?? 0) > 0;
  const hasColors = (colorCategories?.length ?? 0) > 0;

  return useInfiniteQuery({
    queryKey: ["snap-search", query, styles, colorCategories],
    queryFn: ({ pageParam }) =>
      searchSnapsAction({
        query: query?.trim() || undefined,
        styles,
        colorCategories,
        page: pageParam,
        pageSize: 30,
      }),
    initialPageParam: 1,
    getNextPageParam: (last) => {
      if (last.error || last.data === null) return undefined;
      if (!last.data.hasMore) return undefined;
      return last.data.page + 1;
    },
    enabled: hasQuery || hasStyles || hasColors,
  });
}
