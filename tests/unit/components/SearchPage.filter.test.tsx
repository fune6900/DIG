// ---------------------------------------------------------------------------
// SearchPage フィルタ URL パラメータ対応のユニットテスト (Red フェーズ)
//
// ?styles=アメカジ,ストリートウェア&colors=ブラック系 の URL で訪問したとき:
//   - searchSnapsAction が styles/colorCategories を含む引数で呼ばれる
//   - 検索結果一覧が表示される
// ---------------------------------------------------------------------------

const searchSnapsActionMock = vi.fn();

vi.mock("@/app/actions/search", () => ({
  searchSnapsAction: (...args: unknown[]) => searchSnapsActionMock(...args),
}));

// useSearchParams をモックして URL パラメータを差し込む
const mockSearchParams = { get: vi.fn() };

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => mockSearchParams,
  usePathname: () => "/search",
}));

// useInfiniteSnapSearch は searchSnapsAction を内部で呼ぶが、
// ここでは SearchPage の URL → action 引数の結合を検証するため
// useInfiniteSnapSearch ごとモックしてシンプルに検証する。
const useInfiniteSnapSearchMock = vi.fn();

vi.mock("@/hooks/useInfiniteSnapSearch", () => ({
  useInfiniteSnapSearch: (...args: unknown[]) =>
    useInfiniteSnapSearchMock(...args),
}));

import { render, screen, waitFor } from "@testing-library/react";
import { SearchPage } from "@/components/features/search/SearchPage";

// ---------------------------------------------------------------------------
// フィクスチャ
// ---------------------------------------------------------------------------
const makeSnapSummary = (id: string) => ({
  id,
  imageUrl: `https://images.unsplash.com/${id}/regular`,
  authorName: "Test Author",
  sourceUrl: `https://unsplash.com/photos/${id}`,
});

const defaultSearchReturn = {
  data: undefined,
  hasNextPage: false,
  isFetchingNextPage: false,
  isPending: false,
  fetchNextPage: vi.fn(),
};

const makeSearchReturn = (items: ReturnType<typeof makeSnapSummary>[]) => ({
  data: {
    pages: [{ data: { items, hasMore: false, page: 1 }, error: null }],
  },
  hasNextPage: false,
  isFetchingNextPage: false,
  isPending: false,
  fetchNextPage: vi.fn(),
});

// ---------------------------------------------------------------------------
// セットアップ
// ---------------------------------------------------------------------------
beforeEach(() => {
  vi.resetAllMocks();
  useInfiniteSnapSearchMock.mockReturnValue(defaultSearchReturn);
});

// ---------------------------------------------------------------------------
// styles / colors URL パラメータの受け取り
// ---------------------------------------------------------------------------
describe("SearchPage — styles / colors URL パラメータ受け取り", () => {
  it("?styles=アメカジ,ストリートウェア で訪問したとき useInfiniteSnapSearch に styles 配列が渡される", async () => {
    mockSearchParams.get.mockImplementation((key: string) => {
      if (key === "styles") return "アメカジ,ストリートウェア";
      return null;
    });

    render(<SearchPage />);

    await waitFor(() => {
      expect(useInfiniteSnapSearchMock).toHaveBeenCalledWith(
        expect.objectContaining({
          styles: ["アメカジ", "ストリートウェア"],
        }),
      );
    });
  });

  it("?colors=ブラック系 で訪問したとき useInfiniteSnapSearch に colorCategories 配列が渡される", async () => {
    mockSearchParams.get.mockImplementation((key: string) => {
      if (key === "colors") return "ブラック系";
      return null;
    });

    render(<SearchPage />);

    await waitFor(() => {
      expect(useInfiniteSnapSearchMock).toHaveBeenCalledWith(
        expect.objectContaining({
          colorCategories: ["ブラック系"],
        }),
      );
    });
  });

  it("?styles=アメカジ,ストリートウェア&colors=ブラック系 で styles / colorCategories 両方が渡される", async () => {
    mockSearchParams.get.mockImplementation((key: string) => {
      if (key === "styles") return "アメカジ,ストリートウェア";
      if (key === "colors") return "ブラック系";
      return null;
    });

    render(<SearchPage />);

    await waitFor(() => {
      expect(useInfiniteSnapSearchMock).toHaveBeenCalledWith(
        expect.objectContaining({
          styles: ["アメカジ", "ストリートウェア"],
          colorCategories: ["ブラック系"],
        }),
      );
    });
  });

  it("styles / colors パラメータがないとき styles / colorCategories は空配列で渡される", async () => {
    mockSearchParams.get.mockReturnValue(null);

    render(<SearchPage />);

    await waitFor(() => {
      expect(useInfiniteSnapSearchMock).toHaveBeenCalledWith(
        expect.objectContaining({
          styles: [],
          colorCategories: [],
        }),
      );
    });
  });

  it("?query=vintage&styles=アメカジ で query + styles 両方が渡される", async () => {
    mockSearchParams.get.mockImplementation((key: string) => {
      if (key === "query") return "vintage";
      if (key === "styles") return "アメカジ";
      return null;
    });

    render(<SearchPage />);

    await waitFor(() => {
      expect(useInfiniteSnapSearchMock).toHaveBeenCalledWith(
        expect.objectContaining({
          query: "vintage",
          styles: ["アメカジ"],
        }),
      );
    });
  });
});

// ---------------------------------------------------------------------------
// 検索結果の表示
// ---------------------------------------------------------------------------
describe("SearchPage — フィルタ条件での検索結果表示", () => {
  it("styles フィルタで検索結果が返ったとき snap カードが表示される", async () => {
    mockSearchParams.get.mockImplementation((key: string) => {
      if (key === "styles") return "アメカジ";
      return null;
    });

    useInfiniteSnapSearchMock.mockReturnValue(
      makeSearchReturn([
        makeSnapSummary("snap-filter-1"),
        makeSnapSummary("snap-filter-2"),
      ]),
    );

    render(<SearchPage />);

    await waitFor(() => {
      expect(screen.getByTestId("snap-grid")).toBeInTheDocument();
    });
  });

  it("colors フィルタで 0 件のとき snap-grid が存在する（空状態でも壊れない）", async () => {
    mockSearchParams.get.mockImplementation((key: string) => {
      if (key === "colors") return "ゴールド系";
      return null;
    });

    useInfiniteSnapSearchMock.mockReturnValue(makeSearchReturn([]));

    render(<SearchPage />);

    await waitFor(() => {
      expect(screen.getByTestId("snap-grid")).toBeInTheDocument();
    });
  });
});
