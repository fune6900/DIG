import Link from "next/link";
import { ChevronLeftIcon } from "@/components/ui/icons";
import { ImageSearchUploader } from "@/components/features/search/ImageSearchUploader";

export const metadata = {
  title: "画像で検索 | DIG",
};

export default function ImageSearchPage() {
  return (
    <main className="mx-auto max-w-lg px-4 py-6 sm:px-6">
      <div className="mb-6">
        <Link
          href="/search"
          className="inline-flex items-center gap-1 text-sm text-denim/60 dark:text-offwhite/50 hover:text-denim dark:hover:text-offwhite transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim focus-visible:ring-offset-2"
        >
          <ChevronLeftIcon width={14} height={14} />
          検索に戻る
        </Link>
      </div>

      <div className="mb-6 space-y-1">
        <h1 className="text-lg font-semibold tracking-wide text-denim-dark dark:text-offwhite">
          画像で検索
        </h1>
        <p className="text-sm text-denim/50 dark:text-offwhite/40">
          コーデ写真をアップロードすると、スタイル・カラーを解析して類似コーデを探します。
        </p>
      </div>

      <ImageSearchUploader />
    </main>
  );
}
