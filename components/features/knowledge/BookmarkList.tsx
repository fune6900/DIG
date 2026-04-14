"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useBookmark } from "@/hooks/useBookmark";
import { getKnowledgeByIdAction } from "@/app/actions/knowledge";
import { KnowledgeCard } from "@/components/features/knowledge/KnowledgeCard";
import { KnowledgeSummary } from "@/types/knowledge";

export function BookmarkList() {
  const { bookmarks } = useBookmark();
  const [items, setItems] = useState<KnowledgeSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchAll() {
      setLoading(true);
      if (bookmarks.length === 0) {
        if (!cancelled) {
          setItems([]);
          setLoading(false);
        }
        return;
      }
      const results = await Promise.all(
        bookmarks.map((b) => getKnowledgeByIdAction(b.knowledgeId)),
      );
      if (cancelled) return;

      const summaries: KnowledgeSummary[] = results
        .filter((r) => r.data !== null)
        .map((r) => {
          const d = r.data!;
          return {
            id: d.id,
            brand: d.brand,
            category: d.category,
            era: d.era,
            tags: d.tags,
            imageUrls: d.imageUrls,
          };
        });

      setItems(summaries);
      setLoading(false);
    }

    fetchAll();
    return () => {
      cancelled = true;
    };
  }, [bookmarks]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <span className="text-stone-400 text-sm">読み込み中...</span>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <p className="text-stone-500">まだブックマークがありません</p>
        <Link
          href="/knowledge"
          className="text-sm text-stone-700 underline underline-offset-4 hover:text-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-500 focus-visible:ring-offset-2 rounded"
        >
          古着図鑑を見る
        </Link>
      </div>
    );
  }

  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {items.map((knowledge) => (
        <li key={knowledge.id}>
          <KnowledgeCard knowledge={knowledge} />
        </li>
      ))}
    </ul>
  );
}
