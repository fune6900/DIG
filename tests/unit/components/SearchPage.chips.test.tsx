// ---------------------------------------------------------------------------
// SearchPage — 連結キーワードのチップ表示・削除統合テスト
//
// ?query=「アメカジ レッド」のような半角スペース区切り URL で訪問したとき:
//   - 各語がチップとして表示される
//   - × クリックで URL が残りの語で更新される
//   - 全削除すると /search に遷移
// ---------------------------------------------------------------------------

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const useInfiniteSnapSearchMock = vi.fn();
vi.mock("@/hooks/useInfiniteSnapSearch", () => ({
  useInfiniteSnapSearch: (params: unknown) => useInfiniteSnapSearchMock(params),
}));

const pushMock = vi.fn();
const mockSearchParams = { get: vi.fn() };
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, replace: vi.fn() }),
  useSearchParams: () => mockSearchParams,
  usePathname: () => "/search",
}));

import { SearchPage } from "@/components/features/search/SearchPage";

const defaultSearchReturn = {
  data: undefined,
  hasNextPage: false,
  isFetchingNextPage: false,
  isPending: false,
  fetchNextPage: vi.fn(),
};

beforeEach(() => {
  vi.resetAllMocks();
  useInfiniteSnapSearchMock.mockReturnValue(defaultSearchReturn);
});

describe("SearchPage — 連結キーワードのチップ表示", () => {
  it("?query=アメカジ レッド で訪問するとチップ 2 つが表示される", () => {
    mockSearchParams.get.mockImplementation((key: string) =>
      key === "query" ? "アメカジ レッド" : null,
    );

    render(<SearchPage />);

    expect(
      screen.getByRole("button", { name: /アメカジを削除/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /レッドを削除/ }),
    ).toBeInTheDocument();
  });

  it("?query=hoge（単一語）のときはチップを表示しない", () => {
    mockSearchParams.get.mockImplementation((key: string) =>
      key === "query" ? "hoge" : null,
    );

    render(<SearchPage />);

    expect(screen.queryByRole("button", { name: /hogeを削除/ })).toBeNull();
  });

  it("チップの × クリックで /search?query=<残り> へ遷移する", async () => {
    mockSearchParams.get.mockImplementation((key: string) =>
      key === "query" ? "アメカジ レッド ブルー" : null,
    );

    render(<SearchPage />);

    await userEvent.click(screen.getByRole("button", { name: /レッドを削除/ }));

    expect(pushMock).toHaveBeenCalledTimes(1);
    const pushed = pushMock.mock.calls[0][0] as string;
    const url = new URL(pushed, "http://localhost");
    expect(url.pathname).toBe("/search");
    expect(url.searchParams.get("query")).toBe("アメカジ ブルー");
  });

  it("最後に 1 語だけ残るチップを削除すると /search に遷移する", async () => {
    // 仕様: 2語→1語までの削除は ?query=<残り> へ遷移、1語→0語の削除は /search へ
    // （単一語のときはチップ非表示なので、× をユーザーが押せるのは2語以上から1語へ
    //  落とすときと、その後で SearchInput のテキストを直接消すパスのみ）
    mockSearchParams.get.mockImplementation((key: string) =>
      key === "query" ? "アメカジ レッド" : null,
    );

    render(<SearchPage />);

    await userEvent.click(
      screen.getByRole("button", { name: /アメカジを削除/ }),
    );

    expect(pushMock).toHaveBeenCalledTimes(1);
    const pushed = pushMock.mock.calls[0][0] as string;
    const url = new URL(pushed, "http://localhost");
    expect(url.pathname).toBe("/search");
    expect(url.searchParams.get("query")).toBe("レッド");
  });
});
