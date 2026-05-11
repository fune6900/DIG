"use client";

import { useState } from "react";
import { STYLE_GROUPS } from "@/lib/style-groups";
import { StyleFilterGroup } from "./StyleFilterGroup";
import { ColorFilterGrid } from "./ColorFilterGrid";

interface ConditionsFormProps {
  initialQuery: string;
  initialStyles: string[];
  initialColors: string[];
  onSearch: (params: {
    query: string;
    styles: string[];
    colors: string[];
  }) => void;
  onReset: () => void;
}

export function ConditionsForm({
  initialQuery,
  initialStyles,
  initialColors,
  onSearch,
  onReset,
}: ConditionsFormProps) {
  const [query] = useState<string>(initialQuery);
  const [selectedStyles, setSelectedStyles] = useState<Set<string>>(
    () => new Set(initialStyles),
  );
  const [selectedColors, setSelectedColors] = useState<Set<string>>(
    () => new Set(initialColors),
  );

  function handleToggleStyle(styleName: string) {
    setSelectedStyles((prev) => {
      const next = new Set(prev);
      if (next.has(styleName)) {
        next.delete(styleName);
      } else {
        next.add(styleName);
      }
      return next;
    });
  }

  function handleToggleColor(categoryName: string) {
    setSelectedColors((prev) => {
      const next = new Set(prev);
      if (next.has(categoryName)) {
        next.delete(categoryName);
      } else {
        next.add(categoryName);
      }
      return next;
    });
  }

  function handleReset() {
    setSelectedStyles(new Set());
    setSelectedColors(new Set());
    onReset();
  }

  function handleSearch() {
    onSearch({
      query,
      styles: Array.from(selectedStyles),
      colors: Array.from(selectedColors),
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {/* スタイルフィルタ */}
      <section aria-label="スタイルフィルタ">
        {STYLE_GROUPS.map((group) => (
          <StyleFilterGroup
            key={group.name}
            group={group}
            selected={selectedStyles}
            onToggle={handleToggleStyle}
          />
        ))}
      </section>

      {/* カラーフィルタ */}
      <section aria-label="カラーフィルタ">
        <h3 className="mb-2 text-xs font-semibold tracking-widest text-denim/60 uppercase dark:text-denim-light/60">
          カラー
        </h3>
        <ColorFilterGrid
          selected={selectedColors}
          onToggle={handleToggleColor}
        />
      </section>

      {/* アクションボタン */}
      <div className="flex gap-3 pb-4">
        <button
          type="button"
          onClick={handleReset}
          className="flex-1 rounded-none border border-denim/30 bg-transparent px-4 py-3 text-sm font-medium tracking-wide text-denim transition-colors hover:border-denim hover:bg-denim/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim focus-visible:ring-offset-2 dark:border-denim-light/30 dark:text-denim-light dark:hover:border-denim-light dark:hover:bg-denim-light/10"
        >
          リセット
        </button>
        <button
          type="button"
          onClick={handleSearch}
          disabled={
            selectedStyles.size === 0 &&
            selectedColors.size === 0 &&
            query.trim().length === 0
          }
          className="flex-1 rounded-none border border-denim bg-denim px-4 py-3 text-sm font-medium tracking-wide text-offwhite transition-colors hover:bg-denim/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-denim dark:border-denim-light dark:bg-denim-light dark:text-canvas dark:disabled:hover:bg-denim-light"
        >
          検索
        </button>
      </div>
    </div>
  );
}
