// ---------------------------------------------------------------------------
// SearchInput コンポーネントのユニットテスト
//
// - 入力フィールドのレンダリング
// - Enter キー押下で onSearch 発火
// - 検索ボタンクリックで onSearch 発火
// - 空文字では onSearch を発火しない
// - 既存値を初期値として表示
// - 『画像で検索』ボタンクリックで onImageSearch 発火（新フロー）
// ---------------------------------------------------------------------------

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SearchInput } from "@/components/features/search/SearchInput";

// ---------------------------------------------------------------------------
// テスト
// ---------------------------------------------------------------------------
describe("SearchInput", () => {
  it("テキスト入力フィールドが表示される", () => {
    render(<SearchInput onSearch={vi.fn()} onImageSearch={vi.fn()} />);

    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("検索ボタンが表示される", () => {
    render(<SearchInput onSearch={vi.fn()} onImageSearch={vi.fn()} />);

    expect(screen.getByRole("button", { name: /^検索$/ })).toBeInTheDocument();
  });

  it("Enter キー押下で onSearch が入力値を引数に呼ばれる", async () => {
    const onSearch = vi.fn();
    render(<SearchInput onSearch={onSearch} onImageSearch={vi.fn()} />);

    const input = screen.getByRole("textbox");
    await userEvent.type(input, "denim jacket");
    await userEvent.keyboard("{Enter}");

    expect(onSearch).toHaveBeenCalledTimes(1);
    expect(onSearch).toHaveBeenCalledWith("denim jacket");
  });

  it("検索ボタンクリックで onSearch が入力値を引数に呼ばれる", async () => {
    const onSearch = vi.fn();
    render(<SearchInput onSearch={onSearch} onImageSearch={vi.fn()} />);

    const input = screen.getByRole("textbox");
    await userEvent.type(input, "M-65");
    await userEvent.click(screen.getByRole("button", { name: /^検索$/ }));

    expect(onSearch).toHaveBeenCalledTimes(1);
    expect(onSearch).toHaveBeenCalledWith("M-65");
  });

  it("入力が空文字のとき Enter を押しても onSearch を呼ばない", async () => {
    const onSearch = vi.fn();
    render(<SearchInput onSearch={onSearch} onImageSearch={vi.fn()} />);

    const input = screen.getByRole("textbox");
    await userEvent.click(input);
    await userEvent.keyboard("{Enter}");

    expect(onSearch).not.toHaveBeenCalled();
  });

  it("入力が空文字のとき検索ボタンをクリックしても onSearch を呼ばない", async () => {
    const onSearch = vi.fn();
    render(<SearchInput onSearch={onSearch} onImageSearch={vi.fn()} />);

    await userEvent.click(screen.getByRole("button", { name: /^検索$/ }));

    expect(onSearch).not.toHaveBeenCalled();
  });

  it("空白のみの入力では onSearch を呼ばない", async () => {
    const onSearch = vi.fn();
    render(<SearchInput onSearch={onSearch} onImageSearch={vi.fn()} />);

    const input = screen.getByRole("textbox");
    await userEvent.type(input, "   ");
    await userEvent.keyboard("{Enter}");

    expect(onSearch).not.toHaveBeenCalled();
  });

  it("initialQuery が指定されたとき入力フィールドに初期値として表示される", () => {
    render(
      <SearchInput
        onSearch={vi.fn()}
        onImageSearch={vi.fn()}
        initialQuery="vintage denim"
      />,
    );

    const input = screen.getByRole("textbox");
    expect(input).toHaveValue("vintage denim");
  });

  it("initialQuery が未指定のとき入力フィールドは空", () => {
    render(<SearchInput onSearch={vi.fn()} onImageSearch={vi.fn()} />);

    const input = screen.getByRole("textbox");
    expect(input).toHaveValue("");
  });

  describe("チップ表示（複数語キーワード）", () => {
    it("initialQuery が複数語のときチップが各語ごとに表示される", () => {
      render(
        <SearchInput
          onSearch={vi.fn()}
          onImageSearch={vi.fn()}
          initialQuery="アメカジ レッド"
        />,
      );

      expect(
        screen.getByRole("button", { name: /アメカジを削除/ }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /レッドを削除/ }),
      ).toBeInTheDocument();
    });

    it("initialQuery が単一語のときはチップを表示しない", () => {
      render(
        <SearchInput
          onSearch={vi.fn()}
          onImageSearch={vi.fn()}
          initialQuery="アメカジ"
        />,
      );

      expect(
        screen.queryByRole("button", { name: /アメカジを削除/ }),
      ).toBeNull();
    });

    it("initialQuery が空のときはチップを表示しない", () => {
      render(<SearchInput onSearch={vi.fn()} onImageSearch={vi.fn()} />);

      expect(screen.queryByText("×")).toBeNull();
    });

    it("チップの × クリックで onSearch が残りの語のみで呼ばれる", async () => {
      const onSearch = vi.fn();
      render(
        <SearchInput
          onSearch={onSearch}
          onImageSearch={vi.fn()}
          initialQuery="アメカジ レッド ブルー"
        />,
      );

      await userEvent.click(
        screen.getByRole("button", { name: /レッドを削除/ }),
      );

      expect(onSearch).toHaveBeenCalledTimes(1);
      expect(onSearch).toHaveBeenCalledWith("アメカジ ブルー");
    });

    it("2 語あるチップから 1 つ削除すると onSearch が残りの語で呼ばれる", async () => {
      // 仕様: 削除して 1 語だけになるとチップは非表示になる（× は出ない）
      // → 残りの語を直接テキスト編集して空にするパスでカバーされる
      const onSearch = vi.fn();
      render(
        <SearchInput
          onSearch={onSearch}
          onImageSearch={vi.fn()}
          initialQuery="アメカジ レッド"
        />,
      );

      await userEvent.click(
        screen.getByRole("button", { name: /アメカジを削除/ }),
      );

      expect(onSearch).toHaveBeenCalledTimes(1);
      expect(onSearch).toHaveBeenCalledWith("レッド");
    });
  });

  describe("画像で検索（新フロー）", () => {
    it("『画像で検索』ボタンが表示される（Link ではない）", () => {
      render(<SearchInput onSearch={vi.fn()} onImageSearch={vi.fn()} />);

      const btn = screen.getByRole("button", { name: /画像で検索/ });
      expect(btn).toBeInTheDocument();
      expect(btn.tagName.toLowerCase()).toBe("button");
    });

    it("『画像で検索』をクリックすると onImageSearch が呼ばれる", async () => {
      const onImageSearch = vi.fn();
      render(<SearchInput onSearch={vi.fn()} onImageSearch={onImageSearch} />);

      await userEvent.click(screen.getByRole("button", { name: /画像で検索/ }));

      expect(onImageSearch).toHaveBeenCalledTimes(1);
    });

    it("『画像で検索』ボタンは /search/image への遷移リンクではない", () => {
      render(<SearchInput onSearch={vi.fn()} onImageSearch={vi.fn()} />);

      const links = screen.queryAllByRole("link", { name: /画像で検索/ });
      expect(links).toHaveLength(0);
    });
  });
});
