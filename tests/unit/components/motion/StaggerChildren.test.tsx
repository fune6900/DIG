// ---------------------------------------------------------------------------
// StaggerChildren / StaggerItem のユニットテスト
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

import {
  StaggerChildren,
  StaggerItem,
} from "@/components/ui/motion/StaggerChildren";

beforeEach(() => {
  vi.resetAllMocks();
  useReducedMotionMock.mockReturnValue(false);
});

describe("StaggerChildren", () => {
  it("全ての子要素をレンダリングする", () => {
    render(
      <StaggerChildren>
        <StaggerItem>
          <p>one</p>
        </StaggerItem>
        <StaggerItem>
          <p>two</p>
        </StaggerItem>
        <StaggerItem>
          <p>three</p>
        </StaggerItem>
      </StaggerChildren>,
    );
    expect(screen.getByText("one")).toBeInTheDocument();
    expect(screen.getByText("two")).toBeInTheDocument();
    expect(screen.getByText("three")).toBeInTheDocument();
  });

  it("className が外側要素に伝播する", () => {
    render(
      <StaggerChildren className="grid">
        <StaggerItem>
          <span data-testid="item">x</span>
        </StaggerItem>
      </StaggerChildren>,
    );
    const item = screen.getByTestId("item");
    const itemWrap = item.parentElement!;
    const outer = itemWrap.parentElement!;
    expect(outer).toHaveClass("grid");
  });

  it("reduced-motion 時も全ての子要素が表示される", () => {
    useReducedMotionMock.mockReturnValue(true);
    render(
      <StaggerChildren>
        <StaggerItem>
          <p>a</p>
        </StaggerItem>
        <StaggerItem>
          <p>b</p>
        </StaggerItem>
      </StaggerChildren>,
    );
    expect(screen.getByText("a")).toBeInTheDocument();
    expect(screen.getByText("b")).toBeInTheDocument();
  });

  describe("as prop によるタグ切替", () => {
    it("StaggerChildren as='ul' で ul タグでレンダリングされる", () => {
      render(
        <StaggerChildren as="ul">
          <StaggerItem as="li">
            <span data-testid="item">x</span>
          </StaggerItem>
        </StaggerChildren>,
      );
      const item = screen.getByTestId("item");
      const li = item.parentElement!;
      expect(li.tagName.toLowerCase()).toBe("li");
      const ul = li.parentElement!;
      expect(ul.tagName.toLowerCase()).toBe("ul");
    });

    it("StaggerChildren as='section' で section タグでレンダリングされる", () => {
      render(
        <StaggerChildren as="section">
          <StaggerItem>
            <span data-testid="item">x</span>
          </StaggerItem>
        </StaggerChildren>,
      );
      const outer = screen.getByTestId("item").parentElement!.parentElement!;
      expect(outer.tagName.toLowerCase()).toBe("section");
    });

    it("StaggerItem as='article' で article タグでレンダリングされる", () => {
      render(
        <StaggerChildren>
          <StaggerItem as="article">
            <span data-testid="item">x</span>
          </StaggerItem>
        </StaggerChildren>,
      );
      const wrap = screen.getByTestId("item").parentElement!;
      expect(wrap.tagName.toLowerCase()).toBe("article");
    });

    it("reduced-motion 時も as 指定のタグでレンダリングされる（セマンティクス維持）", () => {
      useReducedMotionMock.mockReturnValue(true);
      render(
        <StaggerChildren as="ul">
          <StaggerItem as="li">
            <span data-testid="item">x</span>
          </StaggerItem>
        </StaggerChildren>,
      );
      const item = screen.getByTestId("item");
      const li = item.parentElement!;
      expect(li.tagName.toLowerCase()).toBe("li");
      const ul = li.parentElement!;
      expect(ul.tagName.toLowerCase()).toBe("ul");
    });

    it("aria-label を StaggerChildren に渡すとレンダリング結果に反映される", () => {
      render(
        <StaggerChildren as="ul" aria-label="myList">
          <StaggerItem as="li">
            <span data-testid="item">x</span>
          </StaggerItem>
        </StaggerChildren>,
      );
      const ul = screen.getByTestId("item").parentElement!.parentElement!;
      expect(ul.getAttribute("aria-label")).toBe("myList");
    });
  });
});
