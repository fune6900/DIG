// ---------------------------------------------------------------------------
// snap-service フィルタ拡張のユニットテスト (Red フェーズ)
//
// findSnapsByQuery の新シグネチャ:
//   findSnapsByQuery(params: {
//     query?: string;
//     styles?: string[];
//     colorCategories?: string[];
//     page: number;
//     pageSize: number;
//   }): Promise<SnapSummary[]>
//
// ootd-service パターンに準拠し Prisma クライアントを vi.mock する。
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
import { findSnapsByQuery } from "@/services/snap-service";

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
// styles フィルタ
// ---------------------------------------------------------------------------
describe("findSnapsByQuery — styles フィルタ", () => {
  it("styles 指定時は where に styles の hasSome 条件が組まれる", async () => {
    vi.mocked(prisma.snap.findMany).mockResolvedValue([]);

    await findSnapsByQuery({
      styles: ["アメカジ", "ストリートウェア"],
      page: 1,
      pageSize: 30,
    });

    expect(prisma.snap.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          styles: { hasSome: ["アメカジ", "ストリートウェア"] },
        }),
      }),
    );
  });

  it("styles を 1 件指定しても hasSome 配列として渡される", async () => {
    vi.mocked(prisma.snap.findMany).mockResolvedValue([]);

    await findSnapsByQuery({ styles: ["ミリタリー"], page: 1, pageSize: 30 });

    expect(prisma.snap.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          styles: { hasSome: ["ミリタリー"] },
        }),
      }),
    );
  });

  it("styles 指定 + query 未指定のとき searchQueries 条件は where に含まれない", async () => {
    vi.mocked(prisma.snap.findMany).mockResolvedValue([]);

    await findSnapsByQuery({ styles: ["アメカジ"], page: 1, pageSize: 30 });

    const callArg = vi.mocked(prisma.snap.findMany).mock.calls[0]?.[0];
    expect(callArg?.where).not.toHaveProperty("searchQueries");
  });

  it("styles のみ指定でも DB を照会して結果を返す（フィルタ単独検索可能）", async () => {
    const snaps = [makeSnapSummary("snap-1"), makeSnapSummary("snap-2")];
    vi.mocked(prisma.snap.findMany).mockResolvedValue(
      snaps as Awaited<ReturnType<typeof prisma.snap.findMany>>,
    );

    const result = await findSnapsByQuery({
      styles: ["アメカジ"],
      page: 1,
      pageSize: 30,
    });

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("snap-1");
  });
});

// ---------------------------------------------------------------------------
// colorCategories フィルタ
// ---------------------------------------------------------------------------
describe("findSnapsByQuery — colorCategories フィルタ", () => {
  it("colorCategories 指定時は where.colorCategories: { hasSome: [...] } が組まれる", async () => {
    vi.mocked(prisma.snap.findMany).mockResolvedValue([]);

    await findSnapsByQuery({
      colorCategories: ["ブラック系", "ネイビー系"],
      page: 1,
      pageSize: 30,
    });

    expect(prisma.snap.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          colorCategories: { hasSome: ["ブラック系", "ネイビー系"] },
        }),
      }),
    );
  });

  it("colorCategories を 1 件指定しても hasSome 配列として渡される", async () => {
    vi.mocked(prisma.snap.findMany).mockResolvedValue([]);

    await findSnapsByQuery({
      colorCategories: ["ホワイト系"],
      page: 1,
      pageSize: 30,
    });

    expect(prisma.snap.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          colorCategories: { hasSome: ["ホワイト系"] },
        }),
      }),
    );
  });

  it("colorCategories 指定 + query 未指定のとき searchQueries 条件は where に含まれない", async () => {
    vi.mocked(prisma.snap.findMany).mockResolvedValue([]);

    await findSnapsByQuery({
      colorCategories: ["ブラック系"],
      page: 1,
      pageSize: 30,
    });

    const callArg = vi.mocked(prisma.snap.findMany).mock.calls[0]?.[0];
    expect(callArg?.where).not.toHaveProperty("searchQueries");
  });

  it("colorCategories のみ指定でも DB を照会して結果を返す（フィルタ単独検索可能）", async () => {
    const snaps = [makeSnapSummary("snap-x")];
    vi.mocked(prisma.snap.findMany).mockResolvedValue(
      snaps as Awaited<ReturnType<typeof prisma.snap.findMany>>,
    );

    const result = await findSnapsByQuery({
      colorCategories: ["グリーン系"],
      page: 1,
      pageSize: 30,
    });

    expect(result).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// query + styles + colorCategories の AND 結合
// ---------------------------------------------------------------------------
describe("findSnapsByQuery — AND 条件組み合わせ", () => {
  it("query + styles + colorCategories を全て指定したとき where に 3 つの条件が AND で組まれる", async () => {
    vi.mocked(prisma.snap.findMany).mockResolvedValue([]);

    await findSnapsByQuery({
      query: "denim",
      styles: ["アメカジ"],
      colorCategories: ["ブルー系"],
      page: 1,
      pageSize: 30,
    });

    expect(prisma.snap.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          searchQueries: { hasSome: ["denim"] },
          styles: { hasSome: ["アメカジ"] },
          colorCategories: { hasSome: ["ブルー系"] },
        }),
      }),
    );
  });

  it("query + styles のみ指定（colorCategories なし）でも動く", async () => {
    vi.mocked(prisma.snap.findMany).mockResolvedValue([]);

    await findSnapsByQuery({
      query: "jacket",
      styles: ["ミリタリー"],
      page: 1,
      pageSize: 30,
    });

    const callArg = vi.mocked(prisma.snap.findMany).mock.calls[0]?.[0];
    expect(callArg?.where).toHaveProperty("searchQueries");
    expect(callArg?.where).toHaveProperty("styles");
    expect(callArg?.where).not.toHaveProperty("colorCategories");
  });

  it("query + colorCategories のみ指定（styles なし）でも動く", async () => {
    vi.mocked(prisma.snap.findMany).mockResolvedValue([]);

    await findSnapsByQuery({
      query: "vintage",
      colorCategories: ["ベージュ系"],
      page: 1,
      pageSize: 30,
    });

    const callArg = vi.mocked(prisma.snap.findMany).mock.calls[0]?.[0];
    expect(callArg?.where).toHaveProperty("searchQueries");
    expect(callArg?.where).not.toHaveProperty("styles");
    expect(callArg?.where).toHaveProperty("colorCategories");
  });
});

