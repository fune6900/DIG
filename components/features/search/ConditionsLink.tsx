"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { STYLE_CATALOG } from "@/lib/style-catalog";
import { COLOR_CATEGORIES } from "@/lib/color-catalog";

// URL から渡された CSV を、許可リスト内のものだけに絞ってカンマ連結し直す。
// カタログ外の不正値が ConditionsForm に渡って内部 state を汚染するのを防ぐ。
function sanitizeCsv(raw: string | null, allowed: ReadonlySet<string>): string {
  if (!raw) return "";
  const filtered = raw
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && allowed.has(s));
  return filtered.join(",");
}

const STYLE_SET: ReadonlySet<string> = new Set(STYLE_CATALOG);
const COLOR_SET: ReadonlySet<string> = new Set(COLOR_CATEGORIES);

export function ConditionsLink() {
  const searchParams = useSearchParams();

  const conditionsParams = new URLSearchParams();
  const query = searchParams.get("query");
  const styles = sanitizeCsv(searchParams.get("styles"), STYLE_SET);
  const colors = sanitizeCsv(searchParams.get("colors"), COLOR_SET);
  if (query) conditionsParams.set("query", query);
  if (styles) conditionsParams.set("styles", styles);
  if (colors) conditionsParams.set("colors", colors);

  const paramsString = conditionsParams.toString();
  const href = paramsString
    ? `/search/conditions?${paramsString}`
    : "/search/conditions";

  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 rounded-none border border-denim/30 bg-transparent px-4 py-2 text-sm font-medium tracking-wide text-denim dark:border-denim-light/30 dark:text-denim-light transition-colors hover:border-denim hover:bg-denim/5 dark:hover:border-denim-light dark:hover:bg-denim-light/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim focus-visible:ring-offset-2"
    >
      こだわり条件を選択
    </Link>
  );
}
