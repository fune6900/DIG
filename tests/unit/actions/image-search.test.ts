// ---------------------------------------------------------------------------
// analyzeImageForSearchAction のユニットテスト（Red フェーズ）
//
// app/actions/image-search.ts の Server Action を検証する。
// 実装はまだ存在しないため、全テストが失敗する状態で提出する。
//
// 検証項目:
//   - Zod バリデーション（imageUrl 必須・https URL 形式）
//   - analyzeSnapImage の呼び出し
//   - styles を analysisResult.styles.map(s => s.name) で抽出
//   - colorCategories を categorizeColorPalette(colorPalette) で計算
//   - 解析成功後に deleteUploadedImagesAction を呼んで画像削除
//   - analyzeSnapImage エラー時に ANALYSIS_FAILED を返す
//   - analyzeSnapImage エラー時でも deleteUploadedImagesAction を呼ぶ（孤児防止）
// ---------------------------------------------------------------------------

const analyzeSnapImageMock = vi.fn();
const categorizeColorPaletteMock = vi.fn();
const deleteUploadedImagesActionMock = vi.fn();

vi.mock("@/services/snap-analysis", () => ({
  analyzeSnapImage: (...args: unknown[]) => analyzeSnapImageMock(...args),
}));

vi.mock("@/lib/color-categorize", () => ({
  categorizeColorPalette: (...args: unknown[]) =>
    categorizeColorPaletteMock(...args),
}));

vi.mock("@/app/actions/ootd", () => ({
  deleteUploadedImagesAction: (...args: unknown[]) =>
    deleteUploadedImagesActionMock(...args),
}));

import { analyzeImageForSearchAction } from "@/app/actions/image-search";
import type { ColorCategory } from "@/lib/color-catalog";

// ---------------------------------------------------------------------------
// フィクスチャ
// ---------------------------------------------------------------------------

const VALID_IMAGE_URL = "https://images.unsplash.com/photo-abc123";

const ANALYSIS_RESULT_FIXTURE = {
  oneLiner: "クールなストリートスタイル",
  colorPalette: [
    { name: "インディゴ", colorCode: "#1e3a5f", percentage: 60 },
    { name: "オフホワイト", colorCode: "#f5f0e8", percentage: 40 },
  ],
  styles: [
    { name: "ストリートウェア", percentage: 80 },
    { name: "カジュアル", percentage: 20 },
  ],
  description: "デニムとスニーカーのコーデ",
  detectedItems: [{ name: "デニムジャケット" }],
};

const COLOR_CATEGORIES_FIXTURE: ColorCategory[] = ["ネイビー系", "ベージュ系"];

// ---------------------------------------------------------------------------
// セットアップ
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.resetAllMocks();
  deleteUploadedImagesActionMock.mockResolvedValue({
    data: undefined,
    error: null,
  });
});

// ---------------------------------------------------------------------------
// Zod バリデーション
// ---------------------------------------------------------------------------

describe("analyzeImageForSearchAction — 入力バリデーション", () => {
  it("imageUrl が未指定のとき VALIDATION_ERROR を返す", async () => {
    const result = await analyzeImageForSearchAction({});

    expect(result).toMatchObject({
      data: null,
      error: { code: "VALIDATION_ERROR" },
    });
    expect(analyzeSnapImageMock).not.toHaveBeenCalled();
  });

  it("imageUrl が空文字のとき VALIDATION_ERROR を返す", async () => {
    const result = await analyzeImageForSearchAction({ imageUrl: "" });

    expect(result).toMatchObject({
      data: null,
      error: { code: "VALIDATION_ERROR" },
    });
  });

  it("imageUrl が URL 形式でないとき VALIDATION_ERROR を返す", async () => {
    const result = await analyzeImageForSearchAction({
      imageUrl: "not-a-url",
    });

    expect(result).toMatchObject({
      data: null,
      error: { code: "VALIDATION_ERROR" },
    });
  });

  it("imageUrl が http:// のとき VALIDATION_ERROR を返す（https 必須）", async () => {
    const result = await analyzeImageForSearchAction({
      imageUrl: "http://example.com/image.jpg",
    });

    expect(result).toMatchObject({
      data: null,
      error: { code: "VALIDATION_ERROR" },
    });
  });

  it("input が null のとき VALIDATION_ERROR を返す", async () => {
    const result = await analyzeImageForSearchAction(null);

    expect(result).toMatchObject({
      data: null,
      error: { code: "VALIDATION_ERROR" },
    });
  });

  it("input が配列のとき VALIDATION_ERROR を返す", async () => {
    const result = await analyzeImageForSearchAction([]);

    expect(result).toMatchObject({
      data: null,
      error: { code: "VALIDATION_ERROR" },
    });
  });

  it("imageUrl が有効な https URL のとき VALIDATION_ERROR にならない（境界値）", async () => {
    analyzeSnapImageMock.mockResolvedValue(ANALYSIS_RESULT_FIXTURE);
    categorizeColorPaletteMock.mockReturnValue(COLOR_CATEGORIES_FIXTURE);

    const result = await analyzeImageForSearchAction({
      imageUrl: VALID_IMAGE_URL,
    });

    expect(result).not.toMatchObject({
      data: null,
      error: { code: "VALIDATION_ERROR" },
    });
  });
});

