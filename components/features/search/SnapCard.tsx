import Image from "next/image";
import Link from "next/link";
import { HoverLift } from "@/components/ui/motion";
import type { SnapSource, SnapSummary } from "@/types/snap";

interface SnapCardProps {
  snap: SnapSummary;
}

// 内部 source 値を UI 表示用ラベルへマップ。
// "pexels" は意図的に "Pinterest" と表示する（ブランディング都合・要件）。
const SOURCE_LABEL: Record<SnapSource, string> = {
  unsplash: "Unsplash",
  pexels: "Pinterest",
};

export function SnapCard({ snap }: SnapCardProps) {
  const alt = snap.authorName
    ? `${snap.authorName} のスナップ`
    : "スナップ画像";

  const sourceLabel = SOURCE_LABEL[snap.source];

  return (
    <HoverLift lift={3} scale={1.015}>
      <Link
        href={`/search/${snap.id}`}
        data-testid="snap-card"
        className="block aspect-[3/4] overflow-hidden bg-denim-dark/10 dark:bg-canvas-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim focus-visible:ring-offset-2"
      >
        <div className="relative h-full w-full overflow-hidden">
          <Image
            src={snap.imageUrl}
            alt={alt}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw"
            className="object-cover transition-transform duration-500 ease-out hover:scale-[1.04]"
          />
          <span
            data-testid="snap-source-badge"
            className="pointer-events-none absolute left-2 top-2 inline-flex items-center bg-denim-dark/80 px-2 py-0.5 text-2xs font-medium tracking-[0.2em] text-offwhite uppercase"
          >
            {sourceLabel}
          </span>
        </div>
      </Link>
    </HoverLift>
  );
}
