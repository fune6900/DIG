/**
 * 着こなし検索の「こだわり条件」をキーワード文字列として扱うためのヘルパ群。
 *
 * 仕様:
 *   - styles / colors / 入力キーワードを半角スペース区切りの 1 文字列に連結
 *   - カラーカテゴリの『〜系』サフィックスを除去（『レッド系』→『レッド』）
 *   - 連結文字列をチップ配列に分解／チップ単位で削除
 *
 * 関連: app/(public)/search/conditions / components/features/search/SearchInput
 */

interface BuildKeywordInput {
  query: string;
  styles: string[];
  colors: string[];
}

const CATEGORY_SUFFIX = "系";

export function stripCategorySuffix(name: string): string {
  return name.endsWith(CATEGORY_SUFFIX)
    ? name.slice(0, -CATEGORY_SUFFIX.length)
    : name;
}

export function buildKeywordFromConditions(input: BuildKeywordInput): string {
  const parts: string[] = [];

  const trimmedQuery = input.query.trim();
  if (trimmedQuery.length > 0) parts.push(trimmedQuery);

  for (const s of input.styles) {
    if (s.length > 0) parts.push(s);
  }
  for (const c of input.colors) {
    const stripped = stripCategorySuffix(c);
    if (stripped.length > 0) parts.push(stripped);
  }

  return parts.join(" ");
}

export function parseKeywordIntoChips(query: string): string[] {
  return query.trim().split(/\s+/).filter(Boolean);
}

export function removeChipFromKeyword(query: string, chip: string): string {
  const chips = parseKeywordIntoChips(query);
  const idx = chips.indexOf(chip);
  if (idx === -1) return chips.join(" ");
  chips.splice(idx, 1);
  return chips.join(" ");
}
