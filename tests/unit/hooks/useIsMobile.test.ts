import { renderHook, act } from "@testing-library/react";
import { useIsMobile } from "@/hooks/useIsMobile";

interface MockMediaQueryList {
  matches: boolean;
  media: string;
  addEventListener: (type: "change", listener: () => void) => void;
  removeEventListener: (type: "change", listener: () => void) => void;
}

function installMatchMedia(initialMatches: boolean) {
  let listener: (() => void) | null = null;
  const removeSpy = vi.fn();
  const mql: MockMediaQueryList = {
    matches: initialMatches,
    media: "(max-width: 767px)",
    addEventListener: (_type, l) => {
      listener = l;
    },
    removeEventListener: (_type, l) => {
      if (listener === l) listener = null;
      removeSpy(l);
    },
  };
  const matchMedia = vi.fn().mockReturnValue(mql);
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: matchMedia,
  });
  return {
    mql,
    fire: (matches: boolean) => {
      mql.matches = matches;
      listener?.();
    },
    removeSpy,
    matchMedia,
  };
}

describe("useIsMobile", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("767px以下（matches=true）の場合は true を返す", () => {
    installMatchMedia(true);
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);
  });

  it("768px以上（matches=false）の場合は false を返す", () => {
    installMatchMedia(false);
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);
  });

  it("`(max-width: 767px)` のメディアクエリで matchMedia を呼び出す", () => {
    const { matchMedia } = installMatchMedia(false);
    renderHook(() => useIsMobile());
    expect(matchMedia).toHaveBeenCalledWith("(max-width: 767px)");
  });

  it("change イベントで state を更新する（false → true）", () => {
    const ctx = installMatchMedia(false);
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);

    act(() => {
      ctx.fire(true);
    });
    expect(result.current).toBe(true);
  });

  it("change イベントで state を更新する（true → false）", () => {
    const ctx = installMatchMedia(true);
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);

    act(() => {
      ctx.fire(false);
    });
    expect(result.current).toBe(false);
  });

  it("unmount 時に removeEventListener が呼ばれる", () => {
    const ctx = installMatchMedia(false);
    const { unmount } = renderHook(() => useIsMobile());
    expect(ctx.removeSpy).not.toHaveBeenCalled();
    unmount();
    expect(ctx.removeSpy).toHaveBeenCalledTimes(1);
  });
});
