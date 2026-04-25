"use client";

import { useState } from "react";
import { CheckIcon, PlusIcon } from "@/components/ui/icons";
import { Spinner } from "@/components/ui/Spinner";
import type { OotdAnalysisResult } from "@/types/ootd";

interface OotdRegisterFormProps {
  analysisResult: OotdAnalysisResult;
  imageUrl: string;
  onSubmit: (data: { tags: string[] }) => void;
  isSubmitting: boolean;
}

const MAX_TAGS = 3;

const formattedToday = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
}).format(new Date());

export function OotdRegisterForm({
  analysisResult,
  onSubmit,
  isSubmitting,
}: OotdRegisterFormProps) {
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  function handleAddTag() {
    const trimmed = tagInput.trim().replace(/^#/, "");
    if (!trimmed || tags.length >= MAX_TAGS || tags.includes(trimmed)) {
      return;
    }
    setTags((prev) => [...prev, trimmed]);
    setTagInput("");
  }

  function handleRemoveTag(tag: string) {
    setTags((prev) => prev.filter((t) => t !== tag));
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    onSubmit({ tags });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-1">
        <p className="text-xl font-display tracking-widest text-denim-dark dark:text-offwhite">
          {analysisResult.oneLiner}
        </p>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-bold tracking-widest uppercase text-denim/40 dark:text-offwhite/30">
          Date
        </label>
        <input
          type="text"
          value={formattedToday}
          disabled
          className="w-full rounded-sm border border-denim/15 bg-offwhite-subtle dark:bg-canvas px-3 py-2 text-sm text-denim-dark dark:text-offwhite opacity-50 cursor-not-allowed"
          aria-label="投稿日（自動設定）"
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold tracking-widest uppercase text-denim/40 dark:text-offwhite/30">
          Tags{" "}
          <span className="text-denim/30 dark:text-offwhite/20 normal-case tracking-normal">
            （最大{MAX_TAGS}つ）
          </span>
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="タグを入力（例: 古着）"
            disabled={tags.length >= MAX_TAGS}
            maxLength={30}
            className="flex-1 rounded-sm border border-denim/15 bg-offwhite dark:bg-canvas-subtle px-3 py-2 text-sm text-denim-dark dark:text-offwhite placeholder:text-denim/30 dark:placeholder:text-offwhite/20 focus:outline-none focus:ring-2 focus:ring-denim focus:ring-offset-1 disabled:opacity-40 disabled:cursor-not-allowed"
          />
          <button
            type="button"
            onClick={handleAddTag}
            disabled={tags.length >= MAX_TAGS || !tagInput.trim()}
            className="inline-flex items-center gap-1.5 rounded-sm bg-denim px-4 py-2 text-sm font-medium text-offwhite hover:bg-denim-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim focus-visible:ring-offset-2"
          >
            <PlusIcon width={14} height={14} />
            追加
          </button>
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 rounded-sm bg-denim/10 dark:bg-denim-light/10 px-2.5 py-1 text-xs font-medium text-denim-dark dark:text-offwhite"
              >
                #{tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  aria-label={`${tag}を削除`}
                  className="text-denim/40 hover:text-rust dark:text-offwhite/40 dark:hover:text-rust-light transition-colors"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex w-full items-center justify-center gap-2 rounded-sm bg-denim py-3 text-sm font-medium tracking-widest text-offwhite hover:bg-denim-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim focus-visible:ring-offset-2"
      >
        {isSubmitting ? (
          <>
            <Spinner size="sm" variant="light" />
            登録中...
          </>
        ) : (
          <>
            <CheckIcon width={16} height={16} />
            追加する
          </>
        )}
      </button>
    </form>
  );
}
