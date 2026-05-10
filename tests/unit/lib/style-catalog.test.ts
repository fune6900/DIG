// ---------------------------------------------------------------------------
// lib/style-catalog の不変条件を検証する。
// - 空配列ではない（AI に渡すべき候補が必ず存在する）
// - 重複が無い（同じスタイル名を 2 度提示しない）
// - 全要素が空白なしの非空文字列（プロンプト埋め込み時の崩壊防止）
// - スタイル一覧.md の主要セクションを最低限カバーしている
// ---------------------------------------------------------------------------

import { STYLE_CATALOG } from "@/lib/style-catalog";

describe("STYLE_CATALOG", () => {
  it("空配列ではない", () => {
    expect(STYLE_CATALOG.length).toBeGreaterThan(0);
  });

  it("重複が無い", () => {
    const set = new Set(STYLE_CATALOG);
    expect(set.size).toBe(STYLE_CATALOG.length);
  });

  it("全要素が非空文字列で、前後に空白を含まない", () => {
    for (const name of STYLE_CATALOG) {
      expect(typeof name).toBe("string");
      expect(name.length).toBeGreaterThan(0);
      expect(name).toBe(name.trim());
    }
  });

  it("代表的なスタイルを含む（カタログ更新の取りこぼし検出）", () => {
    // スタイル一覧.md の主要セクションから代表サンプル
    const required = [
      "ストリートウェア",
      "アメカジ",
      "モード",
      "古着スタイル",
      "Y2K",
      "森ガール",
      "テックウェア",
      "裏原宿スタイル",
      "クワイエット・ラグジュアリー",
    ];
    for (const name of required) {
      expect(STYLE_CATALOG).toContain(name);
    }
  });
});
