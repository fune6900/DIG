"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClockIcon, PlusIcon, UserIcon } from "@/components/ui/icons";

export function BottomNav() {
  const pathname = usePathname();
  if (pathname?.startsWith("/ootd/new")) {
    return null;
  }

  return (
    <nav
      aria-label="ボトムナビゲーション"
      className="md:hidden fixed bottom-0 inset-x-0 z-30 pointer-events-none"
    >
      <div className="relative h-20">
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-canvas/40 to-transparent dark:from-canvas/60"
        />

        <div className="pointer-events-auto absolute inset-x-0 bottom-3 flex items-end justify-around px-6">
          <Link
            href="/search"
            aria-label="着こなし検索"
            className="flex h-14 w-14 items-center justify-center rounded-full bg-offwhite/80 backdrop-blur-md text-denim-dark shadow-lg ring-1 ring-denim/10 transition-all hover:bg-offwhite hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim focus-visible:ring-offset-2 dark:bg-canvas-subtle/80 dark:text-offwhite dark:ring-offwhite/10"
          >
            <ClockIcon width={24} height={24} />
          </Link>

          <Link
            href="/ootd/new"
            aria-label="OOTDを追加"
            className="flex h-20 w-20 -translate-y-3 items-center justify-center rounded-full bg-denim text-offwhite shadow-2xl ring-4 ring-offwhite/90 dark:ring-canvas/90 transition-all hover:scale-105 hover:bg-denim-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim focus-visible:ring-offset-2"
          >
            <PlusIcon width={36} height={36} strokeWidth={2.5} />
          </Link>

          <Link
            href="/ootd"
            aria-label="自分のOOTD一覧"
            className="flex h-14 w-14 flex-col items-center justify-center rounded-full bg-offwhite/80 backdrop-blur-md text-denim-dark shadow-lg ring-1 ring-denim/10 transition-all hover:bg-offwhite hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim focus-visible:ring-offset-2 dark:bg-canvas-subtle/80 dark:text-offwhite dark:ring-offwhite/10"
          >
            <UserIcon width={20} height={20} />
            <span className="text-[9px] font-medium tracking-wider mt-0.5">
              自分
            </span>
          </Link>
        </div>
      </div>
    </nav>
  );
}
