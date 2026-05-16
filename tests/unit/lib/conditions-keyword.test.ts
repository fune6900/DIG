// ---------------------------------------------------------------------------
// conditions-keyword ヘルパのテスト (Red フェーズ)
//
// 着こなし検索で「こだわり条件」をキーワード文字列化するロジック。
//   - 半角スペース区切りで結合
//   - カラーカテゴリの『系』サフィックスを除去
//   - キーワード文字列をチップ配列に分解／チップ削除
// ---------------------------------------------------------------------------

import {
  stripCategorySuffix,
  buildKeywordFromConditions,
  parseKeywordIntoChips,
  removeChipFromKeyword,
} from "@/lib/conditions-keyword";

describe("stripCategorySuffix", () => {
  it("『〜系』サフィックスを除去する", () => {
    expect(stripCategorySuffix("ブラック系")).toBe("ブラック");
    expect(stripCategorySuffix("レッド系")).toBe("レッド");
    expect(stripCategorySuffix("ネイビー系")).toBe("ネイビー");
  });

  it("『系』を含まない文字列はそのまま返す", () => {
    expect(stripCategorySuffix("アメカジ")).toBe("アメカジ");
    expect(stripCategorySuffix("")).toBe("");
  });

  it("文字列の途中に『系』があってもサフィックスでないなら維持する", () => {
    expect(stripCategorySuffix("系統的")).toBe("系統的");
  });
});

describe("buildKeywordFromConditions", () => {
  it("query + styles + colors を半角スペースで連結する", () => {
    const result = buildKeywordFromConditions({
      query: "vintage",
      styles: ["アメカジ"],
      colors: ["レッド系"],
    });
    expect(result).toBe("vintage アメカジ レッド");
  });

  it("複数 styles / colors を全て連結する", () => {
    const result = buildKeywordFromConditions({
      query: "",
      styles: ["アメカジ", "ストリート"],
      colors: ["ブラック系", "ホワイト系"],
    });
    expect(result).toBe("アメカジ ストリート ブラック ホワイト");
  });

  it("query が空白のみのときは無視して styles/colors のみ連結", () => {
    const result = buildKeywordFromConditions({
      query: "   ",
      styles: ["アメカジ"],
      colors: [],
    });
    expect(result).toBe("アメカジ");
  });

  it("全てが空のときは空文字を返す", () => {
    const result = buildKeywordFromConditions({
      query: "",
      styles: [],
      colors: [],
    });
    expect(result).toBe("");
  });

  it("colors の『系』サフィックスは除去する", () => {
    const result = buildKeywordFromConditions({
      query: "",
      styles: [],
      colors: ["ブラック系", "オレンジ系"],
    });
    expect(result).toBe("ブラック オレンジ");
  });
});

describe("parseKeywordIntoChips", () => {
  it("半角スペース区切りで配列に分解する", () => {
    expect(parseKeywordIntoChips("アメカジ レッド")).toEqual([
      "アメカジ",
      "レッド",
    ]);
  });

  it("複数の連続スペースは 1 区切りとして扱う", () => {
    expect(parseKeywordIntoChips("アメカジ   レッド")).toEqual([
      "アメカジ",
      "レッド",
    ]);
  });

  it("空文字／空白のみは空配列を返す", () => {
    expect(parseKeywordIntoChips("")).toEqual([]);
    expect(parseKeywordIntoChips("   ")).toEqual([]);
  });

  it("単一語のみのときは 1 要素配列を返す", () => {
    expect(parseKeywordIntoChips("アメカジ")).toEqual(["アメカジ"]);
  });
});

describe("removeChipFromKeyword", () => {
  it("指定したチップを削除して残りを半角スペースで連結する", () => {
    expect(removeChipFromKeyword("アメカジ レッド ブルー", "レッド")).toBe(
      "アメカジ ブルー",
    );
  });

  it("先頭のチップを削除できる", () => {
    expect(removeChipFromKeyword("アメカジ レッド", "アメカジ")).toBe("レッド");
  });

  it("末尾のチップを削除できる", () => {
    expect(removeChipFromKeyword("アメカジ レッド", "レッド")).toBe("アメカジ");
  });

  it("最後の 1 チップを削除すると空文字を返す", () => {
    expect(removeChipFromKeyword("アメカジ", "アメカジ")).toBe("");
  });

  it("含まれないチップを指定したときは元の文字列を保持する", () => {
    expect(removeChipFromKeyword("アメカジ レッド", "ブルー")).toBe(
      "アメカジ レッド",
    );
  });

  it("同じ語が複数あるときは最初の 1 件のみ削除する", () => {
    expect(removeChipFromKeyword("アメカジ アメカジ レッド", "アメカジ")).toBe(
      "アメカジ レッド",
    );
  });

  it("同じ語が 3 つあるときは 1 件削除すると 2 件残る", () => {
    expect(removeChipFromKeyword("a a a b", "a")).toBe("a a b");
  });
});
