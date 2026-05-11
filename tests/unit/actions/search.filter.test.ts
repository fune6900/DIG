// ---------------------------------------------------------------------------
// searchSnapsAction フィルタ拡張のユニットテスト (Red フェーズ)
//
// 新規フィールド: styles?: string[], colorCategories?: string[]
// - Zod 検証で省略可能かつ string[] のみ許容
// - styles のみ指定 + query なし → Unsplash 非呼び出し（DB フィルタ専用）
// - colorCategories のみ指定 + query なし → 同上
// - query + styles + colorCategories の全指定でも正常動作
// ---------------------------------------------------------------------------

const findSnapsByQueryMock = vi.fn();
const upsertSnapsMock = vi.fn();
const searchUnsplashPhotosMock = vi.fn();

vi.mock("@/services/snap-service", () => ({
  findSnapsByQuery: (...args: unknown[]) => findSnapsByQueryMock(...args),
  upsertSnaps: (...args: unknown[]) => upsertSnapsMock(...args),
}));

vi.mock("@/services/unsplash-service", () => ({
  searchUnsplashPhotos: (...args: unknown[]) =>
    searchUnsplashPhotosMock(...args),
}));

import { searchSnapsAction } from "@/app/actions/search";

// ---------------------------------------------------------------------------
// フィクスチャ
// ---------------------------------------------------------------------------
const makeSnapSummary = (id: string) => ({
  id,
  imageUrl: `https://images.unsplash.com/${id}/regular`,
  authorName: "Test Author",
  sourceUrl: `https://unsplash.com/photos/${id}`,
});

// ---------------------------------------------------------------------------
// セットアップ
// ---------------------------------------------------------------------------
beforeEach(() => {
  vi.resetAllMocks();
});

// ---------------------------------------------------------------------------
// Zod バリデーション — フィルタフィールドの許容検証
// ---------------------------------------------------------------------------
describe("searchSnapsAction — フィルタフィールドの Zod バリデーション", () => {
  it("styles が string[] のとき VALIDATION_ERROR にならない", async () => {
    findSnapsByQueryMock.mockResolvedValue([]);

    const result = await searchSnapsAction({
      styles: ["アメカジ"],
      page: 1,
      pageSize: 30,
    });

    expect(result).not.toMatchObject({
      data: null,
      error: { code: "VALIDATION_ERROR" },
    });
  });

  it("colorCategories が string[] のとき VALIDATION_ERROR にならない", async () => {
    findSnapsByQueryMock.mockResolvedValue([]);

    const result = await searchSnapsAction({
      colorCategories: ["ブラック系"],
      page: 1,
      pageSize: 30,
    });

    expect(result).not.toMatchObject({
      data: null,
      error: { code: "VALIDATION_ERROR" },
    });
  });

  it("styles と colorCategories を両方省略しても VALIDATION_ERROR にならない（optional）", async () => {
    findSnapsByQueryMock.mockResolvedValue([]);
    searchUnsplashPhotosMock.mockResolvedValue({ photos: [], totalPages: 0 });
    upsertSnapsMock.mockResolvedValue(undefined);

    const result = await searchSnapsAction({
      query: "denim",
      page: 1,
      pageSize: 30,
    });

    expect(result).not.toMatchObject({
      data: null,
      error: { code: "VALIDATION_ERROR" },
    });
  });

  it("styles が string[] でない（数値配列）のとき VALIDATION_ERROR を返す", async () => {
    const result = await searchSnapsAction({
      styles: [1, 2, 3],
      page: 1,
      pageSize: 30,
    });

    expect(result).toMatchObject({
      data: null,
      error: { code: "VALIDATION_ERROR" },
    });
  });

  it("colorCategories が string でない（単一文字列）のとき VALIDATION_ERROR を返す", async () => {
    const result = await searchSnapsAction({
      colorCategories: "ブラック系",
      page: 1,
      pageSize: 30,
    });

    expect(result).toMatchObject({
      data: null,
      error: { code: "VALIDATION_ERROR" },
    });
  });

  it("query + styles + colorCategories の全指定は VALIDATION_ERROR にならない", async () => {
    findSnapsByQueryMock.mockResolvedValue([]);
    searchUnsplashPhotosMock.mockResolvedValue({ photos: [], totalPages: 0 });
    upsertSnapsMock.mockResolvedValue(undefined);

    const result = await searchSnapsAction({
      query: "vintage",
      styles: ["古着スタイル", "Y2K"],
      colorCategories: ["ベージュ系", "ブラウン系"],
      page: 1,
      pageSize: 30,
    });

    expect(result).not.toMatchObject({
      data: null,
      error: { code: "VALIDATION_ERROR" },
    });
  });
});

