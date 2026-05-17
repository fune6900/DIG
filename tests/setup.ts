import "@testing-library/jest-dom";
import { vi } from "vitest";

// jsdom には ResizeObserver が存在しないため recharts の ResponsiveContainer が
// エラーを出す。最小限のモックで解消する。
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// motion / useInView 等が使う IntersectionObserver の最小モック。
class MockIntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}
global.IntersectionObserver =
  MockIntersectionObserver as unknown as typeof IntersectionObserver;

// motion の useReducedMotion 等が使う matchMedia の最小モック。
// 既定では reduce 指定なしとして返し、必要に応じてテスト側で上書きする。
if (typeof window !== "undefined" && !window.matchMedia) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}