// ---------------------------------------------------------------------------
// query 指定時の searchQueries 条件
// ---------------------------------------------------------------------------
describe("findSnapsByQuery — query の where 条件", () => {
  it("query 指定時は searchQueries: { hasSome: [query] } 条件が組まれる", async () => {
    vi.mocked(prisma.snap.findMany).mockResolvedValue([]);

    await findSnapsByQuery({ query: "M-65", page: 1, pageSize: 30 });

    expect(prisma.snap.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          searchQueries: { hasSome: ["M-65"] },
        }),
      }),
    );
  });
});

// ---------------------------------------------------------------------------
// 全条件未指定: 空配列ガード
// ---------------------------------------------------------------------------
describe("findSnapsByQuery — analyzedAt ガード（AI 未解析を除外）", () => {
  it("styles 指定時は where に analyzedAt: { not: null } も組まれる", async () => {
    vi.mocked(prisma.snap.findMany).mockResolvedValue([]);

    await findSnapsByQuery({
      styles: ["アメカジ"],
      page: 1,
      pageSize: 30,
    });

    expect(prisma.snap.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          analyzedAt: { not: null },
        }),
      }),
    );
  });

  it("colorCategories 指定時は where に analyzedAt: { not: null } も組まれる", async () => {
    vi.mocked(prisma.snap.findMany).mockResolvedValue([]);

    await findSnapsByQuery({
      colorCategories: ["ブラック系"],
      page: 1,
      pageSize: 30,
    });

    expect(prisma.snap.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          analyzedAt: { not: null },
        }),
      }),
    );
  });

  it("query のみ指定（フィルタなし）のとき analyzedAt 条件は付かない", async () => {
    vi.mocked(prisma.snap.findMany).mockResolvedValue([]);

    await findSnapsByQuery({
      query: "M-65",
      page: 1,
      pageSize: 30,
    });

    const callArg = vi.mocked(prisma.snap.findMany).mock.calls[0]?.[0];
    if (!callArg) throw new Error("findMany not called");
    const where = callArg.where as Record<string, unknown>;
    expect(where).not.toHaveProperty("analyzedAt");
  });
});

describe("findSnapsByQuery — 全条件未指定", () => {
  it("query / styles / colorCategories が全て未指定のとき findMany を呼ばず空配列を返す", async () => {
    const result = await findSnapsByQuery({ page: 1, pageSize: 30 });

    expect(prisma.snap.findMany).not.toHaveBeenCalled();
    expect(result).toEqual([]);
  });

  it("styles が空配列 + colorCategories 未指定 + query 未指定のとき findMany を呼ばない", async () => {
    const result = await findSnapsByQuery({
      styles: [],
      page: 1,
      pageSize: 30,
    });

    expect(prisma.snap.findMany).not.toHaveBeenCalled();
    expect(result).toEqual([]);
  });

  it("colorCategories が空配列 + styles 未指定 + query 未指定のとき findMany を呼ばない", async () => {
    const result = await findSnapsByQuery({
      colorCategories: [],
      page: 1,
      pageSize: 30,
    });

    expect(prisma.snap.findMany).not.toHaveBeenCalled();
    expect(result).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// ページネーション（既存挙動の回帰）
// ---------------------------------------------------------------------------
describe("findSnapsByQuery — ページネーション（回帰）", () => {
  it("page=1, pageSize=30 のとき skip=0, take=30 で DB を照会する", async () => {
    vi.mocked(prisma.snap.findMany).mockResolvedValue([]);

    await findSnapsByQuery({ query: "denim", page: 1, pageSize: 30 });

    expect(prisma.snap.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 0, take: 30 }),
    );
  });

  it("page=2, pageSize=20 のとき skip=20 で DB を照会する", async () => {
    vi.mocked(prisma.snap.findMany).mockResolvedValue([]);

    await findSnapsByQuery({ styles: ["アメカジ"], page: 2, pageSize: 20 });

    expect(prisma.snap.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 20, take: 20 }),
    );
  });
});
