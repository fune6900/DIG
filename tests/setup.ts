import "@testing-library/jest-dom";

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
// 注意: vi.fn() は使わない。テストが vi.resetAllMocks() を呼ぶと
// mockImplementation がクリアされ matchMedia() が undefined を返す
// 状態になり、motion lib の addEventListener 呼び出しが落ちるため、
// 通常関数で実装する。
if (typeof window !== "undefined") {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}
