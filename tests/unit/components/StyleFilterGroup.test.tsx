// ---------------------------------------------------------------------------
// StyleFilterGroup コンポーネントのユニットテスト (Red フェーズ)
//
// 対象: components/features/search/StyleFilterGroup.tsx (未実装)
// Props:
//   group: (typeof STYLE_GROUPS)[number]
//   selected: ReadonlySet<string>
//   onToggle: (styleName: string) => void
// ---------------------------------------------------------------------------

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => ({ get: vi.fn().mockReturnValue(null) }),
  usePathname: () => "/search/conditions",
}));

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StyleFilterGroup } from "@/components/features/search/StyleFilterGroup";
import { STYLE_GROUPS } from "@/lib/style-groups";

// ---------------------------------------------------------------------------
// フィクスチャ
// ---------------------------------------------------------------------------
const GROUP = STYLE_GROUPS[0]; // "ストリート・カジュアル系"

// ---------------------------------------------------------------------------
// セットアップ
// ---------------------------------------------------------------------------
beforeEach(() => {
  vi.resetAllMocks();
});

// ---------------------------------------------------------------------------
// レンダリング
// ---------------------------------------------------------------------------
describe("StyleFilterGroup — レンダリング", () => {
  it("グループ名が見出しとして表示される", () => {
    render(
      <StyleFilterGroup
        group={GROUP}
        selected={new Set()}
        onToggle={vi.fn()}
      />,
    );

    expect(screen.getByText(GROUP.name)).toBeInTheDocument();
  });

  it("グループ内の全スタイル数分のチェックボックスが表示される", () => {
    render(
      <StyleFilterGroup
        group={GROUP}
        selected={new Set()}
        onToggle={vi.fn()}
      />,
    );

    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes).toHaveLength(GROUP.styles.length);
  });

  it("各スタイル名がチェックボックスのラベルとして存在する", () => {
    render(
      <StyleFilterGroup
        group={GROUP}
        selected={new Set()}
        onToggle={vi.fn()}
      />,
    );

    for (const style of GROUP.styles) {
      expect(screen.getByRole("checkbox", { name: style })).toBeInTheDocument();
    }
  });
});

// ---------------------------------------------------------------------------
// selected 状態の反映
// ---------------------------------------------------------------------------
describe("StyleFilterGroup — selected 状態", () => {
  it("selected に含まれるスタイルのチェックボックスは checked", () => {
    render(
      <StyleFilterGroup
        group={GROUP}
        selected={new Set(["アメカジ"])}
        onToggle={vi.fn()}
      />,
    );

    expect(screen.getByRole("checkbox", { name: "アメカジ" })).toBeChecked();
  });

  it("selected に含まれないスタイルのチェックボックスは unchecked", () => {
    render(
      <StyleFilterGroup
        group={GROUP}
        selected={new Set(["アメカジ"])}
        onToggle={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("checkbox", { name: "ストリートウェア" }),
    ).not.toBeChecked();
  });

  it("selected が空 Set のとき全チェックボックスが unchecked", () => {
    render(
      <StyleFilterGroup
        group={GROUP}
        selected={new Set()}
        onToggle={vi.fn()}
      />,
    );

    const checkboxes = screen.getAllByRole("checkbox");
    for (const cb of checkboxes) {
      expect(cb).not.toBeChecked();
    }
  });

  it("selected に全スタイルが含まれるとき全チェックボックスが checked", () => {
    render(
      <StyleFilterGroup
        group={GROUP}
        selected={new Set(GROUP.styles)}
        onToggle={vi.fn()}
      />,
    );

    const checkboxes = screen.getAllByRole("checkbox");
    for (const cb of checkboxes) {
      expect(cb).toBeChecked();
    }
  });
});

// ---------------------------------------------------------------------------
// onToggle コールバック
// ---------------------------------------------------------------------------
describe("StyleFilterGroup — onToggle コールバック", () => {
  it("チェックボックスをクリックすると onToggle(styleName) が呼ばれる", async () => {
    const onToggle = vi.fn();
    render(
      <StyleFilterGroup
        group={GROUP}
        selected={new Set()}
        onToggle={onToggle}
      />,
    );

    await userEvent.click(screen.getByRole("checkbox", { name: "アメカジ" }));

    expect(onToggle).toHaveBeenCalledWith("アメカジ");
  });

  it("checked 状態のチェックボックスをクリックしても onToggle(styleName) が呼ばれる（親が Set 管理）", async () => {
    const onToggle = vi.fn();
    render(
      <StyleFilterGroup
        group={GROUP}
        selected={new Set(["アメカジ"])}
        onToggle={onToggle}
      />,
    );

    await userEvent.click(screen.getByRole("checkbox", { name: "アメカジ" }));

    expect(onToggle).toHaveBeenCalledWith("アメカジ");
  });

  it("onToggle は 1 クリックで 1 回だけ呼ばれる", async () => {
    const onToggle = vi.fn();
    render(
      <StyleFilterGroup
        group={GROUP}
        selected={new Set()}
        onToggle={onToggle}
      />,
    );

    await userEvent.click(screen.getByRole("checkbox", { name: "ミリタリー" }));

    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it("異なる 2 つのスタイルをクリックすると onToggle が各スタイル名で呼ばれる", async () => {
    const onToggle = vi.fn();
    render(
      <StyleFilterGroup
        group={GROUP}
        selected={new Set()}
        onToggle={onToggle}
      />,
    );

    await userEvent.click(screen.getByRole("checkbox", { name: "アメカジ" }));
    await userEvent.click(
      screen.getByRole("checkbox", { name: "ストリートウェア" }),
    );

    expect(onToggle).toHaveBeenNthCalledWith(1, "アメカジ");
    expect(onToggle).toHaveBeenNthCalledWith(2, "ストリートウェア");
  });
});

// ---------------------------------------------------------------------------
// 別グループでの動作確認（回帰）
// ---------------------------------------------------------------------------
describe("StyleFilterGroup — 別グループ", () => {
  it("2 番目のグループ（きれいめ・フォーマル・トラッド系）でもグループ名が表示される", () => {
    const group2 = STYLE_GROUPS[1];
    render(
      <StyleFilterGroup
        group={group2}
        selected={new Set()}
        onToggle={vi.fn()}
      />,
    );

    expect(screen.getByText(group2.name)).toBeInTheDocument();
  });

  it("2 番目のグループのスタイル数分チェックボックスが表示される", () => {
    const group2 = STYLE_GROUPS[1];
    render(
      <StyleFilterGroup
        group={group2}
        selected={new Set()}
        onToggle={vi.fn()}
      />,
    );

    expect(screen.getAllByRole("checkbox")).toHaveLength(group2.styles.length);
  });
});
