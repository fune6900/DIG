"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useInfiniteSnapSearch } from "@/hooks/useInfiniteSnapSearch";
import { SearchInput } from "./SearchInput";
import { ConditionsLink } from "./ConditionsLink";
import { SnapGrid } from "./SnapGrid";
import { ScrollToTopButton } from "@/components/ui/ScrollToTopButton";
import type { SnapSummary } from "@/types/snap";

export function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [query, setQuery] = useState(searchParams.get("query") ?? "");

  const stylesParam = searchParams.get("styles");
  const colorsParam = searchParams.get("colors");

  const styles: string[] = stylesParam
    ? stylesParam.split(",").filter(Boolean)
    : [];
  const colorCategories: string[] = colorsParam
    ? colorsParam.split(",").filter(Boolean)
    : [];

  function handleSearch(q: string) {
    setQuery(q);
    const params = new URLSearchParams();
    if (q) params.set("query", q);
    if (stylesParam) params.set("styles", stylesParam);
    if (colorsParam) params.set("colors", colorsParam);
    router.push(`/search?${params.toString()}`);
  }

  const { data, hasNextPage, isFetchingNextPage, isPending, fetchNextPage } =
    useInfiniteSnapSearch({
      query: query || undefined,
      styles,
      colorCategories,
    });

  const snaps: SnapSummary[] =
    data?.pages.flatMap((p) => p.data?.items ?? []) ?? [];

  const hasMore = hasNextPage ?? false;
  const isLoading =
    isFetchingNextPage ||
    (isPending &&
      (query.trim().length > 0 ||
        styles.length > 0 ||
        colorCategories.length > 0));

  return (
    <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      <div className="mb-4 space-y-3">
        <SearchInput onSearch={handleSearch} initialQuery={query} />
        <ConditionsLink />
      </div>

      <SnapGrid
        snaps={snaps}
        hasMore={hasMore}
        isLoading={isLoading}
        onLoadMore={fetchNextPage}
      />

      <ScrollToTopButton />
    </main>
  );
}
