import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { KnowledgeSearchForm } from "@/components/features/knowledge/KnowledgeSearchForm";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => new URLSearchParams(),
}));

const defaultProps = {
  categories: ["スウェット", "デニム", "ジャケット"],
  eras: ["1960s", "1970s", "1980s", "1990s", "2000s"],
};

describe("KnowledgeSearchForm", () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  it("検索テキストボックスが表示される", () => {
    render(<KnowledgeSearchForm {...defaultProps} />);
    const input =
      screen.queryByRole("searchbox") ??
      screen.queryByPlaceholderText("検索");
    expect(input).toBeInTheDocument();
  });

  it("検索ボタンが表示される", () => {
    render(<KnowledgeSearchForm {...defaultProps} />);
    expect(
      screen.getByRole("button", { name: /検索/ })
    ).toBeInTheDocument();
  });

  it("カテゴリのセレクトが表示される", () => {
    render(<KnowledgeSearchForm {...defaultProps} />);
    // combobox role はネイティブ select に対応
    const selects = screen.getAllByRole("combobox");
    // 少なくとも2つ（カテゴリ・年代）のセレクトが存在する
    expect(selects.length).toBeGreaterThanOrEqual(2);
  });

  it("年代のセレクトが表示される", () => {
    render(<KnowledgeSearchForm {...defaultProps} />);
    const selects = screen.getAllByRole("combobox");
    expect(selects.length).toBeGreaterThanOrEqual(2);
  });

  it("フォーム送信時に router.push が呼ばれる", async () => {
    const user = userEvent.setup();
    render(<KnowledgeSearchForm {...defaultProps} />);

    const input =
      (screen.queryByRole("searchbox") as HTMLInputElement | null) ??
      (screen.queryByPlaceholderText("検索") as HTMLInputElement | null);
    if (input) {
      await user.clear(input);
      await user.type(input, "Champion");
    }

    await user.click(screen.getByRole("button", { name: /検索/ }));

    expect(mockPush).toHaveBeenCalledTimes(1);
    const calledUrl: string = mockPush.mock.calls[0][0] as string;
    expect(calledUrl).toContain("Champion");
  });

  it("defaultQuery='Champion' が渡されたとき input の value が 'Champion' になっている", () => {
    render(
      <KnowledgeSearchForm {...defaultProps} defaultQuery="Champion" />
    );
    const input =
      (screen.queryByRole("searchbox") as HTMLInputElement | null) ??
      (screen.queryByPlaceholderText("検索") as HTMLInputElement | null);
    expect(input).not.toBeNull();
    expect((input as HTMLInputElement).value).toBe("Champion");
  });
});
