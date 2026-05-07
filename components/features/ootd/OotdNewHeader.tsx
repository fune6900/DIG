"use client";

import Link from "next/link";
import { ChevronLeftIcon } from "@/components/ui/icons";

interface OotdNewHeaderProps {
  isSubmitting: boolean;
  /**
   * 指定された場合は `/ootd` への Link ではなくボタンとして描画し、
   * 押下時にこのコールバックを呼ぶ。
   * register 画面で「分析プレビュー画面に戻る」ような内部遷移に使う。
   */
  onBack?: () => void;
}

const BACK_CLASS =
  "rounded-sm p-1.5 text-denim/40 hover:text-denim dark:text-offwhite/40 dark:hover:text-offwhite transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim focus-visible:ring-offset-2";

export function OotdNewHeader({ isSubmitting, onBack }: OotdNewHeaderProps) {
  return (
    <header className="mb-8 flex items-center gap-4">
      {!isSubmitting &&
        (onBack ? (
          <button
            type="button"
            onClick={onBack}
            className={BACK_CLASS}
            aria-label="戻る"
          >
            <ChevronLeftIcon width={20} height={20} />
          </button>
        ) : (
          <Link href="/ootd" className={BACK_CLASS} aria-label="戻る">
            <ChevronLeftIcon width={20} height={20} />
          </Link>
        ))}
      <h1 className="font-display text-3xl tracking-widest text-denim-dark dark:text-offwhite">
        今日のコーデ
      </h1>
    </header>
  );
}
