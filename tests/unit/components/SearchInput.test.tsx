// ---------------------------------------------------------------------------
// SearchInput コンポーネントのユニットテスト
//
// - 入力フィールドのレンダリング
// - Enter キー押下で onSearch 発火
// - 検索ボタンクリックで onSearch 発火
// - 空文字では onSearch を発火しない
// - 既存値を初期値として表示
// ---------------------------------------------------------------------------

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SearchInput } from "@/components/features/search/SearchInput";

// ---------------------------------------------------------------------------
// テスト
// ---------------------------------------------------------------------------
describe("SearchInput", () => {
  it("テキスト入力フィールドが表示される", () => {
    render(<SearchInput onSearch={vi.fn()} />);

    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("検索ボタンが表示される", () => {
    render(<SearchInput onSearch={vi.fn()} />);

    expect(screen.getByRole("button", { name: /検索/ })).toBeInTheDocument();
  });

  it("Enter キー押下で onSearch が入力値を引数に呼ばれる", async () => {
    const onSearch = vi.fn();
    render(<SearchInput onSearch={onSearch} />);

    const input = screen.getByRole("textbox");
    await userEvent.type(input, "denim jacket");
    await userEvent.keyboard("{Enter}");

    expect(onSearch).toHaveBeenCalledTimes(1);
    expect(onSearch).toHaveBeenCalledWith("denim jacket");
  });

  it("検索ボタンクリックで onSearch が入力値を引数に呼ばれる", async () => {
    const onSearch = vi.fn();
    render(<SearchInput onSearch={onSearch} />);

    const input = screen.getByRole("textbox");
    await userEvent.type(input, "M-65");
    await userEvent.click(screen.getByRole("button", { name: /検索/ }));

    expect(onSearch).toHaveBeenCalledTimes(1);
    expect(onSearch).toHaveBeenCalledWith("M-65");
  });

  it("入力が空文字のとき Enter を押しても onSearch を呼ばない", async () => {
    const onSearch = vi.fn();
    render(<SearchInput onSearch={onSearch} />);

    const input = screen.getByRole("textbox");
    await userEvent.click(input);
    await userEvent.keyboard("{Enter}");

    expect(onSearch).not.toHaveBeenCalled();
  });

  it("入力が空文字のとき検索ボタンをクリックしても onSearch を呼ばない", async () => {
    const onSearch = vi.fn();
    render(<SearchInput onSearch={onSearch} />);

    await userEvent.click(screen.getByRole("button", { name: /検索/ }));

    expect(onSearch).not.toHaveBeenCalled();
  });

  it("空白のみの入力では onSearch を呼ばない", async () => {
    const onSearch = vi.fn();
    render(<SearchInput onSearch={onSearch} />);

    const input = screen.getByRole("textbox");
    await userEvent.type(input, "   ");
    await userEvent.keyboard("{Enter}");

    expect(onSearch).not.toHaveBeenCalled();
  });

  it("initialQuery が指定されたとき入力フィールドに初期値として表示される", () => {
    render(<SearchInput onSearch={vi.fn()} initialQuery="vintage denim" />);

    const input = screen.getByRole("textbox");
    expect(input).toHaveValue("vintage denim");
  });

  it("initialQuery が未指定のとき入力フィールドは空", () => {
    render(<SearchInput onSearch={vi.fn()} />);

    const input = screen.getByRole("textbox");
    expect(input).toHaveValue("");
  });
});
