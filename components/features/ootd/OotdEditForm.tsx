"use client";

import { useState } from "react";
import { CheckIcon, CloseIcon, PlusIcon } from "@/components/ui/icons";
import { Spinner } from "@/components/ui/Spinner";
import type { Ootd } from "@/types/ootd";

interface OotdEditFormProps {
  ootd: Ootd;
  onSubmit: (data: { date: Date; tags: string[] }) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

const MAX_TAGS = 3;
// `<input type="date">` の value は ISO 8601 ローカル日付 (YYYY-MM-DD)。
// JS の Date とのやり取りはローカルタイムで行い UTC ずれを避ける。
const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

export function formatDateInput(date: Date): string {
  const y = date.getFullYear().toString().padStart(4, "0");
  const m = (date.getMonth() + 1).toString().padStart(2, "0");
  const d = date.getDate().toString().padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function parseDateInput(value: string): Date | null {
  const match = ISO_DATE_PATTERN.exec(value.trim());
  if (!match) return null;
  const y = Number(match[1]);
  const m = Number(match[2]);
  const d = Number(match[3]);
  const date = new Date(y, m - 1, d);
  if (
    date.getFullYear() !== y ||
    date.getMonth() !== m - 1 ||
    date.getDate() !== d
  ) {
    return null;
  }
  return date;
}

export function OotdEditForm({
  ootd,
  onSubmit,
  onCancel,
  isSubmitting,
}: OotdEditFormProps) {
  const [dateValue, setDateValue] = useState(formatDateInput(ootd.date));
  const [tags, setTags] = useState<string[]>(ootd.tags);
  const [tagInput, setTagInput] = useState("");
  const [dateError, setDateError] = useState<string | null>(null);

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

  function handleTagKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const parsed = parseDateInput(dateValue);
    if (!parsed) {
      setDateError("有効な日付を選択してください");
      return;
    }
    setDateError(null);
    onSubmit({ date: parsed, tags });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-1.5">
        <label
          htmlFor="ootd-edit-date"
          className="text-xs font-bold tracking-widest uppercase text-denim/40 dark:text-offwhite/30"
        >
          投稿年月日
        </label>
        <input
          id="ootd-edit-date"
          type="date"
          value={dateValue}
          onChange={(e) => setDateValue(e.target.value)}
          aria-invalid={dateError !== null}
          aria-describedby={dateError ? "ootd-edit-date-error" : undefined}
          className="w-full rounded-sm border border-denim/15 bg-offwhite dark:bg-canvas-subtle px-3 py-2 text-sm text-denim-dark dark:text-offwhite focus:outline-none focus:ring-2 focus:ring-denim focus:ring-offset-1"
        />
        {dateError && (
          <p
            id="ootd-edit-date-error"
            role="alert"
            className="text-xs text-rust dark:text-rust-light"
          >
            {dateError}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold tracking-widest uppercase text-denim/40 dark:text-offwhite/30">
          タグ{" "}
          <span className="text-denim/30 dark:text-offwhite/20 normal-case tracking-normal">
            （最大{MAX_TAGS}つ）
          </span>
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
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
                {tag}
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

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-sm border border-denim/20 dark:border-offwhite/20 px-4 py-2.5 text-sm font-medium text-denim/70 dark:text-offwhite/60 hover:bg-denim/5 dark:hover:bg-offwhite/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim focus-visible:ring-offset-2"
        >
          <CloseIcon width={14} height={14} />
          キャンセル
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-sm bg-denim px-4 py-2.5 text-sm font-medium tracking-widest text-offwhite hover:bg-denim-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim focus-visible:ring-offset-2"
        >
          {isSubmitting ? (
            <>
              <Spinner size="sm" variant="light" />
              保存中...
            </>
          ) : (
            <>
              <CheckIcon width={14} height={14} />
              保存
            </>
          )}
        </button>
      </div>
    </form>
  );
}
