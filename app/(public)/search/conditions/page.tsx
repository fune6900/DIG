import { Suspense } from "react";
import Link from "next/link";
import { ConditionsRouteClient } from "./ConditionsRouteClient";

function FullScreenLoader() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-denim border-t-transparent dark:border-denim-light dark:border-t-transparent" />
    </div>
  );
}

export default function ConditionsPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 pb-10 pt-6 sm:px-6">
      {/* ナビゲーション */}
      <Link
        href="/search"
        className="mb-4 inline-flex items-center gap-1 text-sm text-denim/70 transition-colors hover:text-denim dark:text-denim-light/70 dark:hover:text-denim-light"
      >
        <span aria-hidden="true">←</span>
        検索に戻る
      </Link>

      {/* 見出し */}
      <h1 className="mb-6 text-xl font-bold tracking-wide text-denim-dark dark:text-offwhite">
        こだわり条件
      </h1>

      <Suspense fallback={<FullScreenLoader />}>
        <ConditionsRouteClient />
      </Suspense>
    </main>
  );
}
