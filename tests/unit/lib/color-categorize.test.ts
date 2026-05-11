import {
  categorizeColor,
  categorizeColorPalette,
} from "@/lib/color-categorize";
import { COLOR_CATEGORIES } from "@/lib/color-catalog";

describe("categorizeColor — 典型値マッピング", () => {
  // 各 16 系統の代表色が正しく自分のカテゴリに分類されること。
  // COLOR_CATEGORY_SWATCHES と一致する代表色を用いる。
  const cases: Array<[string, string]> = [
    ["#000000", "ブラック系"],
    ["#1a1a1a", "ブラック系"],
    ["#ffffff", "ホワイト系"],
    ["#f5f5f5", "ホワイト系"],
    ["#888888", "グレイ系"],
    ["#c0c0c0", "シルバー系"],
    ["#d4b896", "ベージュ系"],
    ["#6f4e37", "ブラウン系"],
    ["#c0392b", "レッド系"],
    ["#e67e22", "オレンジ系"],
    ["#f1c40f", "イエロー系"],
    ["#d4af37", "ゴールド系"],
    ["#e91e63", "ピンク系"],
    ["#8e44ad", "パープル系"],
    ["#1f3a68", "ネイビー系"],
    ["#3498db", "ブルー系"],
    ["#2ecc71", "グリーン系"],
    ["#8b8639", "カーキ系"],
  ];

  for (const [hex, expected] of cases) {
    it(`${hex} は ${expected} に分類される`, () => {
      expect(categorizeColor(hex)).toBe(expected);
    });
  }
});

describe("categorizeColor — エッジケース", () => {
  it("プレフィックスなしの hex を受理する", () => {
    expect(categorizeColor("000000")).toBe("ブラック系");
  });

  it("空白付きの hex を受理する", () => {
    expect(categorizeColor("  #ffffff  ")).toBe("ホワイト系");
  });

  it("無効な hex は null を返す", () => {
    expect(categorizeColor("not-hex")).toBeNull();
    expect(categorizeColor("#GGGGGG")).toBeNull();
    expect(categorizeColor("#123")).toBeNull();
  });

  it("結果は必ず COLOR_CATEGORIES 内のいずれか", () => {
    const allowed = new Set(COLOR_CATEGORIES);
    for (
      let v = 0;
      v < 0x1000000;
      v += 0x10101 // 簡易サンプリング
    ) {
      const hex = "#" + v.toString(16).padStart(6, "0");
      const cat = categorizeColor(hex);
      if (cat !== null) expect(allowed.has(cat)).toBe(true);
    }
  });
});

describe("categorizeColorPalette", () => {
  it("複数色をユニーク化したカテゴリ配列を返す", () => {
    const result = categorizeColorPalette([
      { colorCode: "#000000" },
      { colorCode: "#1a1a1a" }, // 重複してブラック系
      { colorCode: "#ffffff" },
    ]);

    expect(result).toContain("ブラック系");
    expect(result).toContain("ホワイト系");
    // 重複が排除されていること
    expect(result.filter((c) => c === "ブラック系")).toHaveLength(1);
  });

  it("空配列のとき空配列を返す", () => {
    expect(categorizeColorPalette([])).toEqual([]);
  });

  it("無効 hex を含む場合はそのエントリだけスキップする", () => {
    const result = categorizeColorPalette([
      { colorCode: "#000000" },
      { colorCode: "not-hex" },
    ]);

    expect(result).toEqual(["ブラック系"]);
  });
});
