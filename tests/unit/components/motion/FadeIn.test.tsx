// ---------------------------------------------------------------------------
// FadeIn プリミティブのユニットテスト
//
// アニメーション挙動そのものは jsdom で完結しないため、以下に絞って検証する:
//   - children が DOM に出力される
//   - as prop で指定したタグ要素でレンダリングされる
//   - prefers-reduced-motion: reduce では静的タグ（motion なし）でレンダリングされる
// ---------------------------------------------------------------------------

import { render, screen } from "@testing-library/react";

const useReducedMotionMock = vi.fn();

vi.mock("motion/react", async () => {
  const actual =
    await vi.importActual<typeof import("motion/react")>("motion/react");
  return {
    ...actual,
    useReducedMotion: () => useReducedMotionMock(),
  };
});

import { FadeIn } from "@/components/ui/motion/FadeIn";

beforeEach(() => {
  vi.resetAllMocks();
  useReducedMotionMock.mockReturnValue(false);
});

describe("FadeIn", () => {
  it("children を DOM にレンダリングする", () => {
    render(
      <FadeIn>
        <p>hello</p>
      </FadeIn>,
    );
    expect(screen.getByText("hello")).toBeInTheDocument();
  });

  it("デフォルトは div でラップされる", () => {
    render(
      <FadeIn>
        <span data-testid="child">x</span>
      </FadeIn>,
    );
    const child = screen.getByTestId("child");
    expect(child.parentElement?.tagName.toLowerCase()).toBe("div");
  });

  it("as='section' で section タグでラップされる", () => {
    render(
      <FadeIn as="section">
        <span data-testid="child">x</span>
      </FadeIn>,
    );
    const child = screen.getByTestId("child");
    expect(child.parentElement?.tagName.toLowerCase()).toBe("section");
  });

  it("className が外側要素に伝播する", () => {
    render(
      <FadeIn className="my-class">
        <span data-testid="child">x</span>
      </FadeIn>,
    );
    const child = screen.getByTestId("child");
    expect(child.parentElement).toHaveClass("my-class");
  });

  it("prefers-reduced-motion: reduce のとき motion 属性無しでレンダリングされる", () => {
    useReducedMotionMock.mockReturnValue(true);
    render(
      <FadeIn className="my-class">
        <span data-testid="child">x</span>
      </FadeIn>,
    );
    const wrapper = screen.getByTestId("child").parentElement!;
    // motion で動かないことの確認: data-framer-* / style に opacity:0 が無い
    expect(wrapper.getAttribute("style") ?? "").not.toContain("opacity");
    expect(wrapper).toHaveClass("my-class");
  });
});
