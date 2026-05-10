// ---------------------------------------------------------------------------
// SnapDetail コンポーネントのユニットテスト
//
// components/features/search/SnapDetail.tsx（未実装）を検証する。
// - 画像表示
// - analyzedAt が null のとき: ローディング表示 + Server Action 呼び出し
// - analyzedAt が non-null のとき: oneLiner / aiDescription / 共通コンポーネント
// - カラー / スタイル / アイテム クリックで /search?query=... へのリンク
// - ダウンロードボタン
// - 戻るリンク /search
// - 類似コーデセクション（初期 10 件 fetch）
// ---------------------------------------------------------------------------

const getSnapDetailActionMock = vi.fn();
const analyzeSnapActionMock = vi.fn();
const findSimilarSnapsActionMock = vi.fn();

vi.mock("@/app/actions/snap-detail", () => ({
  getSnapDetailAction: (...args: unknown[]) => getSnapDetailActionMock(...args),
  analyzeSnapAction: (...args: unknown[]) => analyzeSnapActionMock(...args),
  findSimilarSnapsAction: (...args: unknown[]) =>
    findSimilarSnapsActionMock(...args),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/search/test-id",
}));

import { render, screen, waitFor } from "@testing-library/react";
import { SnapDetail } from "@/components/features/search/SnapDetail";
import type { SnapDetail as SnapDetailType } from "@/types/snap";

// ---------------------------------------------------------------------------
// フィクスチャ
// ---------------------------------------------------------------------------
const VALID_UUID = "aaaaaaaa-1111-1111-1111-111111111111";

const makeSnapDetailAnalyzed = (
  overrides: Partial<SnapDetailType> = {},
): SnapDetailType => ({
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
  searchQueries: ["M-65", "アメカジ"],
  oneLiner: "静謐な倦怠",
  colorPalette: [
    { name: "インディゴ", colorCode: "#3B4D6B", percentage: 70 },
    { name: "ホワイト", colorCode: "#FFFFFF", percentage: 30 },
  ],
  styles: [{ name: "アメカジ", percentage: 100 }],
  aiDescription: "ヴィンテージデニムが主役のコーデ。",
  detectedItems: [{ name: "デニムジャケット" }, { name: "白Tシャツ" }],
  radarScores: {
    casual: 80,
    subdued: 50,
    presence: 60,
    subtle: 40,
    formal: 10,
    colorful: 20,
  },
  analyzedAt: new Date("2026-05-01T00:00:00Z"),
  createdAt: new Date("2026-05-01T00:00:00Z"),
  updatedAt: new Date("2026-05-01T00:00:00Z"),
  ...overrides,
});

const makeSnapDetailUnanalyzed = (): SnapDetailType =>
  makeSnapDetailAnalyzed({
    oneLiner: null,
    colorPalette: null,
    styles: null,
    aiDescription: null,
    detectedItems: null,
    radarScores: null,
    analyzedAt: null,
  });

// ---------------------------------------------------------------------------
// セットアップ
// ---------------------------------------------------------------------------
beforeEach(() => {
  vi.resetAllMocks();
  findSimilarSnapsActionMock.mockResolvedValue({ data: [], error: null });
});

// ---------------------------------------------------------------------------
// 画像表示
// ---------------------------------------------------------------------------
describe("SnapDetail — 画像表示", () => {
  it("snap の imageUrl を src に持つ img 要素が存在する", () => {
    const snap = makeSnapDetailAnalyzed();
    render(<SnapDetail snap={snap} />);

    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("src", expect.stringContaining("snap-001.jpg"));
  });
});

// ---------------------------------------------------------------------------
// analyzedAt === null のとき（未解析）
// ---------------------------------------------------------------------------
describe("SnapDetail — analyzedAt が null（未解析）", () => {
  it("ローディング表示が出る", async () => {
    const snap = makeSnapDetailUnanalyzed();
    analyzeSnapActionMock.mockResolvedValue({
      data: makeSnapDetailAnalyzed(),
      error: null,
    });
    render(<SnapDetail snap={snap} />);

    // ローディングインジケータ（スピナー or ローディングテキスト）が存在する
    await waitFor(() => {
      const spinner =
        screen.queryByRole("status") ??
        screen.queryByText(/解析|loading|読み込み/i);
      expect(spinner).not.toBeNull();
    });
  });

  it("マウント時に analyzeSnapAction を snap.id で呼ぶ", async () => {
    const snap = makeSnapDetailUnanalyzed();
    analyzeSnapActionMock.mockResolvedValue({
      data: makeSnapDetailAnalyzed(),
      error: null,
    });
    render(<SnapDetail snap={snap} />);

    await waitFor(() => {
      expect(analyzeSnapActionMock).toHaveBeenCalledWith(VALID_UUID);
    });
  });
});

