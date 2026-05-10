import "@testing-library/jest-dom";

// jsdom には ResizeObserver が存在しないため recharts の ResponsiveContainer が
// エラーを出す。最小限のモックで解消する。
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};
