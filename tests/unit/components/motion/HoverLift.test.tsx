// ---------------------------------------------------------------------------
// HoverLift プリミティブのユニットテスト
//
// hover アニメ自体は jsdom で完結しないため、以下に絞って検証する:
//   - children をレンダリングする
//   - className が伝播する
//   - reduced-motion 時に motion props 無しでレンダリングされる
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

import { HoverLift } from "@/components/ui/motion/HoverLift";

beforeEach(() => {
  vi.resetAllMocks();
  useReducedMotionMock.mockReturnValue(false);
});

describe("HoverLift", () => {
  it("children をレンダリングする", () => {
    render(
      <HoverLift>
        <p>lift-me</p>
      </HoverLift>,
    );
    expect(screen.getByText("lift-me")).toBeInTheDocument();
  });

  it("className が外側要素に伝播する", () => {
    render(
      <HoverLift className="card">
        <span data-testid="child">x</span>
      </HoverLift>,
    );
    expect(screen.getByTestId("child").parentElement).toHaveClass("card");
  });

  it("reduced-motion 時も children が表示され className が保持される", () => {
    useReducedMotionMock.mockReturnValue(true);
    render(
      <HoverLift className="card">
        <span data-testid="child">x</span>
      </HoverLift>,
    );
    const wrapper = screen.getByTestId("child").parentElement!;
    expect(wrapper).toHaveClass("card");
  });
});
