// ---------------------------------------------------------------------------
// searchSnapsAction のユニットテスト
//
// snap-service / unsplash-service を vi.mock して Server Action の振る舞いを検証する。
// - Zod バリデーション（不正 input → ActionResult error）
// - キャッシュヒット（pageSize 件以上 → Unsplash を呼ばない）
// - キャッシュミス + page=1 → Unsplash 呼び出し → upsert → 再取得
// - Unsplash エラー時のフォールバック（DB の現状をそのまま返す）
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
import type { UnsplashPhoto } from "@/services/unsplash-service";

// ---------------------------------------------------------------------------
// フィクスチャ
// ---------------------------------------------------------------------------
const makeSnapSummary = (id: string) => ({
  id,
  imageUrl: `https://images.unsplash.com/${id}/regular`,
  authorName: "Test Author",
  sourceUrl: `https://unsplash.com/photos/${id}`,
});

const makeUnsplashPhoto = (id: string): UnsplashPhoto => ({
  id,
  urls: {
    regular: `https://images.unsplash.com/${id}/regular`,
    small: `https://images.unsplash.com/${id}/small`,
  },
  description: "A stylish outfit",
  alt_description: "Person in stylish outfit",
  user: {
    name: "Test Author",
    links: { html: `https://unsplash.com/@testauthor` },
  },
  links: { html: `https://unsplash.com/photos/${id}` },
  tags: [{ title: "fashion" }],
});

const VALID_INPUT = { query: "denim jacket", page: 1, pageSize: 30 };

// ---------------------------------------------------------------------------
// セットアップ
// ---------------------------------------------------------------------------
beforeEach(() => {
  // resetAllMocks は mockResolvedValueOnce のキューも全クリアする。
  // clearAllMocks だと未消費のキューが次のテストにリークするので使わない。
  vi.resetAllMocks();
});

// ---------------------------------------------------------------------------
// Zod バリデーション
// ---------------------------------------------------------------------------
describe("searchSnapsAction — 入力バリデーション", () => {
  it("query が未指定のとき VALIDATION_ERROR を返す", async () => {
    const result = await searchSnapsAction({});

    expect(result).toMatchObject({
      data: null,
      error: { code: "VALIDATION_ERROR" },
    });
    expect(findSnapsByQueryMock).not.toHaveBeenCalled();
  });

  it("query が空文字のとき VALIDATION_ERROR を返す", async () => {
    const result = await searchSnapsAction({ query: "" });

    expect(result).toMatchObject({
      data: null,
      error: { code: "VALIDATION_ERROR" },
    });
  });

  it("query が 201 文字以上のとき VALIDATION_ERROR を返す", async () => {
    const result = await searchSnapsAction({ query: "a".repeat(201) });

    expect(result).toMatchObject({
      data: null,
      error: { code: "VALIDATION_ERROR" },
    });
  });

  it("query が 200 文字ちょうどのとき VALIDATION_ERROR にならない（境界値）", async () => {
    findSnapsByQueryMock.mockResolvedValue([]);
    searchUnsplashPhotosMock.mockResolvedValue({ photos: [], totalPages: 0 });
    upsertSnapsMock.mockResolvedValue(undefined);

    const result = await searchSnapsAction({ query: "a".repeat(200) });

    expect(result).not.toMatchObject({
      data: null,
      error: { code: "VALIDATION_ERROR" },
    });
  });

  it("page が 0 のとき VALIDATION_ERROR を返す", async () => {
    const result = await searchSnapsAction({ query: "jacket", page: 0 });

    expect(result).toMatchObject({
      data: null,
      error: { code: "VALIDATION_ERROR" },
    });
  });

  it("pageSize が 31 のとき VALIDATION_ERROR を返す（Unsplash per_page 上限 30 に合わせる）", async () => {
    const result = await searchSnapsAction({
      query: "jacket",
      page: 1,
      pageSize: 31,
    });

    expect(result).toMatchObject({
      data: null,
      error: { code: "VALIDATION_ERROR" },
    });
  });

  it("pageSize が 30 のとき VALIDATION_ERROR にならない（境界値）", async () => {
    findSnapsByQueryMock.mockResolvedValue(
      Array.from({ length: 30 }, (_, i) => makeSnapSummary(`snap-${i}`)),
    );

    const result = await searchSnapsAction({
      query: "jacket",
      page: 1,
      pageSize: 30,
    });

    expect(result).not.toMatchObject({
      data: null,
      error: { code: "VALIDATION_ERROR" },
    });
  });

  it("input が null のとき VALIDATION_ERROR を返す", async () => {
    const result = await searchSnapsAction(null);

    expect(result).toMatchObject({
      data: null,
      error: { code: "VALIDATION_ERROR" },
    });
  });
});

