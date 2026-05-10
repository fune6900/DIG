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

  function handleSearch(q: string) {
    setQuery(q);
    router.push(`/search?query=${encodeURIComponent(q)}`);
  }

  const { data, hasNextPage, isFetchingNextPage, isPending, fetchNextPage } =
    useInfiniteSnapSearch(query);

  const snaps: SnapSummary[] =
    data?.pages.flatMap((p) => p.data?.items ?? []) ?? [];

  const hasMore = hasNextPage ?? false;
  const isLoading =
    isFetchingNextPage || (isPending && query.trim().length > 0);

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