// ---------------------------------------------------------------------------
// styles のみ指定 + query なし → Unsplash 非呼び出し
// ---------------------------------------------------------------------------
describe("searchSnapsAction — styles のみ指定（query なし）", () => {
  it("styles のみ指定のとき Unsplash を呼ばない", async () => {
    findSnapsByQueryMock.mockResolvedValue([makeSnapSummary("snap-1")]);

    await searchSnapsAction({ styles: ["アメカジ"], page: 1, pageSize: 30 });

    expect(searchUnsplashPhotosMock).not.toHaveBeenCalled();
  });

  it("styles のみ指定のとき findSnapsByQuery に styles が渡される", async () => {
    findSnapsByQueryMock.mockResolvedValue([]);

    await searchSnapsAction({ styles: ["ミリタリー"], page: 1, pageSize: 30 });

    expect(findSnapsByQueryMock).toHaveBeenCalledWith(
      expect.objectContaining({ styles: ["ミリタリー"] }),
    );
  });

  it("styles のみ指定のとき data を返す（error: null）", async () => {
    const snaps = [makeSnapSummary("snap-a"), makeSnapSummary("snap-b")];
    findSnapsByQueryMock.mockResolvedValue(snaps);

    const result = await searchSnapsAction({
      styles: ["アメカジ"],
      page: 1,
      pageSize: 30,
    });

    expect(result).toMatchObject({
      data: { items: snaps, page: 1 },
      error: null,
    });
  });

  it("styles のみ指定 + 0 件のとき hasMore: false を返す", async () => {
    findSnapsByQueryMock.mockResolvedValue([]);

    const result = await searchSnapsAction({
      styles: ["アメカジ"],
      page: 1,
      pageSize: 30,
    });

    expect(result).toMatchObject({
      data: { items: [], hasMore: false },
      error: null,
    });
  });
});

// ---------------------------------------------------------------------------
// colorCategories のみ指定 + query なし → Unsplash 非呼び出し
// ---------------------------------------------------------------------------
describe("searchSnapsAction — colorCategories のみ指定（query なし）", () => {
  it("colorCategories のみ指定のとき Unsplash を呼ばない", async () => {
    findSnapsByQueryMock.mockResolvedValue([]);

    await searchSnapsAction({
      colorCategories: ["ブラック系"],
      page: 1,
      pageSize: 30,
    });

    expect(searchUnsplashPhotosMock).not.toHaveBeenCalled();
  });

  it("colorCategories のみ指定のとき findSnapsByQuery に colorCategories が渡される", async () => {
    findSnapsByQueryMock.mockResolvedValue([]);

    await searchSnapsAction({
      colorCategories: ["ネイビー系", "ブルー系"],
      page: 1,
      pageSize: 30,
    });

    expect(findSnapsByQueryMock).toHaveBeenCalledWith(
      expect.objectContaining({ colorCategories: ["ネイビー系", "ブルー系"] }),
    );
  });

  it("colorCategories のみ指定のとき data を返す（error: null）", async () => {
    const snaps = [makeSnapSummary("snap-c")];
    findSnapsByQueryMock.mockResolvedValue(snaps);

    const result = await searchSnapsAction({
      colorCategories: ["グリーン系"],
      page: 1,
      pageSize: 30,
    });

    expect(result).toMatchObject({
      data: { items: snaps, page: 1 },
      error: null,
    });
  });
});

// ---------------------------------------------------------------------------
// query + styles + colorCategories の全指定
// ---------------------------------------------------------------------------
describe("searchSnapsAction — query + styles + colorCategories の全指定", () => {
  it("全指定のとき findSnapsByQuery に 3 つのフィールドが渡される", async () => {
    findSnapsByQueryMock.mockResolvedValueOnce([]);
    searchUnsplashPhotosMock.mockResolvedValue({ photos: [], totalPages: 0 });
    upsertSnapsMock.mockResolvedValue(undefined);
    findSnapsByQueryMock.mockResolvedValueOnce([]);

    await searchSnapsAction({
      query: "vintage",
      styles: ["古着スタイル"],
      colorCategories: ["ベージュ系"],
      page: 1,
      pageSize: 30,
    });

    expect(findSnapsByQueryMock).toHaveBeenCalledWith(
      expect.objectContaining({
        query: "vintage",
        styles: ["古着スタイル"],
        colorCategories: ["ベージュ系"],
      }),
    );
  });

  it("全指定 + query ありのとき Unsplash を呼ぶ（query による補完は行われる）", async () => {
    findSnapsByQueryMock.mockResolvedValueOnce([]);
    searchUnsplashPhotosMock.mockResolvedValue({ photos: [], totalPages: 0 });
    upsertSnapsMock.mockResolvedValue(undefined);
    findSnapsByQueryMock.mockResolvedValueOnce([]);

    await searchSnapsAction({
      query: "denim",
      styles: ["アメカジ"],
      colorCategories: ["ブルー系"],
      page: 1,
      pageSize: 30,
    });

    expect(searchUnsplashPhotosMock).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// 全条件未指定: VALIDATION_ERROR
// ---------------------------------------------------------------------------
describe("searchSnapsAction — 全条件未指定", () => {
  it("query / styles / colorCategories が全て未指定のとき VALIDATION_ERROR を返す", async () => {
    const result = await searchSnapsAction({ page: 1, pageSize: 30 });

    expect(result).toMatchObject({
      data: null,
      error: { code: "VALIDATION_ERROR" },
    });
    expect(findSnapsByQueryMock).not.toHaveBeenCalled();
  });

  it("styles が空配列 + colorCategories 未指定 + query 未指定のとき VALIDATION_ERROR を返す", async () => {
    const result = await searchSnapsAction({
      styles: [],
      page: 1,
      pageSize: 30,
    });

    expect(result).toMatchObject({
      data: null,
      error: { code: "VALIDATION_ERROR" },
    });
  });
});