// ---------------------------------------------------------------------------
// 解析成功フロー
// ---------------------------------------------------------------------------

describe("analyzeImageForSearchAction — 解析成功フロー", () => {
  beforeEach(() => {
    analyzeSnapImageMock.mockResolvedValue(ANALYSIS_RESULT_FIXTURE);
    categorizeColorPaletteMock.mockReturnValue(COLOR_CATEGORIES_FIXTURE);
  });

  it("analyzeSnapImage を imageUrl で呼び出す", async () => {
    await analyzeImageForSearchAction({ imageUrl: VALID_IMAGE_URL });

    expect(analyzeSnapImageMock).toHaveBeenCalledWith(VALID_IMAGE_URL);
  });

  it("styles を analysisResult.styles.map(s => s.name) で抽出して返す", async () => {
    const result = await analyzeImageForSearchAction({
      imageUrl: VALID_IMAGE_URL,
    });

    expect(result).toMatchObject({
      data: {
        styles: ["ストリートウェア", "カジュアル"],
      },
      error: null,
    });
  });

  it("colorCategories を categorizeColorPalette(colorPalette) で計算して返す", async () => {
    const result = await analyzeImageForSearchAction({
      imageUrl: VALID_IMAGE_URL,
    });

    expect(categorizeColorPaletteMock).toHaveBeenCalledWith(
      ANALYSIS_RESULT_FIXTURE.colorPalette,
    );
    expect(result).toMatchObject({
      data: {
        colorCategories: COLOR_CATEGORIES_FIXTURE,
      },
      error: null,
    });
  });

  it("解析成功後に deleteUploadedImagesAction を imageUrl で呼び出す", async () => {
    await analyzeImageForSearchAction({ imageUrl: VALID_IMAGE_URL });

    expect(deleteUploadedImagesActionMock).toHaveBeenCalledWith({
      urls: [VALID_IMAGE_URL],
    });
  });

  it("data は { styles: string[], colorCategories: ColorCategory[] } の形を返す", async () => {
    const result = await analyzeImageForSearchAction({
      imageUrl: VALID_IMAGE_URL,
    });

    expect(result).toMatchObject({
      data: {
        styles: expect.arrayContaining([expect.any(String)]),
        colorCategories: expect.arrayContaining([expect.any(String)]),
      },
      error: null,
    });
  });

  it("styles が空配列でも正常に返す（スタイル未検出）", async () => {
    analyzeSnapImageMock.mockResolvedValue({
      ...ANALYSIS_RESULT_FIXTURE,
      styles: [],
    });
    categorizeColorPaletteMock.mockReturnValue([]);

    const result = await analyzeImageForSearchAction({
      imageUrl: VALID_IMAGE_URL,
    });

    expect(result).toMatchObject({
      data: { styles: [], colorCategories: [] },
      error: null,
    });
  });
});

// ---------------------------------------------------------------------------
// 解析エラー時のフロー
// ---------------------------------------------------------------------------

describe("analyzeImageForSearchAction — 解析エラーフロー", () => {
  it("analyzeSnapImage がエラーを投げたとき ANALYSIS_FAILED コードを返す", async () => {
    analyzeSnapImageMock.mockRejectedValue(new Error("Gemini API unavailable"));

    const result = await analyzeImageForSearchAction({
      imageUrl: VALID_IMAGE_URL,
    });

    expect(result).toMatchObject({
      data: null,
      error: { code: "ANALYSIS_FAILED" },
    });
  });

  it("analyzeSnapImage エラー時でも deleteUploadedImagesAction を呼ぶ（孤児防止）", async () => {
    analyzeSnapImageMock.mockRejectedValue(new Error("Network error"));

    await analyzeImageForSearchAction({ imageUrl: VALID_IMAGE_URL });

    expect(deleteUploadedImagesActionMock).toHaveBeenCalledWith({
      urls: [VALID_IMAGE_URL],
    });
  });

  it("deleteUploadedImagesAction が失敗しても ANALYSIS_FAILED を返す（best-effort cleanup）", async () => {
    analyzeSnapImageMock.mockRejectedValue(new Error("Gemini timeout"));
    deleteUploadedImagesActionMock.mockRejectedValue(
      new Error("Storage error"),
    );

    const result = await analyzeImageForSearchAction({
      imageUrl: VALID_IMAGE_URL,
    });

    expect(result).toMatchObject({
      data: null,
      error: { code: "ANALYSIS_FAILED" },
    });
  });

  it("解析成功後の deleteUploadedImagesAction 失敗は無視して data を返す（best-effort）", async () => {
    analyzeSnapImageMock.mockResolvedValue(ANALYSIS_RESULT_FIXTURE);
    categorizeColorPaletteMock.mockReturnValue(COLOR_CATEGORIES_FIXTURE);
    deleteUploadedImagesActionMock.mockRejectedValue(
      new Error("Storage unavailable"),
    );

    const result = await analyzeImageForSearchAction({
      imageUrl: VALID_IMAGE_URL,
    });

    expect(result).toMatchObject({
      data: {
        styles: expect.any(Array),
        colorCategories: expect.any(Array),
      },
      error: null,
    });
  });
});
