import Image from "next/image";
import Link from "next/link";
import type { SnapSummary } from "@/types/snap";

interface SnapCardProps {
  snap: SnapSummary;
}

export function SnapCard({ snap }: SnapCardProps) {
  const alt = snap.authorName
    ? `${snap.authorName} のスナップ`
    : "スナップ画像";

  return (
    <Link
      href={`/search/${snap.id}`}
      data-testid="snap-card"
      className="block aspect-[3/4] overflow-hidden bg-denim-dark/10 dark:bg-canvas-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim focus-visible:ring-offset-2"
    >
      <div className="relative h-full w-full transition-opacity duration-200 hover:opacity-85">
        <Image
          src={snap.imageUrl}
          alt={alt}
          fill
          sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw"
          className="object-cover"
        />
      </div>
    </Link>
  );
}
