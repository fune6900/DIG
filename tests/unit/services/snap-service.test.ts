// ---------------------------------------------------------------------------
// snap-service のユニットテスト
//
// testing.md: DB モック禁止。本来は Vitest setup でテスト DB に接続する想定。
// CI 環境に test DB が存在しない場合は describe.skip を使う。
// Benz 承認例外として ootd-service.test.ts と同様に Prisma クライアントを
// vi.mock する（ootd-service パターンに準拠）。
// ---------------------------------------------------------------------------

vi.mock("@/lib/prisma", () => ({
  prisma: {
    snap: {
      findMany: vi.fn(),
      upsert: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/prisma";
import { findSnapsByQuery, upsertSnaps } from "@/services/snap-service";
import type { UnsplashPhoto } from "@/services/unsplash-service";

// ---------------------------------------------------------------------------
// テスト用フィクスチャ
// ---------------------------------------------------------------------------
const makeSnapRecord = (
  overrides: Partial<{
    id: string;
    externalId: string;
    searchQuery: string;
    createdAt: Date;
  }> = {},
) => ({
  id: overrides.id ?? "snap-uuid-1",
  source: "unsplash",
  externalId: overrides.externalId ?? "unsplash-photo-1",
  imageUrl: "https://images.unsplash.com/photo-1/regular",
  sourceUrl: "https://unsplash.com/photos/photo-1",
  authorName: "John Doe",
  authorUrl: "https://unsplash.com/@johndoe",
  title: null,
  description: "A stylish outfit",
  tags: ["fashion", "outfit"],
  searchQuery: overrides.searchQuery ?? "denim jacket",
  oneLiner: null,
  colorPalette: null,
  styles: null,
  aiDescription: null,
  detectedItems: null,
  radarScores: null,
  analyzedAt: null,
  createdAt: overrides.createdAt ?? new Date("2026-05-01T00:00:00Z"),
  updatedAt: new Date("2026-05-01T00:00:00Z"),
});

const makeUnsplashPhoto = (
  overrides: Partial<UnsplashPhoto> = {},
): UnsplashPhoto => ({
  id: overrides.id ?? "unsplash-photo-1",
  urls: overrides.urls ?? {
    regular: "https://images.unsplash.com/photo-1/regular",
    small: "https://images.unsplash.com/photo-1/small",
  },
  description: overrides.description ?? "A stylish outfit",
  alt_description: overrides.alt_description ?? "Person wearing denim jacket",
  user: overrides.user ?? {
    name: "John Doe",
    links: { html: "https://unsplash.com/@johndoe" },
  },
  links: overrides.links ?? { html: "https://unsplash.com/photos/photo-1" },
  tags: overrides.tags ?? [{ title: "fashion" }, { title: "outfit" }],
});

// ---------------------------------------------------------------------------
// findSnapsByQuery
// ---------------------------------------------------------------------------
describe("findSnapsByQuery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("page=1, pageSize=30 のとき skip=0, take=30 で DB を照会する", async () => {
    const snap = makeSnapRecord();
    vi.mocked(prisma.snap.findMany).mockResolvedValue([snap]);

    await findSnapsByQuery({ query: "denim jacket", page: 1, pageSize: 30 });

    expect(prisma.snap.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 0,
        take: 30,
      }),
    );
  });

  it("page=2, pageSize=30 のとき skip=30 で DB を照会する", async () => {
    vi.mocked(prisma.snap.findMany).mockResolvedValue([]);

    await findSnapsByQuery({ query: "denim jacket", page: 2, pageSize: 30 });

    expect(prisma.snap.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 30,
        take: 30,
      }),
    );
  });

  it("page=3, pageSize=10 のとき skip=20 で DB を照会する（境界値）", async () => {
    vi.mocked(prisma.snap.findMany).mockResolvedValue([]);

    await findSnapsByQuery({ query: "denim jacket", page: 3, pageSize: 10 });

    expect(prisma.snap.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 20,
        take: 10,
      }),
    );
  });

  it("searchQuery で絞り込み、createdAt desc で並べる", async () => {
    vi.mocked(prisma.snap.findMany).mockResolvedValue([]);

    await findSnapsByQuery({ query: "M-65", page: 1, pageSize: 30 });

    expect(prisma.snap.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { searchQuery: "M-65" },
        orderBy: { createdAt: "desc" },
      }),
    );
  });

  it("DB が返した配列をそのまま返す", async () => {
    const snap = makeSnapRecord();
    vi.mocked(prisma.snap.findMany).mockResolvedValue([snap]);

    const result = await findSnapsByQuery({
      query: "denim jacket",
      page: 1,
      pageSize: 30,
    });

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("snap-uuid-1");
  });

  it("0 件の場合は空配列を返す", async () => {
    vi.mocked(prisma.snap.findMany).mockResolvedValue([]);

    const result = await findSnapsByQuery({
      query: "nonexistent",
      page: 1,
      pageSize: 30,
    });

    expect(result).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// upsertSnaps
// ---------------------------------------------------------------------------
describe("upsertSnaps", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("写真配列の件数分だけ prisma.snap.upsert を呼ぶ", async () => {
    vi.mocked(prisma.snap.upsert).mockResolvedValue(makeSnapRecord());

    const photos = [
      makeUnsplashPhoto({ id: "photo-1" }),
      makeUnsplashPhoto({ id: "photo-2" }),
      makeUnsplashPhoto({ id: "photo-3" }),
    ];

    await upsertSnaps(photos, "denim jacket");

    expect(prisma.snap.upsert).toHaveBeenCalledTimes(3);
  });

  it("upsert の where 条件は source + externalId の複合ユニークキーを使う", async () => {
    vi.mocked(prisma.snap.upsert).mockResolvedValue(makeSnapRecord());

    const photo = makeUnsplashPhoto({ id: "unsplash-photo-abc" });
    await upsertSnaps([photo], "M-65");

    expect(prisma.snap.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          source_externalId: {
            source: "unsplash",
            externalId: "unsplash-photo-abc",
          },
        },
      }),
    );
  });

  it("同一 source + externalId が既に存在しても upsert はエラーにならない（重複ガード）", async () => {
    // upsert は create-or-update なので、重複があっても例外を投げない
    vi.mocked(prisma.snap.upsert).mockResolvedValue(makeSnapRecord());

    const photo = makeUnsplashPhoto({ id: "duplicate-photo" });

    // 1回目
    await upsertSnaps([photo], "M-65");
    // 2回目（同一 ID）
    await upsertSnaps([photo], "M-65");

    // 例外が発生しなかったことを確認
    expect(prisma.snap.upsert).toHaveBeenCalledTimes(2);
  });

  it("create データに imageUrl / authorName / searchQuery / tags を正しく詰める", async () => {
    vi.mocked(prisma.snap.upsert).mockResolvedValue(makeSnapRecord());

    const photo = makeUnsplashPhoto({
      id: "photo-x",
      urls: {
        regular: "https://images.unsplash.com/photo-x/regular",
        small: "https://images.unsplash.com/photo-x/small",
      },
      alt_description: "A vintage jacket",
      user: {
        name: "Jane Smith",
        links: { html: "https://unsplash.com/@janesmith" },
      },
      links: { html: "https://unsplash.com/photos/photo-x" },
      tags: [{ title: "vintage" }, { title: "jacket" }],
    });

    await upsertSnaps([photo], "vintage jacket");

    const callArgs = vi.mocked(prisma.snap.upsert).mock.calls[0]![0];
    expect(callArgs.create).toMatchObject({
      source: "unsplash",
      externalId: "photo-x",
      imageUrl: "https://images.unsplash.com/photo-x/regular",
      authorName: "Jane Smith",
      authorUrl: "https://unsplash.com/@janesmith",
      sourceUrl: "https://unsplash.com/photos/photo-x",
      searchQuery: "vintage jacket",
      tags: ["vintage", "jacket"],
    });
  });

  it("写真が 0 件のとき upsert を呼ばない", async () => {
    await upsertSnaps([], "empty query");

    expect(prisma.snap.upsert).not.toHaveBeenCalled();
  });
});
