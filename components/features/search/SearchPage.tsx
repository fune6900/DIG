"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useInfiniteSnapSearch } from "@/hooks/useInfiniteSnapSearch";
import { SearchInput } from "./SearchInput";
import { ConditionsLink } from "./ConditionsLink";
import { SnapGrid } from "./SnapGrid";
import { ImagePickerSheet } from "./ImagePickerSheet";
import { ScrollToTopButton } from "@/components/ui/ScrollToTopButton";
import { Spinner } from "@/components/ui/Spinner";
import { analyzeImageForSearchAction } from "@/app/actions/image-search";
import {
  uploadImageToStorage,
  buildImageSearchUrl,
} from "@/lib/upload-image-client";
import type { SnapSummary } from "@/types/snap";

export function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [query, setQuery] = useState(searchParams.get("query") ?? "");

  const [sheetOpen, setSheetOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);

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
    const search = params.toString();
    router.push(search ? `/search?${search}` : "/search");
  }

  async function handleImagePick(file: File) {
    setSheetOpen(false);
    setImageError(null);
    setIsAnalyzing(true);

    let uploadedUrl: string;
    try {
      uploadedUrl = await uploadImageToStorage(file);
    } catch (err) {
      console.error("[SearchPage] image upload failed", err);
      setImageError(
        "画像のアップロードに失敗しました。ネットワークを確認してもう一度お試しください。",
      );
      setIsAnalyzing(false);
      return;
    }

    try {
      const result = await analyzeImageForSearchAction({
        imageUrl: uploadedUrl,
      });
      if (result.error !== null) {
        setImageError(
          result.error.message ??
            "解析に失敗しました。もう一度お試しください。",
        );
        return;
      }
      const { styles: detectedStyles, colorCategories: detectedColors } =
        result.data;
      // 画像検索は styles/colors の URL に切り替わるので、テキスト検索の
      // query state が残らないようにクリアする
      setQuery("");
      router.push(buildImageSearchUrl(detectedStyles, detectedColors));
    } catch (err) {
      console.error("[SearchPage] image analysis failed", err);
      setImageError("解析中にエラーが発生しました。もう一度お試しください。");
    } finally {
      setIsAnalyzing(false);
    }
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
        <SearchInput
          onSearch={handleSearch}
          onImageSearch={() => setSheetOpen(true)}
          initialQuery={query}
        />
        <ConditionsLink />
      </div>

      {imageError && (
        <p role="alert" className="mb-3 text-xs text-rust dark:text-rust-light">
          {imageError}
        </p>
      )}

      <SnapGrid
        snaps={snaps}
        hasMore={hasMore}
        isLoading={isLoading}
        onLoadMore={fetchNextPage}
      />

      <ImagePickerSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onPick={(file) => void handleImagePick(file)}
      />

      {isAnalyzing && (
        <div
          role="status"
          aria-busy="true"
          aria-label="画像を解析中"
          className="fixed inset-0 z-40 flex items-center justify-center bg-canvas/70 backdrop-blur-sm dark:bg-canvas-dark/70"
        >
          <div className="flex flex-col items-center gap-3 border border-denim/20 bg-offwhite px-6 py-5 shadow-lg dark:border-offwhite/20 dark:bg-canvas-subtle">
            <Spinner size="md" />
            <span className="text-xs tracking-wide text-denim/70 dark:text-offwhite/60">
              解析中...
            </span>
          </div>
        </div>
      )}

      <ScrollToTopButton />
    </main>
  );
}
