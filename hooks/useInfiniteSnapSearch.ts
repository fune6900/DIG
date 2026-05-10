"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { searchSnapsAction } from "@/app/actions/search";

export function useInfiniteSnapSearch(query: string) {
  return useInfiniteQuery({
    queryKey: ["snap-search", query],
    queryFn: ({ pageParam }) =>
      searchSnapsAction({ query, page: pageParam, pageSize: 30 }),
    initialPageParam: 1,
    getNextPageParam: (last) => {
      if (last.error || last.data === null) return undefined;
      if (!last.data.hasMore) return undefined;
      return last.data.page + 1;
    },
    enabled: query.trim().length > 0,
  });
}
