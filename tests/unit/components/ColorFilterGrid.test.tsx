// ---------------------------------------------------------------------------
// ColorFilterGrid コンポーネントのユニットテスト (Red フェーズ)
//
// 対象: components/features/search/ColorFilterGrid.tsx (未実装)
// Props:
//   selected: ReadonlySet<string>
//   onToggle: (categoryName: string) => void
// ---------------------------------------------------------------------------

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => ({ get: vi.fn().mockReturnValue(null) }),
  usePathname: () => "/search/conditions",
}));

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ColorFilterGrid } from "@/components/features/search/ColorFilterGrid";
import { COLOR_CATEGORIES } from "@/lib/color-catalog";

// ---------------------------------------------------------------------------
// セットアップ
// ---------------------------------------------------------------------------
beforeEach(() => {
  vi.resetAllMocks();
});

// ---------------------------------------------------------------------------
// レンダリング
// ---------------------------------------------------------------------------
describe("ColorFilterGrid — レンダリング", () => {
  it("COLOR_CATEGORIES 16 件分のボタンが表示される", () => {
    render(<ColorFilterGrid selected={new Set()} onToggle={vi.fn()} />);

    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(COLOR_CATEGORIES.length);
  });

  it("各カテゴリ名がボタンのアクセシブル名として存在する", () => {
    render(<ColorFilterGrid selected={new Set()} onToggle={vi.fn()} />);

    for (const cat of COLOR_CATEGORIES) {
      expect(screen.getByRole("button", { name: cat })).toBeInTheDocument();
    }
  });
});

// ---------------------------------------------------------------------------
// selected 状態の aria-pressed 反映
// ---------------------------------------------------------------------------
describe("ColorFilterGrid — aria-pressed による選択状態", () => {
  it("selected が空 Set のとき全ボタンの aria-pressed が false", () => {
    render(<ColorFilterGrid selected={new Set()} onToggle={vi.fn()} />);

    for (const cat of COLOR_CATEGORIES) {
      expect(screen.getByRole("button", { name: cat })).toHaveAttribute(
        "aria-pressed",
        "false",
      );
    }
  });

  it("selected に 'ブラック系' が含まれるとき該当ボタンの aria-pressed が true", () => {
    render(
      <ColorFilterGrid selected={new Set(["ブラック系"])} onToggle={vi.fn()} />,
    );

    expect(screen.getByRole("button", { name: "ブラック系" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("selected に含まれないカテゴリの aria-pressed は false", () => {
    render(
      <ColorFilterGrid selected={new Set(["ブラック系"])} onToggle={vi.fn()} />,
    );

    expect(screen.getByRole("button", { name: "ホワイト系" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("selected に複数カテゴリが含まれるとき全て aria-pressed=true になる", () => {
    const selected = new Set(["ブラック系", "ネイビー系", "グリーン系"]);
    render(<ColorFilterGrid selected={selected} onToggle={vi.fn()} />);

    expect(screen.getByRole("button", { name: "ブラック系" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "ネイビー系" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "グリーン系" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("全 16 件が selected のとき全ボタンの aria-pressed が true", () => {
    render(
      <ColorFilterGrid
        selected={new Set(COLOR_CATEGORIES)}
        onToggle={vi.fn()}
      />,
    );

    for (const cat of COLOR_CATEGORIES) {
      expect(screen.getByRole("button", { name: cat })).toHaveAttribute(
        "aria-pressed",
        "true",
      );
    }
  });
});

// ---------------------------------------------------------------------------
// onToggle コールバック
// ---------------------------------------------------------------------------
describe("ColorFilterGrid — onToggle コールバック", () => {
  it("ボタンをクリックすると onToggle(categoryName) が呼ばれる", async () => {
    const onToggle = vi.fn();
    render(<ColorFilterGrid selected={new Set()} onToggle={onToggle} />);

    await userEvent.click(screen.getByRole("button", { name: "ブラック系" }));

    expect(onToggle).toHaveBeenCalledWith("ブラック系");
  });

  it("aria-pressed=true のボタンをクリックしても onToggle が呼ばれる（親が Set 管理）", async () => {
    const onToggle = vi.fn();
    render(
      <ColorFilterGrid
        selected={new Set(["ブラック系"])}
        onToggle={onToggle}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "ブラック系" }));

    expect(onToggle).toHaveBeenCalledWith("ブラック系");
  });

  it("1 クリックで onToggle が 1 回だけ呼ばれる", async () => {
    const onToggle = vi.fn();
    render(<ColorFilterGrid selected={new Set()} onToggle={onToggle} />);

    await userEvent.click(screen.getByRole("button", { name: "ネイビー系" }));

    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it("異なる 2 つのカテゴリをクリックすると onToggle が各カテゴリ名で呼ばれる", async () => {
    const onToggle = vi.fn();
    render(<ColorFilterGrid selected={new Set()} onToggle={onToggle} />);

    await userEvent.click(screen.getByRole("button", { name: "ブラック系" }));
    await userEvent.click(screen.getByRole("button", { name: "グリーン系" }));

    expect(onToggle).toHaveBeenNthCalledWith(1, "ブラック系");
    expect(onToggle).toHaveBeenNthCalledWith(2, "グリーン系");
  });
});
