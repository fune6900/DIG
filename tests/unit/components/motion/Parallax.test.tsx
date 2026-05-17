// ---------------------------------------------------------------------------
// Parallax プリミティブのユニットテスト
//
// scroll-linked transform は jsdom で完結しないため、以下に絞って検証する:
//   - children が DOM に出力される
//   - className が外側要素に伝播する
//   - reduced-motion 時に motion ラッパーが除去される
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

import { Parallax } from "@/components/ui/motion/Parallax";

beforeEach(() => {
  vi.resetAllMocks();
  useReducedMotionMock.mockReturnValue(false);
});

describe("Parallax", () => {
  it("children を DOM にレンダリングする", () => {
    render(
      <Parallax>
        <p>parallax-content</p>
      </Parallax>,
    );
    expect(screen.getByText("parallax-content")).toBeInTheDocument();
  });

  it("className が外側コンテナに伝播する", () => {
    render(
      <Parallax className="wrap">
        <span data-testid="child">x</span>
      </Parallax>,
    );
    // wrap は外側、その中に motion.div（transform 用）、その中に children
    const child = screen.getByTestId("child");
    const motionWrap = child.parentElement!;
    const outer = motionWrap.parentElement!;
    expect(outer).toHaveClass("wrap");
  });

  it("reduced-motion 時は motion ラッパーが消える（child の親が outer 直下）", () => {
    useReducedMotionMock.mockReturnValue(true);
    render(
      <Parallax className="wrap">
        <span data-testid="child">x</span>
      </Parallax>,
    );
    const child = screen.getByTestId("child");
    expect(child.parentElement).toHaveClass("wrap");
  });
});
