"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { Badge } from "@/components/ui/Badge";
import { OotdColorPalette } from "@/components/features/ootd/OotdColorPalette";
import { OotdStyleGauge } from "@/components/features/ootd/OotdStyleGauge";
import { OotdItemList } from "@/components/features/ootd/OotdItemList";
import { OotdEvaluationRadar } from "@/components/features/ootd/OotdEvaluationRadar";
import { ChevronLeftIcon, CloseIcon, TrashIcon } from "@/components/ui/icons";
import type { Ootd } from "@/types/ootd";

interface OotdDetailProps {
  ootd: Ootd;
  onDelete: (id: string) => void;
  onBack?: () => void;
}

export function OotdDetail({ ootd, onDelete, onBack }: OotdDetailProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  // 確認ダイアログは親モーダルの transform スタッキングを抜けるため document.body へ
  // ポータルする。lazy initializer は SSR では null になり、初期描画時 showConfirm は
  // false のためポータル自体が描画されず、hydration mismatch は発生しない。
  const [portalNode] = useState<HTMLElement | null>(() =>
    typeof document !== "undefined" ? document.body : null,
  );

  const formattedDate = new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(ootd.date);

  return (
    <>
      <article className="mx-auto max-w-2xl space-y-8">
        <header className="space-y-3">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              aria-label="戻る"
              className="inline-flex items-center gap-1 text-xs font-medium tracking-widest uppercase text-denim/50 hover:text-denim dark:text-offwhite/40 dark:hover:text-offwhite transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim focus-visible:ring-offset-2 rounded-sm"
            >
              <ChevronLeftIcon width={14} height={14} />
              戻る
            </button>
          )}
          <h1 className="font-display text-3xl tracking-widest text-denim-dark dark:text-offwhite leading-tight">
            {ootd.oneLiner}
          </h1>
          <time
            dateTime={ootd.date.toISOString()}
            className="block text-sm text-denim/50 dark:text-offwhite/40"
          >
            {formattedDate}
          </time>
          {ootd.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {ootd.tags.map((tag) => (
                <Badge key={tag} variant="outline">
                  #{tag}
                </Badge>
              ))}
            </div>
          )}
        </header>

        <div className="relative w-full aspect-[3/4] rounded-sm overflow-hidden bg-denim-dark dark:bg-canvas">
          <Image
            src={ootd.imageUrl}
            alt={ootd.oneLiner}
            fill
            sizes="(max-width: 768px) 100vw, 672px"
            className="object-cover"
            priority
          />
        </div>

        <section className="space-y-2">
          <h2 className="text-xs font-bold tracking-widest uppercase text-denim/40 dark:text-offwhite/30">
            Description
          </h2>
          <p className="text-sm leading-relaxed text-denim/70 dark:text-offwhite/60">
            {ootd.description}
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xs font-bold tracking-widest uppercase text-denim/40 dark:text-offwhite/30">
            Color Palette
          </h2>
          <OotdColorPalette colorPalette={ootd.colorPalette} />
        </section>

        <section className="space-y-3">
          <h2 className="text-xs font-bold tracking-widest uppercase text-denim/40 dark:text-offwhite/30">
            Style
          </h2>
          <OotdStyleGauge styles={ootd.styles} />
        </section>

        {ootd.detectedItems.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-xs font-bold tracking-widest uppercase text-denim/40 dark:text-offwhite/30">
              Items
            </h2>
            <OotdItemList items={ootd.detectedItems} />
          </section>
        )}

        {ootd.radarScores && (
          <section className="space-y-3">
            <h2 className="text-xs font-bold tracking-widest uppercase text-denim/40 dark:text-offwhite/30">
              Evaluation
            </h2>
            <OotdEvaluationRadar scores={ootd.radarScores} />
          </section>
        )}

        <div className="pt-4 border-t border-denim/10 dark:border-offwhite/10">
          <button
            type="button"
            onClick={() => setShowConfirm(true)}
            aria-label="削除"
            className="inline-flex items-center gap-1.5 rounded-sm px-4 py-2 text-sm font-medium text-rust dark:text-rust-light border border-rust/30 dark:border-rust-light/30 hover:bg-rust/5 dark:hover:bg-rust-light/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rust focus-visible:ring-offset-2"
          >
            <TrashIcon width={14} height={14} />
            削除
          </button>
        </div>
      </article>

      {showConfirm &&
        portalNode &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-dialog-title"
            className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          >
            <div
              className="absolute inset-0 bg-black/40 dark:bg-black/60"
              onClick={() => setShowConfirm(false)}
              aria-hidden="true"
            />

            <div className="relative z-10 w-full max-w-sm rounded-sm bg-offwhite dark:bg-canvas-subtle border border-denim/10 dark:border-offwhite/10 shadow-xl p-6 space-y-5">
              <div className="space-y-2">
                <h2
                  id="delete-dialog-title"
                  className="text-base font-medium tracking-wide text-denim-dark dark:text-offwhite"
                >
                  本当に削除してよろしいですか？
                </h2>
                <p className="text-sm text-denim/50 dark:text-offwhite/40">
                  この操作は取り消せません。
                </p>
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowConfirm(false)}
                  className="inline-flex items-center gap-1.5 rounded-sm px-4 py-2 text-sm font-medium border border-denim/20 dark:border-offwhite/20 text-denim/70 dark:text-offwhite/60 hover:bg-denim/5 dark:hover:bg-offwhite/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim focus-visible:ring-offset-2"
                >
                  <CloseIcon width={14} height={14} />
                  キャンセル
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowConfirm(false);
                    onDelete(ootd.id);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-sm px-4 py-2 text-sm font-medium bg-rust dark:bg-rust-light text-offwhite dark:text-canvas hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rust focus-visible:ring-offset-2"
                >
                  <TrashIcon width={14} height={14} />
                  削除する
                </button>
              </div>
            </div>
          </div>,
          portalNode,
        )}
    </>
  );
}
