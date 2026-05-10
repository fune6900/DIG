"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { OotdEditForm } from "@/components/features/ootd/OotdEditForm";
import { ChevronLeftIcon } from "@/components/ui/icons";
import { updateOotdAction } from "@/app/actions/ootd";
import type { Ootd } from "@/types/ootd";

interface OotdEditPageClientProps {
  ootd: Ootd;
}

export function OotdEditPageClient({ ootd }: OotdEditPageClientProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function goBackToDetail() {
    router.push(`/ootd/${ootd.id}`);
  }

  async function handleSubmit(data: { date: Date; tags: string[] }) {
    setIsSubmitting(true);
    setErrorMessage(null);
    const result = await updateOotdAction(ootd.id, data);
    setIsSubmitting(false);
    if (result.error) {
      setErrorMessage("保存に失敗した。時間を置いて再試行してくれ。");
      return;
    }
    router.push(`/ootd/${ootd.id}`);
    router.refresh();
  }

  return (
    <article className="mx-auto max-w-2xl space-y-8">
      <header className="space-y-3">
        <button
          type="button"
          onClick={goBackToDetail}
          aria-label="戻る"
          className="inline-flex items-center gap-1 text-xs font-medium tracking-widest uppercase text-denim/50 hover:text-denim dark:text-offwhite/40 dark:hover:text-offwhite transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim focus-visible:ring-offset-2 rounded-sm"
        >
          <ChevronLeftIcon width={14} height={14} />
          戻る
        </button>
        <h1 className="font-display text-2xl tracking-widest text-denim-dark dark:text-offwhite leading-tight">
          投稿の編集
        </h1>
      </header>

      {errorMessage && (
        <p
          role="alert"
          className="rounded-sm border border-rust/30 dark:border-rust-light/30 bg-rust/5 dark:bg-rust-light/5 px-3 py-2 text-sm text-rust dark:text-rust-light"
        >
          {errorMessage}
        </p>
      )}

      <OotdEditForm
        ootd={ootd}
        onSubmit={handleSubmit}
        onCancel={goBackToDetail}
        isSubmitting={isSubmitting}
      />
    </article>
  );
}
