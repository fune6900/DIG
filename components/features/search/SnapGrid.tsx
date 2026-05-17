"use client";

import { useEffect, useRef } from "react";
import type { SnapSummary } from "@/types/snap";
import { SnapCard } from "./SnapCard";
import { FadeIn } from "@/components/ui/motion";
import { Spinner } from "@/components/ui/Spinner";

interface SnapGridProps {
  snaps: SnapSummary[];
  hasMore: boolean;
  isLoading: boolean;
  onLoadMore: () => void;
}

export function SnapGrid({
  snaps,
  hasMore,
  isLoading,
  onLoadMore,
}: SnapGridProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hasMore || isLoading) return;

    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver((entries) => {
      const entry = entries[0];
      if (entry.isIntersecting && hasMore && !isLoading) {
        onLoadMore();
      }
    });

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [hasMore, isLoading, onLoadMore]);

  if (snaps.length === 0 && !isLoading) {
    return (
      <div
        data-testid="snap-grid"
        className="flex flex-col items-center justify-center py-24 text-center"
      >
        <p className="text-sm text-denim/50 dark:text-offwhite/40">
          該当するコーデが見つかりません
        </p>
      </div>
    );
  }

  return (
    <div data-testid="snap-grid">
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
        {snaps.map((snap, idx) => (
          // 初回 mount 時にカードを軽くフェードイン。無限スクロールで late item
          // が長く待たないように delay を上限 0.3s で打ち切る。once:true なので
          // 再ロード時に発火しない。
          <FadeIn key={snap.id} y={8} delay={Math.min(idx * 0.03, 0.3)}>
            <SnapCard snap={snap} />
          </FadeIn>
        ))}
      </div>

      <div ref={sentinelRef} className="h-px w-full" aria-hidden="true" />

      {isLoading && (
        <div className="flex justify-center py-8">
          <Spinner size="md" />
        </div>
      )}
    </div>
  );
}
