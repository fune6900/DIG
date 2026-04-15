"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Spinner } from "@/components/ui/Spinner";

const DETAIL_TYPES = [
  "タグ",
  "縫製",
  "素材",
  "シルエット",
  "ディテール",
  "ジッパー",
  "ボタン",
  "ステッチ",
] as const;

interface KnowledgeSearchFormProps {
  defaultQuery?: string;
  defaultCategory?: string;
  defaultEra?: string;
  defaultDetailType?: string;
  categories: string[];
  eras: string[];
}

export function KnowledgeSearchForm({
  defaultQuery = "",
  defaultCategory = "",
  defaultEra = "",
  defaultDetailType = "",
  categories,
  eras,
}: KnowledgeSearchFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);

    const params = new URLSearchParams();
    const q = data.get("q");
    const category = data.get("category");
    const era = data.get("era");
    const detail = data.get("detail");

    if (q) params.set("q", q.toString());
    if (category) params.set("category", category.toString());
    if (era) params.set("era", era.toString());
    if (detail) params.set("detail", detail.toString());

    startTransition(() => {
      router.push("/knowledge?" + params.toString());
    });
  };

  const inputClass =
    "w-full rounded-sm border border-denim/30 bg-offwhite px-3 py-2 text-sm text-denim-dark placeholder-denim/30 transition-colors focus:border-denim focus:outline-none focus:ring-1 focus:ring-denim dark:border-denim-light/30 dark:bg-canvas-subtle dark:text-offwhite dark:placeholder-offwhite/30 dark:focus:border-denim-light dark:focus:ring-denim-light";
  const labelClass =
    "mb-1 block text-xs font-medium tracking-wide text-denim/60 uppercase dark:text-offwhite/50";

  return (
    <form
      onSubmit={handleSubmit}
      role="search"
      className="flex flex-col gap-3 sm:flex-row sm:items-end"
    >
      <div className="flex-1">
        <label htmlFor="knowledge-search-input" className={labelClass}>
          キーワード
        </label>
        <input
          id="knowledge-search-input"
          type="search"
          name="q"
          role="searchbox"
          defaultValue={defaultQuery}
          placeholder="ブランド名・特徴で検索"
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="knowledge-category-select" className={labelClass}>
          カテゴリ
        </label>
        <select
          id="knowledge-category-select"
          name="category"
          defaultValue={defaultCategory}
          className={inputClass}
        >
          <option value="">すべて</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="knowledge-era-select" className={labelClass}>
          年代
        </label>
        <select
          id="knowledge-era-select"
          name="era"
          defaultValue={defaultEra}
          className={inputClass}
        >
          <option value="">すべて</option>
          {eras.map((era) => (
            <option key={era} value={era}>
              {era}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="knowledge-detail-type-select" className={labelClass}>
          ディテール
        </label>
        <select
          id="knowledge-detail-type-select"
          name="detail"
          defaultValue={defaultDetailType}
          className={inputClass}
        >
          <option value="">すべて</option>
          {DETAIL_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="flex items-center justify-center gap-2 rounded-sm bg-denim px-5 py-2 text-sm font-medium tracking-widest text-offwhite uppercase transition-colors hover:bg-denim-dark disabled:cursor-not-allowed disabled:opacity-60 dark:bg-denim-light dark:hover:bg-denim"
      >
        {isPending && <Spinner />}
        検索
      </button>
    </form>
  );
}
