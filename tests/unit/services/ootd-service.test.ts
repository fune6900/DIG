import { findOotds, findOotdById, createOotd, deleteOotd } from "@/services/ootd-service";

// ---------------------------------------------------------------------------
// Prisma クライアントをモック（外部DB接続のためモック許可）
// ---------------------------------------------------------------------------
vi.mock("@/lib/prisma", () => ({
  prisma: {
    ootd: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/prisma";

// ---------------------------------------------------------------------------
// テスト用フィクスチャ
// ---------------------------------------------------------------------------
const makeOotdRecord = (id: string, createdAt: Date) => ({
  id,
  imageUrl: "https://example.com/ootd.jpg",
  oneLiner: "今日のコーデ",
  colorPalette: [{ name: "インディゴ", colorCode: "#3B4D6B", percentage: 100 }],
  styles: [{ name: "ストリート", percentage: 100 }],
  description: "ヴィンテージデニムを主役にしたコーデ",
  detectedItems: [{ name: "デニムジャケット" }],
  date: new Date("2026-03-15"),
  tags: ["古着"],
  createdAt,
  updatedAt: createdAt,
});

const OLDER = new Date("2026-01-01T00:00:00Z");
const NEWER = new Date("2026-03-15T00:00:00Z");

const FIXTURE_A = makeOotdRecord("uuid-a", OLDER);
const FIXTURE_B = makeOotdRecord("uuid-b", NEWER);

// ---------------------------------------------------------------------------
// findOotds
// ---------------------------------------------------------------------------
describe("findOotds", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sort: 'desc' で投稿日降順（新しい順）の配列を返す", async () => {
    const descOrder = [FIXTURE_B, FIXTURE_A];
    vi.mocked(prisma.ootd.findMany).mockResolvedValue(descOrder);

    const result = await findOotds({ sort: "desc" });

    expect(prisma.ootd.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { createdAt: "desc" },
      }),
    );
    expect(result[0].id).toBe("uuid-b");
    expect(result[1].id).toBe("uuid-a");
  });

  it("sort: 'asc' で投稿日昇順（古い順）の配列を返す", async () => {
    const ascOrder = [FIXTURE_A, FIXTURE_B];
    vi.mocked(prisma.ootd.findMany).mockResolvedValue(ascOrder);

    const result = await findOotds({ sort: "asc" });

    expect(prisma.ootd.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { createdAt: "asc" },
      }),
    );
    expect(result[0].id).toBe("uuid-a");
    expect(result[1].id).toBe("uuid-b");
  });

  it("DBが空のとき空配列を返す", async () => {
    vi.mocked(prisma.ootd.findMany).mockResolvedValue([]);

    const result = await findOotds({ sort: "desc" });

    expect(result).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// findOotdById
// ---------------------------------------------------------------------------
describe("findOotdById", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("存在する ID で OOTD 詳細を返す", async () => {
    vi.mocked(prisma.ootd.findUnique).mockResolvedValue(FIXTURE_A);

    const result = await findOotdById("uuid-a");

    expect(prisma.ootd.findUnique).toHaveBeenCalledWith({
      where: { id: "uuid-a" },
    });
    expect(result).not.toBeNull();
    expect(result?.id).toBe("uuid-a");
  });

  it("存在しない ID で null を返す", async () => {
    vi.mocked(prisma.ootd.findUnique).mockResolvedValue(null);

    const result = await findOotdById("non-existent-id");

    expect(result).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// createOotd
// ---------------------------------------------------------------------------
describe("createOotd", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("新規OOTDを作成して返す", async () => {
    const input = {
      imageUrl: "https://example.com/new-ootd.jpg",
      oneLiner: "新しいコーデ",
      colorPalette: [{ name: "ブラック", colorCode: "#000000", percentage: 100 }],
      styles: [{ name: "モード", percentage: 100 }],
      description: "全身黒コーデ",
      detectedItems: [{ name: "ブラックジャケット" }],
      date: new Date("2026-04-01"),
      tags: ["黒"],
    };

    const created = {
      ...input,
      id: "uuid-new",
      createdAt: new Date("2026-04-01T10:00:00Z"),
      updatedAt: new Date("2026-04-01T10:00:00Z"),
    };

    vi.mocked(prisma.ootd.create).mockResolvedValue(created);

    const result = await createOotd(input);

    expect(prisma.ootd.create).toHaveBeenCalledTimes(1);
    expect(result.id).toBe("uuid-new");
    expect(result.oneLiner).toBe("新しいコーデ");
    expect(result.imageUrl).toBe("https://example.com/new-ootd.jpg");
  });

  it("prisma.ootd.create に正しい data を渡す", async () => {
    const input = {
      imageUrl: "https://example.com/ootd.jpg",
      oneLiner: "コーデメモ",
      colorPalette: [],
      styles: [],
      description: "",
      detectedItems: [],
      date: new Date("2026-04-10"),
      tags: [],
    };

    const created = {
      ...input,
      id: "uuid-created",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(prisma.ootd.create).mockResolvedValue(created);

    await createOotd(input);

    expect(prisma.ootd.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          imageUrl: "https://example.com/ootd.jpg",
          oneLiner: "コーデメモ",
        }),
      }),
    );
  });
});

// ---------------------------------------------------------------------------
// deleteOotd
// ---------------------------------------------------------------------------
describe("deleteOotd", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("指定した ID の OOTD を削除する", async () => {
    vi.mocked(prisma.ootd.delete).mockResolvedValue(FIXTURE_A);

    await deleteOotd("uuid-a");

    expect(prisma.ootd.delete).toHaveBeenCalledWith({
      where: { id: "uuid-a" },
    });
    expect(prisma.ootd.delete).toHaveBeenCalledTimes(1);
  });
});
