"use client";

import { useState } from "react";
import { SearchIcon } from "@/components/ui/icons";

interface SearchInputProps {
  onSearch: (query: string) => void;
  initialQuery?: string;
}

export function SearchInput({ onSearch, initialQuery = "" }: SearchInputProps) {
  const [value, setValue] = useState(initialQuery);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = value.trim();
    if (trimmed.length === 0) return;
    onSearch(trimmed);
  }

  return (
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
  );
}
