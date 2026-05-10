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
      createMany: vi.fn(),
      update: vi.fn(),
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
    searchQueries: string[];
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
  searchQueries: overrides.searchQueries ?? ["denim jacket"],
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
    vi.mocked(prisma.snap.findMany).mockResolvedValue([makeSnapRecord()]);

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

  it("searchQueries に query が含まれるレコードを has で絞り込む", async () => {
    vi.mocked(prisma.snap.findMany).mockResolvedValue([]);

    await findSnapsByQuery({ query: "M-65", page: 1, pageSize: 30 });

    expect(prisma.snap.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { searchQueries: { has: "M-65" } },
        orderBy: { createdAt: "desc" },
      }),
    );
  });

  it("DB が返した配列をそのまま返す", async () => {
    vi.mocked(prisma.snap.findMany).mockResolvedValue([makeSnapRecord()]);

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

  it("写真が 0 件のとき DB を一切叩かない", async () => {
    await upsertSnaps([], "empty query");

    expect(prisma.snap.findMany).not.toHaveBeenCalled();
    expect(prisma.snap.createMany).not.toHaveBeenCalled();
    expect(prisma.snap.update).not.toHaveBeenCalled();
  });

  it("全件新規のとき createMany 1 回で skipDuplicates=true を渡す", async () => {
    // 既存チェック: 0 件
    vi.mocked(prisma.snap.findMany).mockResolvedValue([]);
    vi.mocked(prisma.snap.createMany).mockResolvedValue({ count: 3 });

    const photos = [
      makeUnsplashPhoto({ id: "photo-1" }),
      makeUnsplashPhoto({ id: "photo-2" }),
      makeUnsplashPhoto({ id: "photo-3" }),
    ];

    await upsertSnaps(photos, "denim jacket");

    expect(prisma.snap.createMany).toHaveBeenCalledTimes(1);
    expect(prisma.snap.createMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skipDuplicates: true,
        data: expect.any(Array),
      }),
    );
    expect(prisma.snap.update).not.toHaveBeenCalled();
  });

  it("既存写真の searchQueries に query が未登録のとき update.push で追記する", async () => {
    vi.mocked(prisma.snap.findMany).mockResolvedValue([
      {
        externalId: "photo-1",
        searchQueries: ["denim jacket"],
      },
    ] as Awaited<ReturnType<typeof prisma.snap.findMany>>);
    vi.mocked(prisma.snap.update).mockResolvedValue(makeSnapRecord());

    await upsertSnaps([makeUnsplashPhoto({ id: "photo-1" })], "M-65");

    expect(prisma.snap.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          source_externalId: { source: "unsplash", externalId: "photo-1" },
        },
        data: { searchQueries: { push: "M-65" } },
      }),
    );
    // 既存のみなので createMany は呼ばれない
    expect(prisma.snap.createMany).not.toHaveBeenCalled();
  });

  it("既存写真の searchQueries に query が既に登録済みのとき update を呼ばない（重複ガード）", async () => {
    vi.mocked(prisma.snap.findMany).mockResolvedValue([
      {
        externalId: "photo-1",
        searchQueries: ["denim jacket", "M-65"],
      },
    ] as Awaited<ReturnType<typeof prisma.snap.findMany>>);

    await upsertSnaps([makeUnsplashPhoto({ id: "photo-1" })], "M-65");

    expect(prisma.snap.update).not.toHaveBeenCalled();
    expect(prisma.snap.createMany).not.toHaveBeenCalled();
  });

  it("新規と既存が混在するとき createMany と update を両方呼ぶ", async () => {
    vi.mocked(prisma.snap.findMany).mockResolvedValue([
      {
        externalId: "existing-photo",
        searchQueries: ["denim"],
      },
    ] as Awaited<ReturnType<typeof prisma.snap.findMany>>);
    vi.mocked(prisma.snap.createMany).mockResolvedValue({ count: 1 });
    vi.mocked(prisma.snap.update).mockResolvedValue(makeSnapRecord());

    await upsertSnaps(
      [
        makeUnsplashPhoto({ id: "new-photo" }),
        makeUnsplashPhoto({ id: "existing-photo" }),
      ],
      "M-65",
    );

    expect(prisma.snap.createMany).toHaveBeenCalledTimes(1);
    expect(prisma.snap.update).toHaveBeenCalledTimes(1);
  });

  it("createMany の data に imageUrl / authorName / searchQueries / tags を正しく詰める", async () => {
    vi.mocked(prisma.snap.findMany).mockResolvedValue([]);
    vi.mocked(prisma.snap.createMany).mockResolvedValue({ count: 1 });

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

    const callArgs = vi.mocked(prisma.snap.createMany).mock.calls[0]?.[0];
    if (!callArgs) throw new Error("createMany was not called");
    const firstRow = callArgs.data as Array<Record<string, unknown>>;
    expect(firstRow[0]).toMatchObject({
      source: "unsplash",
      externalId: "photo-x",
      imageUrl: "https://images.unsplash.com/photo-x/regular",
      authorName: "Jane Smith",
      authorUrl: "https://unsplash.com/@janesmith",
      sourceUrl: "https://unsplash.com/photos/photo-x",
      searchQueries: ["vintage jacket"],
      tags: ["vintage", "jacket"],
    });
  });

  it("source + externalId で既存判定を行う（複合ユニークキー）", async () => {
    vi.mocked(prisma.snap.findMany).mockResolvedValue([]);
    vi.mocked(prisma.snap.createMany).mockResolvedValue({ count: 1 });

    await upsertSnaps([makeUnsplashPhoto({ id: "photo-abc" })], "M-65");

    expect(prisma.snap.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          source: "unsplash",
          externalId: { in: ["photo-abc"] },
        },
      }),
    );
  });
});