// ---------------------------------------------------------------------------
// キャッシュヒット（Unsplash を呼ばない）
// ---------------------------------------------------------------------------
describe("searchSnapsAction — キャッシュ十分（Unsplash 非呼び出し）", () => {
  it("DB が pageSize 件以上返したとき Unsplash を呼ばない", async () => {
    const snaps = Array.from({ length: 30 }, (_, i) =>
      makeSnapSummary(`snap-${i}`),
    );
    findSnapsByQueryMock.mockResolvedValue(snaps);

    await searchSnapsAction(VALID_INPUT);

    expect(searchUnsplashPhotosMock).not.toHaveBeenCalled();
    expect(upsertSnapsMock).not.toHaveBeenCalled();
  });

  it("キャッシュヒット時に items と hasMore を含む data を返す", async () => {
    const snaps = Array.from({ length: 30 }, (_, i) =>
      makeSnapSummary(`snap-${i}`),
    );
    findSnapsByQueryMock.mockResolvedValue(snaps);

    const result = await searchSnapsAction(VALID_INPUT);

    expect(result).toMatchObject({
      data: expect.objectContaining({
        items: expect.any(Array),
        hasMore: expect.any(Boolean),
        page: 1,
      }),
      error: null,
    });
  });

  it("page=2 で DB が 0 件のとき Unsplash を呼ばない（末尾と判断・無限ループ防止）", async () => {
    findSnapsByQueryMock.mockResolvedValue([]);

    const result = await searchSnapsAction({ ...VALID_INPUT, page: 2 });

    expect(searchUnsplashPhotosMock).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      data: { items: [], hasMore: false, page: 2 },
      error: null,
    });
  });

  it("page=2 で DB が pageSize 件以上返したとき Unsplash を呼ばない", async () => {
    const snaps = Array.from({ length: 30 }, (_, i) =>
      makeSnapSummary(`snap-${i}`),
    );
    findSnapsByQueryMock.mockResolvedValue(snaps);

    await searchSnapsAction({ ...VALID_INPUT, page: 2 });

    expect(searchUnsplashPhotosMock).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// キャッシュミス（Unsplash 呼び出し + upsert + 再取得）
// ---------------------------------------------------------------------------
describe("searchSnapsAction — キャッシュ不足（Unsplash 呼び出し）", () => {
  it("DB が pageSize 未満のとき Unsplash を呼ぶ", async () => {
    // 最初の findSnapsByQuery（upsert 前）は 0 件
    findSnapsByQueryMock.mockResolvedValueOnce([]);
    const photos = Array.from({ length: 10 }, (_, i) =>
      makeUnsplashPhoto(`photo-${i}`),
    );
    searchUnsplashPhotosMock.mockResolvedValue({
      photos,
      totalPages: 1,
    });
    upsertSnapsMock.mockResolvedValue(undefined);
    // upsert 後の再取得
    findSnapsByQueryMock.mockResolvedValueOnce(
      photos.map((p) => makeSnapSummary(p.id)),
    );

    await searchSnapsAction({ ...VALID_INPUT, page: 1 });

    expect(searchUnsplashPhotosMock).toHaveBeenCalledTimes(1);
  });

  it("Unsplash 呼び出し後に upsertSnaps を実行する", async () => {
    findSnapsByQueryMock.mockResolvedValueOnce([]);
    const photos = [makeUnsplashPhoto("photo-x")];
    searchUnsplashPhotosMock.mockResolvedValue({ photos, totalPages: 1 });
    upsertSnapsMock.mockResolvedValue(undefined);
    findSnapsByQueryMock.mockResolvedValueOnce([makeSnapSummary("photo-x")]);

    await searchSnapsAction({ query: "M-65", page: 1, pageSize: 30 });

    expect(upsertSnapsMock).toHaveBeenCalledWith(photos, "M-65");
  });

  it("page=2 で DB が pageSize 未満のとき Unsplash を page=2 で呼ぶ（無限スクロール継続）", async () => {
    findSnapsByQueryMock.mockResolvedValueOnce([
      makeSnapSummary("snap-cached"),
    ]);
    searchUnsplashPhotosMock.mockResolvedValue({
      photos: [makeUnsplashPhoto("photo-p2")],
      totalPages: 5,
    });
    upsertSnapsMock.mockResolvedValue(undefined);
    findSnapsByQueryMock.mockResolvedValueOnce([
      makeSnapSummary("snap-cached"),
      makeSnapSummary("photo-p2"),
    ]);

    await searchSnapsAction({ query: "M-65", page: 2, pageSize: 30 });

    expect(searchUnsplashPhotosMock).toHaveBeenCalledWith(
      expect.objectContaining({ page: 2, perPage: 30 }),
    );
  });

  it("hasMore は totalPages > page で計算される（page=2 で部分キャッシュあり）", async () => {
    // page=2 で initialItems > 0 のため Unsplash 補完が走る
    findSnapsByQueryMock.mockResolvedValueOnce([
      makeSnapSummary("snap-cached"),
    ]);
    searchUnsplashPhotosMock.mockResolvedValue({
      photos: [makeUnsplashPhoto("photo-1")],
      totalPages: 3,
    });
    upsertSnapsMock.mockResolvedValue(undefined);
    findSnapsByQueryMock.mockResolvedValueOnce([
      makeSnapSummary("snap-cached"),
      makeSnapSummary("photo-1"),
    ]);

    const result = await searchSnapsAction({
      query: "M-65",
      page: 2,
      pageSize: 30,
    });

    expect(result).toMatchObject({
      data: { hasMore: true, page: 2 },
    });
  });

  it("totalPages === page のとき hasMore は false（page=2 で部分キャッシュあり）", async () => {
    // page=2 で initialItems > 0 のため Unsplash 補完が走る
    findSnapsByQueryMock.mockResolvedValueOnce([
      makeSnapSummary("snap-cached"),
    ]);
    searchUnsplashPhotosMock.mockResolvedValue({
      photos: [makeUnsplashPhoto("photo-1")],
      totalPages: 2,
    });
    upsertSnapsMock.mockResolvedValue(undefined);
    findSnapsByQueryMock.mockResolvedValueOnce([
      makeSnapSummary("snap-cached"),
      makeSnapSummary("photo-1"),
    ]);

    const result = await searchSnapsAction({
      query: "M-65",
      page: 2,
      pageSize: 30,
    });

    expect(result).toMatchObject({
      data: { hasMore: false },
    });
  });

  it("upsert 後に再度 DB から取得して items を返す", async () => {
    findSnapsByQueryMock.mockResolvedValueOnce([]);
    searchUnsplashPhotosMock.mockResolvedValue({
      photos: [makeUnsplashPhoto("photo-y")],
      totalPages: 1,
    });
    upsertSnapsMock.mockResolvedValue(undefined);
    const refreshedSnaps = [makeSnapSummary("photo-y")];
    findSnapsByQueryMock.mockResolvedValueOnce(refreshedSnaps);

    const result = await searchSnapsAction(VALID_INPUT);

    expect(result).toMatchObject({
      data: { items: refreshedSnaps },
      error: null,
    });
    // findSnapsByQuery が 2 回呼ばれる（キャッシュ確認 + 再取得）
    expect(findSnapsByQueryMock).toHaveBeenCalledTimes(2);
  });
});

// ---------------------------------------------------------------------------
// Unsplash エラー時のフォールバック
// ---------------------------------------------------------------------------
describe("searchSnapsAction — Unsplash エラーのフォールバック", () => {
  it("Unsplash がエラーを投げても data を返す（エラーで失敗させない）", async () => {
    findSnapsByQueryMock.mockResolvedValue([makeSnapSummary("cached-snap")]);
    // DB が 1 件しかない（pageSize=30 未満）かつ page=1 → Unsplash を試みる
    findSnapsByQueryMock.mockResolvedValueOnce([
      makeSnapSummary("cached-snap"),
    ]);
    searchUnsplashPhotosMock.mockRejectedValue(new Error("Network error"));

    const result = await searchSnapsAction(VALID_INPUT);

    // error フィールドが null でデータが返る
    expect(result).not.toMatchObject({ data: null });
    expect(result).toMatchObject({ error: null });
  });

  it("Unsplash エラー時は DB の現状の items をそのまま返す", async () => {
    const cachedSnap = makeSnapSummary("cached-snap-1");
    findSnapsByQueryMock.mockResolvedValueOnce([cachedSnap]);
    searchUnsplashPhotosMock.mockRejectedValue(
      new Error("Rate limit exceeded"),
    );

    const result = await searchSnapsAction(VALID_INPUT);

    if ("data" in result && result.data !== null) {
      expect(result.data.items).toContainEqual(cachedSnap);
    } else {
      // data が null なら失敗とみなす（フォールバック仕様違反）
      expect(result.data).not.toBeNull();
    }
  });

  it("Unsplash エラー時は upsertSnaps を呼ばない", async () => {
    findSnapsByQueryMock.mockResolvedValueOnce([]);
    searchUnsplashPhotosMock.mockRejectedValue(
      new Error("503 Service Unavailable"),
    );

    await searchSnapsAction(VALID_INPUT);

    expect(upsertSnapsMock).not.toHaveBeenCalled();
  });
});
