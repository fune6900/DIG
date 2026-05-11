// ---------------------------------------------------------------------------
// SearchPage URL パラメータ対応のユニットテスト
//
// ?query=hoge で訪問したとき:
//   - 検索フィールドに "hoge" が入っている
//   - 自動検索が走る（useInfiniteSnapSearch が "hoge" で呼ばれる）
// ---------------------------------------------------------------------------

const useInfiniteSnapSearchMock = vi.fn();

vi.mock("@/hooks/useInfiniteSnapSearch", () => ({
  useInfiniteSnapSearch: (params: {
    query?: string;
    styles?: string[];
    colorCategories?: string[];
  }) => useInfiniteSnapSearchMock(params),
}));

// useSearchParams をモックして ?query=hoge を差し込む
// 各テスト内で動的に書き換えるため module-level mock にする。
const mockSearchParams = { get: vi.fn() };

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => mockSearchParams,
  usePathname: () => "/search",
}));

import { render, screen, waitFor } from "@testing-library/react";
import { SearchPage } from "@/components/features/search/SearchPage";

// ---------------------------------------------------------------------------
// デフォルトの useInfiniteSnapSearch の戻り値（空結果）
// ---------------------------------------------------------------------------
const defaultSearchReturn = {
  data: undefined,
  hasNextPage: false,
  isFetchingNextPage: false,
  isPending: false,
  fetchNextPage: vi.fn(),
};

// ---------------------------------------------------------------------------
// セットアップ
// ---------------------------------------------------------------------------
beforeEach(() => {
  vi.resetAllMocks();
  useInfiniteSnapSearchMock.mockReturnValue(defaultSearchReturn);
});

// ---------------------------------------------------------------------------
// URL パラメータ ?query=hoge
// ---------------------------------------------------------------------------
describe("SearchPage — ?query=hoge での訪問", () => {
  it("?query=hoge のとき検索フィールドに 'hoge' が入っている", () => {
    mockSearchParams.get.mockImplementation((key: string) =>
      key === "query" ? "hoge" : null,
    );

    render(<SearchPage />);

    const input = screen.getByRole("textbox");
    expect(input).toHaveValue("hoge");
  });

  it("?query=hoge のとき useInfiniteSnapSearch が { query: 'hoge' } で呼ばれる（自動検索）", async () => {
    mockSearchParams.get.mockImplementation((key: string) =>
      key === "query" ? "hoge" : null,
    );

    render(<SearchPage />);

    await waitFor(() => {
      expect(useInfiniteSnapSearchMock).toHaveBeenCalledWith(
        expect.objectContaining({ query: "hoge" }),
      );
    });
  });

  it("?query=M-65 のとき検索フィールドに 'M-65' が入っている", () => {
    mockSearchParams.get.mockImplementation((key: string) =>
      key === "query" ? "M-65" : null,
    );

    render(<SearchPage />);

    const input = screen.getByRole("textbox");
    expect(input).toHaveValue("M-65");
  });

  it("?query=M-65 のとき useInfiniteSnapSearch が { query: 'M-65' } で呼ばれる", async () => {
    mockSearchParams.get.mockImplementation((key: string) =>
      key === "query" ? "M-65" : null,
    );

    render(<SearchPage />);

    await waitFor(() => {
      expect(useInfiniteSnapSearchMock).toHaveBeenCalledWith(
        expect.objectContaining({ query: "M-65" }),
      );
    });
  });
});

// ---------------------------------------------------------------------------
// URL パラメータなし（既存挙動の回帰テスト）
// ---------------------------------------------------------------------------
describe("SearchPage — query パラメータなしでの訪問", () => {
  it("query パラメータがないとき検索フィールドは空", () => {
    mockSearchParams.get.mockReturnValue(null);

    render(<SearchPage />);

    const input = screen.getByRole("textbox");
    expect(input).toHaveValue("");
  });

  it("query パラメータがないとき useInfiniteSnapSearch は query=undefined で呼ばれる", async () => {
    // SearchPage は空文字を `query || undefined` で undefined に正規化して
    // hook に渡す（SnapSearchInputSchema の refine が空文字を弾くため）。
    mockSearchParams.get.mockReturnValue(null);

    render(<SearchPage />);

    await waitFor(() => {
      expect(useInfiniteSnapSearchMock).toHaveBeenCalledWith(
        expect.objectContaining({ query: undefined }),
      );
    });
  });
});
