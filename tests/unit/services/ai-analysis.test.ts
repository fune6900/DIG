import {
  normalizeColorCode,
  normalizeAnalysisResult,
} from "@/services/ai-analysis";

describe("normalizeColorCode", () => {
  it("3桁 hex #1aF を #11AAFF に展開・大文字化する", () => {
    expect(normalizeColorCode("#1aF")).toBe("#11AAFF");
  });

  it("3桁 hex #abc を #AABBCC に展開・大文字化する", () => {
    expect(normalizeColorCode("#abc")).toBe("#AABBCC");
  });

  it("8桁 hex #11223344 のアルファを除去して #112233 を返す", () => {
    expect(normalizeColorCode("#11223344")).toBe("#112233");
  });

  it("6桁 lowercase hex #aabbcc を #AABBCC に大文字化する", () => {
    expect(normalizeColorCode("#aabbcc")).toBe("#AABBCC");
  });

  it("有効な 6桁 uppercase hex はそのまま返す", () => {
    expect(normalizeColorCode("#AABBCC")).toBe("#AABBCC");
  });

  it("rgb() 形式は変換せずそのまま返す", () => {
    expect(normalizeColorCode("rgb(1,2,3)")).toBe("rgb(1,2,3)");
  });

  it("色名 'red' は変換せずそのまま返す", () => {
    expect(normalizeColorCode("red")).toBe("red");
  });

  it("空文字はそのまま返す", () => {
    expect(normalizeColorCode("")).toBe("");
  });
});

describe("normalizeAnalysisResult", () => {
  it("null を渡したらそのまま返す", () => {
    expect(normalizeAnalysisResult(null)).toBeNull();
  });

  it("文字列を渡したらそのまま返す", () => {
    expect(normalizeAnalysisResult("text")).toBe("text");
  });

  it("colorPalette を持たないオブジェクトはそのまま返す", () => {
    const input = { oneLiner: "test" };
    expect(normalizeAnalysisResult(input)).toEqual({ oneLiner: "test" });
  });

  it("colorPalette 内の 3桁 hex colorCode が #RRGGBB に正規化される", () => {
    const input = {
      colorPalette: [{ name: "A", colorCode: "#abc", percentage: 50 }],
    };
    const result = normalizeAnalysisResult(input) as {
      colorPalette: { colorCode: string }[];
    };
    expect(result.colorPalette[0].colorCode).toBe("#AABBCC");
  });

  it("colorPalette 内の 8桁 hex colorCode からアルファが除去される", () => {
    const input = {
      colorPalette: [{ name: "B", colorCode: "#11223344", percentage: 50 }],
    };
    const result = normalizeAnalysisResult(input) as {
      colorPalette: { colorCode: string }[];
    };
    expect(result.colorPalette[0].colorCode).toBe("#112233");
  });

  it("colorPalette 内の非オブジェクト要素はそのまま保持される", () => {
    const input = {
      colorPalette: [
        "not-an-object",
        { name: "A", colorCode: "#abc", percentage: 100 },
      ],
    };
    const result = normalizeAnalysisResult(input) as {
      colorPalette: unknown[];
    };
    expect(result.colorPalette[0]).toBe("not-an-object");
    expect(
      (result.colorPalette[1] as { colorCode: string }).colorCode,
    ).toBe("#AABBCC");
  });

  it("colorCode が文字列でない要素はスキップして値を保持する", () => {
    const input = {
      colorPalette: [{ name: "A", colorCode: 12345, percentage: 100 }],
    };
    const result = normalizeAnalysisResult(input) as {
      colorPalette: { colorCode: unknown }[];
    };
    expect(result.colorPalette[0].colorCode).toBe(12345);
  });
});
