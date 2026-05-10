// ---------------------------------------------------------------------------
// findSimilarSnaps のユニットテスト
//
// services/snap-service.ts に追加される findSimilarSnaps 関数を検証する。
// - searchQueries の hasSome で OR 検索
// - 自分自身（snapId）を除外
// - 空 searchQueries のとき DB を叩かずに空配列を返す
// - skip / take のページング計算
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
import { findSimilarSnaps } from "@/services/snap-service";

// ---------------------------------------------------------------------------
// フィクスチャ
// ---------------------------------------------------------------------------
const SNAP_ID = "aaaaaaaa-0000-0000-0000-000000000001";

const makeSnapSummary = (id: string) => ({
  id,
  imageUrl: `https://images.example.com/${id}/regular`,
  authorName: "Test Author",
  sourceUrl: `https://example.com/photos/${id}`,
});

// ---------------------------------------------------------------------------
// セットアップ
// ---------------------------------------------------------------------------
beforeEach(() => {
  vi.resetAllMocks();
});

// ---------------------------------------------------------------------------
// searchQueries フィルタリング
// ---------------------------------------------------------------------------
describe("findSimilarSnaps — searchQueries フィルタリング", () => {
  it("searchQueries の hasSome で OR 検索を行う", async () => {
    vi.mocked(prisma.snap.findMany).mockResolvedValue([]);

    await findSimilarSnaps({
      snapId: SNAP_ID,
      searchQueries: ["M-65", "アメカジ"],
      page: 1,
      pageSize: 10,
    });

    expect(prisma.snap.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          searchQueries: { hasSome: ["M-65", "アメカジ"] },
        }),
      }),
    );
  });

  it("空 searchQueries のとき DB を叩かず空配列を返す", async () => {
    const result = await findSimilarSnaps({
      snapId: SNAP_ID,
      searchQueries: [],
      page: 1,
      pageSize: 10,
    });

    expect(result).toEqual([]);
    expect(prisma.snap.findMany).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// 自己除外
// ---------------------------------------------------------------------------
describe("findSimilarSnaps — 自己除外", () => {
  it("where に id !== snapId の除外条件が含まれる", async () => {
    vi.mocked(prisma.snap.findMany).mockResolvedValue([]);

    await findSimilarSnaps({
      snapId: SNAP_ID,
      searchQueries: ["デニム"],
      page: 1,
      pageSize: 10,
    });

    expect(prisma.snap.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: { not: SNAP_ID },
        }),
      }),
    );
  });
});

// ---------------------------------------------------------------------------
// ソート順
// ---------------------------------------------------------------------------
describe("findSimilarSnaps — ソート順", () => {
  it("createdAt desc でソートされる", async () => {
    vi.mocked(prisma.snap.findMany).mockResolvedValue([]);

    await findSimilarSnaps({
      snapId: SNAP_ID,
      searchQueries: ["デニム"],
      page: 1,
      pageSize: 10,
    });

    expect(prisma.snap.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { createdAt: "desc" },
      }),
    );
  });
});

// ---------------------------------------------------------------------------
// ページング
// ---------------------------------------------------------------------------
describe("findSimilarSnaps — ページング", () => {
  it("page=1, pageSize=10 のとき skip=0, take=10 で DB を照会する", async () => {
    vi.mocked(prisma.snap.findMany).mockResolvedValue([]);

    await findSimilarSnaps({
      snapId: SNAP_ID,
      searchQueries: ["デニム"],
      page: 1,
      pageSize: 10,
    });

    expect(prisma.snap.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 0, take: 10 }),
    );
  });

  it("page=2, pageSize=10 のとき skip=10 で DB を照会する", async () => {
    vi.mocked(prisma.snap.findMany).mockResolvedValue([]);

    await findSimilarSnaps({
      snapId: SNAP_ID,
      searchQueries: ["デニム"],
      page: 2,
      pageSize: 10,
    });

    expect(prisma.snap.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 10, take: 10 }),
    );
  });

  it("page=3, pageSize=5 のとき skip=10 で DB を照会する（境界値）", async () => {
    vi.mocked(prisma.snap.findMany).mockResolvedValue([]);

    await findSimilarSnaps({
      snapId: SNAP_ID,
      searchQueries: ["デニム"],
      page: 3,
      pageSize: 5,
    });

    expect(prisma.snap.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 10, take: 5 }),
    );
  });
});

// ---------------------------------------------------------------------------
// 戻り値
// ---------------------------------------------------------------------------
describe("findSimilarSnaps — 戻り値", () => {
  it("DB が返した SnapSummary 配列をそのまま返す", async () => {
    const records = [
      makeSnapSummary("bbbbbbbb-0000-0000-0000-000000000002"),
      makeSnapSummary("cccccccc-0000-0000-0000-000000000003"),
    ];
    vi.mocked(prisma.snap.findMany).mockResolvedValue(
      records as Awaited<ReturnType<typeof prisma.snap.findMany>>,
    );

    const result = await findSimilarSnaps({
      snapId: SNAP_ID,
      searchQueries: ["デニム"],
      page: 1,
      pageSize: 10,
    });

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("bbbbbbbb-0000-0000-0000-000000000002");
  });

  it("DB が 0 件のとき空配列を返す", async () => {
    vi.mocked(prisma.snap.findMany).mockResolvedValue([]);

    const result = await findSimilarSnaps({
      snapId: SNAP_ID,
      searchQueries: ["存在しないキーワード"],
      page: 1,
      pageSize: 10,
    });

    expect(result).toHaveLength(0);
  });
});
