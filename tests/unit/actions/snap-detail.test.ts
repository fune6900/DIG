// ---------------------------------------------------------------------------
// snap-detail Server Actions のユニットテスト
//
// app/actions/snap-detail.ts（未実装）の以下を検証する。
//   - getSnapDetailAction: Zod(uuid) 検証 / 存在チェック / 正常返却
//   - analyzeSnapAction: 既解析スキップ / 未解析時の AI 呼び出しと保存 / AI エラー
//   - findSimilarSnapsAction: Zod 検証と委譲
// ---------------------------------------------------------------------------

const getSnapByIdMock = vi.fn();
const updateSnapMock = vi.fn();
const analyzeSnapImageMock = vi.fn();
const findSimilarSnapsMock = vi.fn();

vi.mock("@/services/snap-service", () => ({
  getSnapById: (...args: unknown[]) => getSnapByIdMock(...args),
  updateSnap: (...args: unknown[]) => updateSnapMock(...args),
  findSimilarSnaps: (...args: unknown[]) => findSimilarSnapsMock(...args),
}));

vi.mock("@/services/snap-analysis", () => ({
  analyzeSnapImage: (...args: unknown[]) => analyzeSnapImageMock(...args),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    snap: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import {
  getSnapDetailAction,
  analyzeSnapAction,
  findSimilarSnapsAction,
} from "@/app/actions/snap-detail";
import type { OotdAnalysisResult } from "@/types/ootd";

// ---------------------------------------------------------------------------
// フィクスチャ
// ---------------------------------------------------------------------------
const VALID_UUID = "aaaaaaaa-1111-1111-1111-111111111111";

const makeAnalysisResult = (): OotdAnalysisResult => ({
  oneLiner: "静謐な倦怠",
  colorPalette: [{ name: "インディゴ", colorCode: "#3B4D6B", percentage: 100 }],
  styles: [{ name: "アメカジ", percentage: 100 }],
  description: "ヴィンテージデニムが主役。",
  detectedItems: [{ name: "デニムジャケット" }],
  radarScores: {
    casual: 80,
    subdued: 50,
    presence: 60,
    subtle: 40,
    formal: 10,
    colorful: 20,
  },
});

const makeSnap = (overrides: Record<string, unknown> = {}) => ({
  id: VALID_UUID,
  source: "unsplash",
  externalId: "unsplash-001",
  imageUrl: "https://images.example.com/snap-001.jpg",
  sourceUrl: "https://example.com/photos/001",
  authorName: "Test Author",
  authorUrl: "https://example.com/@test",
  title: null,
  description: null,
  tags: ["fashion"],
  searchQueries: ["M-65"],
  oneLiner: null,
  colorPalette: null,
  styles: null,
  aiDescription: null,
  detectedItems: null,
  radarScores: null,
  analyzedAt: null,
  createdAt: new Date("2026-05-01T00:00:00Z"),
  updatedAt: new Date("2026-05-01T00:00:00Z"),
  ...overrides,
});

// ---------------------------------------------------------------------------
// セットアップ
// ---------------------------------------------------------------------------
beforeEach(() => {
  vi.resetAllMocks();
});

// ---------------------------------------------------------------------------
// getSnapDetailAction
// ---------------------------------------------------------------------------
describe("getSnapDetailAction — Zod バリデーション", () => {
  it("id が UUID でないとき VALIDATION_ERROR を返す", async () => {
    const result = await getSnapDetailAction("not-a-uuid");

    expect(result).toMatchObject({
      data: null,
      error: { code: "VALIDATION_ERROR" },
    });
    expect(getSnapByIdMock).not.toHaveBeenCalled();
  });

  it("id が null のとき VALIDATION_ERROR を返す", async () => {
    const result = await getSnapDetailAction(null);

    expect(result).toMatchObject({
      data: null,
      error: { code: "VALIDATION_ERROR" },
    });
  });

  it("id が数値のとき VALIDATION_ERROR を返す", async () => {
    const result = await getSnapDetailAction(12345);

    expect(result).toMatchObject({
      data: null,
      error: { code: "VALIDATION_ERROR" },
    });
  });
});

describe("getSnapDetailAction — 存在チェック", () => {
  it("Snap が存在しないとき NOT_FOUND を返す", async () => {
    getSnapByIdMock.mockResolvedValueOnce(null);

    const result = await getSnapDetailAction(VALID_UUID);

    expect(result).toMatchObject({
      data: null,
      error: { code: "NOT_FOUND" },
    });
  });
});

describe("getSnapDetailAction — 正常系", () => {
  it("Snap が存在するとき data に Snap を返す", async () => {
    const snap = makeSnap();
    getSnapByIdMock.mockResolvedValueOnce(snap);

    const result = await getSnapDetailAction(VALID_UUID);

    expect(result).toMatchObject({ data: snap, error: null });
  });

  it("getSnapById を正しい id で呼ぶ", async () => {
    getSnapByIdMock.mockResolvedValueOnce(makeSnap());

    await getSnapDetailAction(VALID_UUID);

    expect(getSnapByIdMock).toHaveBeenCalledWith(VALID_UUID);
  });
});

// ---------------------------------------------------------------------------
// analyzeSnapAction
// ---------------------------------------------------------------------------
describe("analyzeSnapAction — Zod バリデーション", () => {
  it("id が UUID でないとき VALIDATION_ERROR を返す", async () => {
    const result = await analyzeSnapAction("bad-id");

    expect(result).toMatchObject({
      data: null,
      error: { code: "VALIDATION_ERROR" },
    });
  });
});

describe("analyzeSnapAction — 既解析スキップ", () => {
  it("analyzedAt が non-null のとき analyzeSnapImage を呼ばずにそのまま返す", async () => {
    const analyzedSnap = makeSnap({
      analyzedAt: new Date("2026-05-02T00:00:00Z"),
    });
    getSnapByIdMock.mockResolvedValueOnce(analyzedSnap);

    const result = await analyzeSnapAction(VALID_UUID);

    expect(analyzeSnapImageMock).not.toHaveBeenCalled();
    expect(result).toMatchObject({ data: analyzedSnap, error: null });
  });
});

describe("analyzeSnapAction — 未解析時の AI 解析フロー", () => {
  it("analyzedAt が null のとき analyzeSnapImage を imageUrl で呼ぶ", async () => {
    const snap = makeSnap({ analyzedAt: null });
    getSnapByIdMock.mockResolvedValueOnce(snap);
    analyzeSnapImageMock.mockResolvedValueOnce(makeAnalysisResult());
    updateSnapMock.mockResolvedValueOnce({ ...snap, analyzedAt: new Date() });

    await analyzeSnapAction(VALID_UUID);

    expect(analyzeSnapImageMock).toHaveBeenCalledWith(snap.imageUrl);
  });

  it("AI 解析結果で Snap を更新し analyzedAt を設定する", async () => {
    const snap = makeSnap({ analyzedAt: null });
    const analysisResult = makeAnalysisResult();
    getSnapByIdMock.mockResolvedValueOnce(snap);
    analyzeSnapImageMock.mockResolvedValueOnce(analysisResult);
    const updatedSnap = {
      ...snap,
      ...analysisResult,
      aiDescription: analysisResult.description,
      analyzedAt: new Date("2026-05-03T00:00:00Z"),
    };
    updateSnapMock.mockResolvedValueOnce(updatedSnap);

    const result = await analyzeSnapAction(VALID_UUID);

    expect(updateSnapMock).toHaveBeenCalledWith(
      VALID_UUID,
      expect.objectContaining({
        oneLiner: analysisResult.oneLiner,
        analyzedAt: expect.any(Date),
      }),
    );
    expect(result).toMatchObject({ data: updatedSnap, error: null });
  });

  it("AI 解析エラー時は ANALYSIS_FAILED を返す", async () => {
    const snap = makeSnap({ analyzedAt: null });
    getSnapByIdMock.mockResolvedValueOnce(snap);
    analyzeSnapImageMock.mockRejectedValueOnce(new Error("Gemini API error"));

    const result = await analyzeSnapAction(VALID_UUID);

    expect(result).toMatchObject({
      data: null,
      error: { code: "ANALYSIS_FAILED" },
    });
  });

  it("AI 解析エラー時は updateSnap を呼ばない", async () => {
    const snap = makeSnap({ analyzedAt: null });
    getSnapByIdMock.mockResolvedValueOnce(snap);
    analyzeSnapImageMock.mockRejectedValueOnce(new Error("Network error"));

    await analyzeSnapAction(VALID_UUID);

    expect(updateSnapMock).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// findSimilarSnapsAction
// ---------------------------------------------------------------------------
describe("findSimilarSnapsAction — Zod バリデーション", () => {
  it("snapId が UUID でないとき VALIDATION_ERROR を返す", async () => {
    const result = await findSimilarSnapsAction({
      snapId: "not-uuid",
      searchQueries: ["M-65"],
      page: 1,
      pageSize: 10,
    });

    expect(result).toMatchObject({
      data: null,
      error: { code: "VALIDATION_ERROR" },
    });
    expect(findSimilarSnapsMock).not.toHaveBeenCalled();
  });

  it("page が 0 のとき VALIDATION_ERROR を返す", async () => {
    const result = await findSimilarSnapsAction({
      snapId: VALID_UUID,
      searchQueries: ["M-65"],
      page: 0,
      pageSize: 10,
    });

    expect(result).toMatchObject({
      data: null,
      error: { code: "VALIDATION_ERROR" },
    });
  });

  it("pageSize が 0 のとき VALIDATION_ERROR を返す", async () => {
    const result = await findSimilarSnapsAction({
      snapId: VALID_UUID,
      searchQueries: ["M-65"],
      page: 1,
      pageSize: 0,
    });

    expect(result).toMatchObject({
      data: null,
      error: { code: "VALIDATION_ERROR" },
    });
  });

  it("input が null のとき VALIDATION_ERROR を返す", async () => {
    const result = await findSimilarSnapsAction(null);

    expect(result).toMatchObject({
      data: null,
      error: { code: "VALIDATION_ERROR" },
    });
  });
});

describe("findSimilarSnapsAction — 正常委譲", () => {
  it("バリデーション通過後に findSimilarSnaps を呼ぶ", async () => {
    findSimilarSnapsMock.mockResolvedValueOnce([]);

    await findSimilarSnapsAction({
      snapId: VALID_UUID,
      searchQueries: ["M-65"],
      page: 1,
      pageSize: 10,
    });

    expect(findSimilarSnapsMock).toHaveBeenCalledWith({
      snapId: VALID_UUID,
      searchQueries: ["M-65"],
      page: 1,
      pageSize: 10,
    });
  });

  it("findSimilarSnaps の結果を data に包んで返す", async () => {
    const snaps = [
      {
        id: "bbbbbbbb-0000-0000-0000-000000000002",
        imageUrl: "https://example.com/b.jpg",
        authorName: "B",
        sourceUrl: "https://example.com/b",
      },
    ];
    findSimilarSnapsMock.mockResolvedValueOnce(snaps);

    const result = await findSimilarSnapsAction({
      snapId: VALID_UUID,
      searchQueries: ["M-65"],
      page: 1,
      pageSize: 10,
    });

    expect(result).toMatchObject({ data: snaps, error: null });
  });
});