// ---------------------------------------------------------------------------
// analyzedAt !== null のとき（解析済み）
// ---------------------------------------------------------------------------
describe("SnapDetail — analyzedAt が non-null（解析済み）", () => {
  it("oneLiner が表示される", () => {
    const snap = makeSnapDetailAnalyzed();
    render(<SnapDetail snap={snap} />);

    expect(screen.getByText("静謐な倦怠")).toBeInTheDocument();
  });

  it("aiDescription が表示される", () => {
    const snap = makeSnapDetailAnalyzed();
    render(<SnapDetail snap={snap} />);

    expect(
      screen.getByText("ヴィンテージデニムが主役のコーデ。"),
    ).toBeInTheDocument();
  });

  it("ColorPalette コンポーネント（カラー名「インディゴ」）が表示される", () => {
    const snap = makeSnapDetailAnalyzed();
    render(<SnapDetail snap={snap} />);

    expect(screen.getByText("インディゴ")).toBeInTheDocument();
  });

  it("StyleGauge コンポーネント（スタイル名「アメカジ」）が表示される", () => {
    const snap = makeSnapDetailAnalyzed();
    render(<SnapDetail snap={snap} />);

    expect(screen.getByText("アメカジ")).toBeInTheDocument();
  });

  it("ItemList コンポーネント（アイテム「デニムジャケット」）が表示される", () => {
    const snap = makeSnapDetailAnalyzed();
    render(<SnapDetail snap={snap} />);

    expect(screen.getByText("デニムジャケット")).toBeInTheDocument();
  });

  it("EvaluationRadar コンポーネントが存在する（radarScores が non-null）", () => {
    const snap = makeSnapDetailAnalyzed();
    render(<SnapDetail snap={snap} />);

    // EvaluationRadar は RadarChart を内包する。
    // recharts は canvas ではなく SVG を描画するため role=img か data-testid で確認する。
    // コンポーネント自体の存在確認として radar軸ラベル「カジュアル」をチェックする。
    expect(screen.getByText("カジュアル")).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// リンク先（検索クエリ連携）
// ---------------------------------------------------------------------------
describe("SnapDetail — 検索クエリリンク", () => {
  it("カラー「インディゴ」クリックで /search?query=インディゴ へのリンクが存在する", () => {
    const snap = makeSnapDetailAnalyzed();
    render(<SnapDetail snap={snap} />);

    const link = screen
      .getAllByRole("link")
      .find(
        (el) =>
          el.getAttribute("href") ===
          "/search?query=%E3%82%A4%E3%83%B3%E3%83%87%E3%82%A3%E3%82%B4",
      );
    expect(link).toBeDefined();
  });

  it("スタイル「アメカジ」クリックで /search?query=アメカジ へのリンクが存在する", () => {
    const snap = makeSnapDetailAnalyzed();
    render(<SnapDetail snap={snap} />);

    const link = screen
      .getAllByRole("link")
      .find(
        (el) =>
          el.getAttribute("href") ===
          "/search?query=%E3%82%A2%E3%83%A1%E3%82%AB%E3%82%B8",
      );
    expect(link).toBeDefined();
  });

  it("アイテム「デニムジャケット」クリックで /search?query=デニムジャケット へのリンクが存在する", () => {
    const snap = makeSnapDetailAnalyzed();
    render(<SnapDetail snap={snap} />);

    const link = screen
      .getAllByRole("link")
      .find(
        (el) =>
          el.getAttribute("href") ===
          "/search?query=%E3%83%87%E3%83%8B%E3%83%A0%E3%82%B8%E3%83%A3%E3%82%B1%E3%83%83%E3%83%88",
      );
    expect(link).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// ダウンロードボタン
// ---------------------------------------------------------------------------
describe("SnapDetail — ダウンロードボタン", () => {
  it("ダウンロードボタンが存在する", () => {
    const snap = makeSnapDetailAnalyzed();
    render(<SnapDetail snap={snap} />);

    const btn =
      screen.queryByRole("button", { name: /ダウンロード|download/i }) ??
      screen.queryByRole("link", { name: /ダウンロード|download/i });
    expect(btn).not.toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 戻るリンク
// ---------------------------------------------------------------------------
describe("SnapDetail — 戻るリンク", () => {
  it("/search へのリンクが存在する", () => {
    const snap = makeSnapDetailAnalyzed();
    render(<SnapDetail snap={snap} />);

    const backLink = screen
      .getAllByRole("link")
      .find((el) => el.getAttribute("href") === "/search");
    expect(backLink).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// 類似コーデセクション
// ---------------------------------------------------------------------------
describe("SnapDetail — 類似コーデセクション", () => {
  it("マウント時に findSimilarSnapsAction を pageSize=10 で呼ぶ", async () => {
    const snap = makeSnapDetailAnalyzed();
    findSimilarSnapsActionMock.mockResolvedValue({ data: [], error: null });
    render(<SnapDetail snap={snap} />);

    await waitFor(() => {
      expect(findSimilarSnapsActionMock).toHaveBeenCalledWith(
        expect.objectContaining({
          snapId: VALID_UUID,
          pageSize: 10,
        }),
      );
    });
  });

  it("類似コーデセクションが存在する", async () => {
    const snap = makeSnapDetailAnalyzed();
    findSimilarSnapsActionMock.mockResolvedValue({ data: [], error: null });
    render(<SnapDetail snap={snap} />);

    await waitFor(() => {
      const section =
        screen.queryByTestId("similar-snaps") ??
        screen.queryByText(/類似|similar/i);
      expect(section).not.toBeNull();
    });
  });
});
