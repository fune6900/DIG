"use client";

import { useRouter } from "next/navigation";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  baseUrl: string;
}

export function Pagination({
  currentPage,
  totalPages,
  baseUrl,
}: PaginationProps) {
  const router = useRouter();

  if (totalPages <= 1) return null;

  const buildUrl = (page: number) => {
    const url = new URL(baseUrl, "http://localhost");
    url.searchParams.set("page", String(page));
    return `${url.pathname}?${url.searchParams.toString()}`;
  };

  const handlePrev = () => {
    router.push(buildUrl(currentPage - 1));
  };

  const handleNext = () => {
    router.push(buildUrl(currentPage + 1));
  };

  return (
    <nav
      aria-label="ページネーション"
      className="flex items-center justify-center gap-3 py-6"
    >
      <button
        type="button"
        onClick={handlePrev}
        disabled={currentPage === 1}
        className="rounded-sm border border-denim/40 bg-offwhite px-4 py-2 text-sm font-medium text-denim transition-colors hover:bg-offwhite-subtle disabled:cursor-not-allowed disabled:opacity-40 dark:border-denim-light/40 dark:bg-canvas-subtle dark:text-denim-light dark:hover:bg-denim-dark"
      >
        前へ
      </button>
      <span className="text-sm text-denim/60 dark:text-offwhite/50">
        {currentPage} / {totalPages}
      </span>
      <button
        type="button"
        onClick={handleNext}
        disabled={currentPage === totalPages}
        className="rounded-sm border border-denim/40 bg-offwhite px-4 py-2 text-sm font-medium text-denim transition-colors hover:bg-offwhite-subtle disabled:cursor-not-allowed disabled:opacity-40 dark:border-denim-light/40 dark:bg-canvas-subtle dark:text-denim-light dark:hover:bg-denim-dark"
      >
        次へ
      </button>
    </nav>
  );
}
