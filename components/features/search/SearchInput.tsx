"use client";

import { useEffect, useState } from "react";
import { SearchIcon, ImageIcon } from "@/components/ui/icons";
import {
  parseKeywordIntoChips,
  removeChipFromKeyword,
} from "@/lib/conditions-keyword";

interface SearchInputProps {
  onSearch: (query: string) => void;
  onImageSearch: () => void;
  initialQuery?: string;
}

export function SearchInput({
  onSearch,
  onImageSearch,
  initialQuery = "",
}: SearchInputProps) {
  const [value, setValue] = useState(initialQuery);

  // 親 (URL) が変わったときに表示を追従させる
  useEffect(() => {
    setValue(initialQuery);
  }, [initialQuery]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = value.trim();
    if (trimmed.length === 0) return;
    onSearch(trimmed);
  }

  function handleRemoveChip(chip: string) {
    const next = removeChipFromKeyword(value, chip);
    setValue(next);
    onSearch(next);
  }

  const chips = parseKeywordIntoChips(value);
  const showChips = chips.length >= 2;

  return (
    <div className="space-y-2 w-full">
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 w-full"
        role="search"
      >
        <div className="relative flex-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-denim/40 dark:text-offwhite/30">
            <SearchIcon width={16} height={16} />
          </span>
          <input
            type="text"
            role="textbox"
            aria-label="検索キーワード"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="キーワードを入力（例: M-65、デニムジャケット）"
            className="w-full rounded-none border border-denim/20 bg-offwhite dark:bg-canvas-subtle dark:border-denim-light/20 py-2.5 pl-9 pr-4 text-sm text-denim-dark dark:text-offwhite placeholder:text-denim/30 dark:placeholder:text-offwhite/30 focus:border-denim dark:focus:border-denim-light focus:outline-none focus:ring-1 focus:ring-denim dark:focus:ring-denim-light transition-colors"
          />
        </div>
        <button
          type="submit"
          aria-label="検索"
          className="inline-flex items-center gap-1.5 rounded-none border border-denim bg-denim px-4 py-2.5 text-sm font-medium tracking-wide text-offwhite transition-colors hover:bg-denim-dark hover:border-denim-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim focus-visible:ring-offset-2 dark:border-denim-light dark:bg-denim-light dark:hover:bg-denim whitespace-nowrap"
        >
          <SearchIcon width={14} height={14} />
          検索
        </button>
      </form>

      {showChips && (
        <ul className="flex flex-wrap gap-1.5" aria-label="検索条件">
          {chips.map((chip, index) => (
            <li key={`${chip}-${index}`}>
              <button
                type="button"
                onClick={() => handleRemoveChip(chip)}
                aria-label={`${chip}を削除`}
                className="inline-flex items-center gap-1 rounded-none border border-denim/30 bg-offwhite px-2 py-1 text-xs text-denim transition-colors hover:border-denim hover:bg-denim/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim focus-visible:ring-offset-2 dark:border-offwhite/30 dark:bg-canvas-subtle dark:text-offwhite dark:hover:border-offwhite dark:hover:bg-offwhite/5"
              >
                <span>{chip}</span>
                <span
                  aria-hidden="true"
                  className="text-denim/50 dark:text-offwhite/50"
                >
                  ×
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={onImageSearch}
          className="inline-flex items-center gap-1.5 text-xs text-denim/50 dark:text-offwhite/40 hover:text-denim dark:hover:text-offwhite transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim focus-visible:ring-offset-2"
        >
          <ImageIcon width={12} height={12} />
          画像で検索
        </button>
      </div>
    </div>
  );
}
