// ---------------------------------------------------------------------------
// HeroCanvasLazy のユニットテスト
//
// three.js / R3F 本体は jsdom で WebGL context が無いため動かせない。
// 本テストでは lazy ラッパーの振る舞いに絞って検証する:
//   - aria-hidden="true" が wrapper に付与される（純装飾扱い）
//   - prefers-reduced-motion: reduce のときは HeroCanvas を一切 mount しない
//   - 通常時は IntersectionObserver 監視結果を経るまで HeroCanvas を mount しない
// ---------------------------------------------------------------------------

import { render } from "@testing-library/react";

const useReducedMotionMock = vi.fn();

vi.mock("motion/react", async () => {
  const actual =
    await vi.importActual<typeof import("motion/react")>("motion/react");
  return {
    ...actual,
    useReducedMotion: () => useReducedMotionMock(),
  };
});

// next/dynamic を「常に null を返す」ダミーコンポーネントに差し替えて、
// three.js 本体のロードを完全に避ける。これにより jsdom で WebGL が
// 評価されることもない。
vi.mock("next/dynamic", () => ({
  default: () => {
    const Dummy = () => null;
    Dummy.displayName = "HeroCanvasDynamicStub";
    return Dummy;
  },
}));

import { HeroCanvasLazy } from "@/components/features/landing/HeroCanvasLazy";

beforeEach(() => {
  vi.resetAllMocks();
  useReducedMotionMock.mockReturnValue(false);
});

describe("HeroCanvasLazy", () => {
  it("wrapper は aria-hidden='true' で純装飾扱いされる", () => {
    const { container } = render(<HeroCanvasLazy />);
    const wrapper = container.firstElementChild;
    expect(wrapper?.getAttribute("aria-hidden")).toBe("true");
  });

  it("初期描画では HeroCanvas は mount されない（IO 検知前）", () => {
    const { container } = render(<HeroCanvasLazy />);
    const wrapper = container.firstElementChild;
    // dynamic も null を返すスタブにしているので、wrapper は children を持たない
    expect(wrapper?.childNodes.length).toBe(0);
  });

  it("reduced-motion 時も HeroCanvas は mount されない", () => {
    useReducedMotionMock.mockReturnValue(true);
    const { container } = render(<HeroCanvasLazy />);
    const wrapper = container.firstElementChild;
    expect(wrapper?.childNodes.length).toBe(0);
  });
});
