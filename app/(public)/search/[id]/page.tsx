import Link from "next/link";
import { ChevronLeftIcon } from "@/components/ui/icons";

interface PageProps {
  params: Promise<{ id: string }>;
}

// 詳細画面の本実装は PR3 で行う。PR1 マージ時点での 404 動線を防ぐ目的で
// プレースホルダを用意し、検索結果一覧へ戻る導線のみ提供する。
export default async function SnapDetailPlaceholderPage({ params }: PageProps) {
  await params;

  return (
    <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <div className="flex flex-col items-center justify-center gap-6 text-center">
        <h1 className="font-display text-3xl tracking-widest text-denim-dark dark:text-offwhite">
          準備中
        </h1>
        <p className="max-w-md text-sm leading-relaxed text-denim/60 dark:text-offwhite/50">
          このコーデの詳細画面は近日公開予定。
          <br />
          AI 解析によるカラー・スタイル分析と類似コーデを表示する機能を PR3
          で導入する。
        </p>
        <Link
          href="/search"
          className="inline-flex items-center gap-1.5 rounded-none border border-denim bg-denim px-5 py-2.5 text-sm font-medium tracking-wide text-offwhite transition-colors hover:bg-denim-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim focus-visible:ring-offset-2 dark:border-denim-light dark:bg-denim-light"
        >
          <ChevronLeftIcon width={14} height={14} />
          検索に戻る
        </Link>
      </div>
    </main>
  );
}
