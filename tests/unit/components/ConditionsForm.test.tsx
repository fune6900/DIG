// ---------------------------------------------------------------------------
// ConditionsForm コンポーネントのユニットテスト (Red フェーズ)
//
// 対象: components/features/search/ConditionsForm.tsx (未実装)
// Props:
//   initialStyles: string[]
//   initialColors: string[]
//   initialQuery: string
//   onSearch: (params: { styles: string[]; colors: string[]; query: string }) => void
//   onReset: () => void
// ---------------------------------------------------------------------------

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => ({ get: vi.fn().mockReturnValue(null) }),
  usePathname: () => "/search/conditions",
}));

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConditionsForm } from "@/components/features/search/ConditionsForm";
import { STYLE_GROUPS } from "@/lib/style-groups";
import { COLOR_CATEGORIES } from "@/lib/color-catalog";

// ---------------------------------------------------------------------------
// フィクスチャ: 全スタイル名のフラットリスト
// ---------------------------------------------------------------------------
const ALL_STYLES = STYLE_GROUPS.flatMap((g) => g.styles);

// ---------------------------------------------------------------------------
// セットアップ
// ---------------------------------------------------------------------------
beforeEach(() => {
  vi.resetAllMocks();
});

// ---------------------------------------------------------------------------
// スタイル選択
// ---------------------------------------------------------------------------
describe("ConditionsForm — スタイル選択", () => {
  it("STYLE_GROUPS 全件分のスタイル名がチェックボックスとして表示される", () => {
    render(
      <ConditionsForm
        initialStyles={[]}
        initialColors={[]}
        initialQuery=""
        onSearch={vi.fn()}
        onReset={vi.fn()}
      />,
    );

    // 全スタイルがチェックボックスとして存在する
    for (const style of ALL_STYLES) {
      expect(screen.getByRole("checkbox", { name: style })).toBeInTheDocument();
    }
  });

  it("initialStyles が ['アメカジ'] のとき該当チェックボックスが checked", () => {
    render(
      <ConditionsForm
        initialStyles={["アメカジ"]}
        initialColors={[]}
        initialQuery=""
        onSearch={vi.fn()}
        onReset={vi.fn()}
      />,
    );

    expect(screen.getByRole("checkbox", { name: "アメカジ" })).toBeChecked();
  });

  it("initialStyles に含まれないスタイルは unchecked", () => {
    render(
      <ConditionsForm
        initialStyles={["アメカジ"]}
        initialColors={[]}
        initialQuery=""
        onSearch={vi.fn()}
        onReset={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("checkbox", { name: "ストリートウェア" }),
    ).not.toBeChecked();
  });

  it("スタイルのチェックボックスをクリックすると checked になる", async () => {
    render(
      <ConditionsForm
        initialStyles={[]}
        initialColors={[]}
        initialQuery=""
        onSearch={vi.fn()}
        onReset={vi.fn()}
      />,
    );

    const checkbox = screen.getByRole("checkbox", { name: "ミリタリー" });
    await userEvent.click(checkbox);

    expect(checkbox).toBeChecked();
  });

  it("チェック済みスタイルをクリックすると unchecked になる（トグル）", async () => {
    render(
      <ConditionsForm
        initialStyles={["ミリタリー"]}
        initialColors={[]}
        initialQuery=""
        onSearch={vi.fn()}
        onReset={vi.fn()}
      />,
    );

    const checkbox = screen.getByRole("checkbox", { name: "ミリタリー" });
    await userEvent.click(checkbox);

    expect(checkbox).not.toBeChecked();
  });
});

// ---------------------------------------------------------------------------
// カラー選択
// ---------------------------------------------------------------------------
describe("ConditionsForm — カラー選択", () => {
  it("COLOR_CATEGORIES 16 件がカラーボタンとして表示される", () => {
    render(
      <ConditionsForm
        initialStyles={[]}
        initialColors={[]}
        initialQuery=""
        onSearch={vi.fn()}
        onReset={vi.fn()}
      />,
    );

    for (const color of COLOR_CATEGORIES) {
      expect(screen.getByRole("button", { name: color })).toBeInTheDocument();
    }
  });

  it("initialColors が ['ブラック系'] のとき該当ボタンは aria-pressed=true", () => {
    render(
      <ConditionsForm
        initialStyles={[]}
        initialColors={["ブラック系"]}
        initialQuery=""
        onSearch={vi.fn()}
        onReset={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "ブラック系" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("initialColors に含まれないカラーは aria-pressed=false", () => {
    render(
      <ConditionsForm
        initialStyles={[]}
        initialColors={["ブラック系"]}
        initialQuery=""
        onSearch={vi.fn()}
        onReset={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "ホワイト系" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("カラーボタンをクリックすると aria-pressed が true になる", async () => {
    render(
      <ConditionsForm
        initialStyles={[]}
        initialColors={[]}
        initialQuery=""
        onSearch={vi.fn()}
        onReset={vi.fn()}
      />,
    );

    const btn = screen.getByRole("button", { name: "ネイビー系" });
    await userEvent.click(btn);

    expect(btn).toHaveAttribute("aria-pressed", "true");
  });

  it("選択済みカラーボタンをクリックすると aria-pressed が false になる（トグル）", async () => {
    render(
      <ConditionsForm
        initialStyles={[]}
        initialColors={["ネイビー系"]}
        initialQuery=""
        onSearch={vi.fn()}
        onReset={vi.fn()}
      />,
    );

    const btn = screen.getByRole("button", { name: "ネイビー系" });
    await userEvent.click(btn);

    expect(btn).toHaveAttribute("aria-pressed", "false");
  });
});

// ---------------------------------------------------------------------------
// 検索ボタン
// ---------------------------------------------------------------------------
describe("ConditionsForm — 検索ボタン", () => {
  it("「検索」ボタンが存在する", () => {
    render(
      <ConditionsForm
        initialStyles={[]}
        initialColors={[]}
        initialQuery=""
        onSearch={vi.fn()}
        onReset={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: /検索/ })).toBeInTheDocument();
  });

  it("スタイルとカラーを選択して「検索」クリック → onSearch が styles/colors/query で呼ばれる", async () => {
    const onSearch = vi.fn();
    render(
      <ConditionsForm
        initialStyles={[]}
        initialColors={[]}
        initialQuery="vintage"
        onSearch={onSearch}
        onReset={vi.fn()}
      />,
    );

    await userEvent.click(screen.getByRole("checkbox", { name: "アメカジ" }));
    await userEvent.click(screen.getByRole("button", { name: "ブラック系" }));
    await userEvent.click(screen.getByRole("button", { name: /検索/ }));

    expect(onSearch).toHaveBeenCalledWith({
      styles: ["アメカジ"],
      colors: ["ブラック系"],
      query: "vintage",
    });
  });

  it("何も選択していないとき「検索」ボタンは disabled で onSearch を呼ばない", async () => {
    // 仕様: 無選択（query 空 + styles 空 + colors 空）のときは検索を発火させず
    // 「押せるのに何も起きない」状態を防ぐ。disabled UX で意図を明示する。
    const onSearch = vi.fn();
    render(
      <ConditionsForm
        initialStyles={[]}
        initialColors={[]}
        initialQuery=""
        onSearch={onSearch}
        onReset={vi.fn()}
      />,
    );

    const searchBtn = screen.getByRole("button", { name: /検索/ });
    expect(searchBtn).toBeDisabled();

    await userEvent.click(searchBtn);
    expect(onSearch).not.toHaveBeenCalled();
  });

  it("スタイル 1 件選択で「検索」ボタンが有効化される", async () => {
    const onSearch = vi.fn();
    render(
      <ConditionsForm
        initialStyles={["アメカジ"]}
        initialColors={[]}
        initialQuery=""
        onSearch={onSearch}
        onReset={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: /検索/ })).not.toBeDisabled();
  });

  it("initialStyles / initialColors が設定された状態で「検索」クリック → 初期値が onSearch に渡される", async () => {
    const onSearch = vi.fn();
    render(
      <ConditionsForm
        initialStyles={["ミリタリー"]}
        initialColors={["グリーン系"]}
        initialQuery=""
        onSearch={onSearch}
        onReset={vi.fn()}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: /検索/ }));

    expect(onSearch).toHaveBeenCalledWith({
      styles: ["ミリタリー"],
      colors: ["グリーン系"],
      query: "",
    });
  });
});

// ---------------------------------------------------------------------------
// キーワード入力（編集可能）
// ---------------------------------------------------------------------------
describe("ConditionsForm — キーワード入力", () => {
  it("キーワード入力フィールドが表示される", () => {
    render(
      <ConditionsForm
        initialStyles={[]}
        initialColors={[]}
        initialQuery=""
        onSearch={vi.fn()}
        onReset={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("textbox", { name: /キーワード/ }),
    ).toBeInTheDocument();
  });

  it("initialQuery が指定されたとき入力フィールドに初期値として表示される", () => {
    render(
      <ConditionsForm
        initialStyles={[]}
        initialColors={[]}
        initialQuery="vintage denim"
        onSearch={vi.fn()}
        onReset={vi.fn()}
      />,
    );

    expect(screen.getByRole("textbox", { name: /キーワード/ })).toHaveValue(
      "vintage denim",
    );
  });

  it("キーワードを編集して検索 → 編集後の値が onSearch の query に渡る", async () => {
    const onSearch = vi.fn();
    render(
      <ConditionsForm
        initialStyles={["アメカジ"]}
        initialColors={[]}
        initialQuery="vintage"
        onSearch={onSearch}
        onReset={vi.fn()}
      />,
    );

    const input = screen.getByRole("textbox", { name: /キーワード/ });
    await userEvent.clear(input);
    await userEvent.type(input, "M-65");

    await userEvent.click(screen.getByRole("button", { name: /検索/ }));

    expect(onSearch).toHaveBeenCalledWith({
      styles: ["アメカジ"],
      colors: [],
      query: "M-65",
    });
  });

  it("キーワード入力のみで（スタイル・カラー未選択）「検索」ボタンが有効化される", async () => {
    render(
      <ConditionsForm
        initialStyles={[]}
        initialColors={[]}
        initialQuery=""
        onSearch={vi.fn()}
        onReset={vi.fn()}
      />,
    );

    const searchBtn = screen.getByRole("button", { name: /検索/ });
    expect(searchBtn).toBeDisabled();

    const input = screen.getByRole("textbox", { name: /キーワード/ });
    await userEvent.type(input, "501");

    expect(searchBtn).not.toBeDisabled();
  });

  it("「リセット」クリックでキーワードもクリアされる", async () => {
    render(
      <ConditionsForm
        initialStyles={[]}
        initialColors={[]}
        initialQuery="vintage"
        onSearch={vi.fn()}
        onReset={vi.fn()}
      />,
    );

    const input = screen.getByRole("textbox", { name: /キーワード/ });
    expect(input).toHaveValue("vintage");

    await userEvent.click(screen.getByRole("button", { name: /リセット/ }));

    expect(input).toHaveValue("");
  });
});

// ---------------------------------------------------------------------------
// リセットボタン
// ---------------------------------------------------------------------------
describe("ConditionsForm — リセットボタン", () => {
  it("「リセット」ボタンが存在する", () => {
    render(
      <ConditionsForm
        initialStyles={[]}
        initialColors={[]}
        initialQuery=""
        onSearch={vi.fn()}
        onReset={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("button", { name: /リセット/ }),
    ).toBeInTheDocument();
  });

  it("「リセット」クリックで onReset が呼ばれる", async () => {
    const onReset = vi.fn();
    render(
      <ConditionsForm
        initialStyles={[]}
        initialColors={[]}
        initialQuery=""
        onSearch={vi.fn()}
        onReset={onReset}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: /リセット/ }));

    expect(onReset).toHaveBeenCalledTimes(1);
  });

  it("スタイルを選択した後「リセット」クリック → チェックが外れる", async () => {
    render(
      <ConditionsForm
        initialStyles={[]}
        initialColors={[]}
        initialQuery=""
        onSearch={vi.fn()}
        onReset={vi.fn()}
      />,
    );

    await userEvent.click(screen.getByRole("checkbox", { name: "アメカジ" }));
    expect(screen.getByRole("checkbox", { name: "アメカジ" })).toBeChecked();

    await userEvent.click(screen.getByRole("button", { name: /リセット/ }));

    expect(
      screen.getByRole("checkbox", { name: "アメカジ" }),
    ).not.toBeChecked();
  });

  it("カラーを選択した後「リセット」クリック → aria-pressed が false になる", async () => {
    render(
      <ConditionsForm
        initialStyles={[]}
        initialColors={[]}
        initialQuery=""
        onSearch={vi.fn()}
        onReset={vi.fn()}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "ネイビー系" }));
    expect(screen.getByRole("button", { name: "ネイビー系" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    await userEvent.click(screen.getByRole("button", { name: /リセット/ }));

    expect(screen.getByRole("button", { name: "ネイビー系" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });
});
