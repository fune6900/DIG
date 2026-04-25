import Link from "next/link";
import { OotdNewPageClient } from "./OotdNewPageClient";
import { ChevronLeftIcon } from "@/components/ui/icons";

export default function OotdNewPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <header className="mb-8 flex items-center gap-4">
        <Link
          href="/ootd"
          className="rounded-sm p-1.5 text-denim/40 hover:text-denim dark:text-offwhite/40 dark:hover:text-offwhite transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim focus-visible:ring-offset-2"
          aria-label="戻る"
        >
          <ChevronLeftIcon width={20} height={20} />
        </Link>
        <h1 className="font-display text-3xl tracking-widest text-denim-dark dark:text-offwhite">
          今日のコーデ
        </h1>
      </header>

      <OotdNewPageClient />
    </main>
  );
}
