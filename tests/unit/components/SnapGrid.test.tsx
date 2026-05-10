// ---------------------------------------------------------------------------
// SnapGrid コンポーネントのユニットテスト
//
// - カード配列のレンダリング
// - IntersectionObserver モック → センチネル要素が画面内に入ったら onLoadMore 発火
// - hasMore=false のときは onLoadMore を発火しない
// - isLoading=true のときはローディング表示
// - 0件のときは空状態メッセージ表示
// ---------------------------------------------------------------------------

import { render, screen, act } from "@testing-library/react";
import { SnapGrid } from "@/components/features/search/SnapGrid";
import type { SnapSummary } from "@/types/snap";

// ---------------------------------------------------------------------------
// IntersectionObserver モック
// ---------------------------------------------------------------------------
type ObserverCallback = (entries: IntersectionObserverEntry[]) => void;

let mockObserverInstances: Array<{
  callback: ObserverCallback;
  observe: ReturnType<typeof vi.fn>;
  unobserve: ReturnType<typeof vi.fn>;
  disconnect: ReturnType<typeof vi.fn>;
}> = [];

beforeEach(() => {
  mockObserverInstances = [];
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      callback: ObserverCallback;
      observe = vi.fn();
      unobserve = vi.fn();
      disconnect = vi.fn();

      constructor(cb: ObserverCallback) {
        this.callback = cb;
        mockObserverInstances.push({
          callback: cb,
          observe: this.observe,
          unobserve: this.unobserve,
          disconnect: this.disconnect,
        });
      }

      takeRecords() {
        return [];
      }

      root = null;
      rootMargin = "";
      thresholds = [];
    },
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function triggerIntersection(isIntersecting: boolean) {
  const last = mockObserverInstances[mockObserverInstances.length - 1];
  if (!last) throw new Error("IntersectionObserver not instantiated");
  act(() => {
    last.callback([{ isIntersecting } as unknown as IntersectionObserverEntry]);
  });
}

// ---------------------------------------------------------------------------
// フィクスチャ
// ---------------------------------------------------------------------------
const makeSnap = (id: string): SnapSummary => ({
  id,
  imageUrl: `https://images.unsplash.com/${id}/regular`,
  authorName: "Test Author",
  sourceUrl: `https://unsplash.com/photos/${id}`,
});

const SNAPS_3 = [makeSnap("a"), makeSnap("b"), makeSnap("c")];

// ---------------------------------------------------------------------------
// テスト
// ---------------------------------------------------------------------------
describe("SnapGrid", () => {
  it("snaps 配列の各要素がカードとしてレンダリングされる", () => {
    render(
      <SnapGrid
        snaps={SNAPS_3}
        hasMore={false}
        isLoading={false}
        onLoadMore={vi.fn()}
      />,
    );

    expect(screen.getAllByRole("link")).toHaveLength(3);
  });

  it("snaps が空 + isLoading=false のとき空状態メッセージを表示する", () => {
    render(
      <SnapGrid
        snaps={[]}
        hasMore={false}
        isLoading={false}
        onLoadMore={vi.fn()}
      />,
    );

    expect(screen.getByText(/該当|見つかり/)).toBeInTheDocument();
  });

  it("isLoading=true のときローディング表示が出る", () => {
    render(<SnapGrid snaps={SNAPS_3} hasMore isLoading onLoadMore={vi.fn()} />);

    // status role または aria-busy 属性のいずれかでローディングが識別できる
    const loaders = screen.queryAllByRole("status");
    const busyEls = document.querySelectorAll('[aria-busy="true"]');
    expect(loaders.length + busyEls.length).toBeGreaterThan(0);
  });

  it("hasMore=true でセンチネル要素が画面内に入ったとき onLoadMore が呼ばれる", () => {
    const onLoadMore = vi.fn();
    render(
      <SnapGrid
        snaps={SNAPS_3}
        hasMore
        isLoading={false}
        onLoadMore={onLoadMore}
      />,
    );

    triggerIntersection(true);

    expect(onLoadMore).toHaveBeenCalled();
  });

  it("hasMore=false のときセンチネルが画面に入っても onLoadMore を呼ばない", () => {
    const onLoadMore = vi.fn();
    render(
      <SnapGrid
        snaps={SNAPS_3}
        hasMore={false}
        isLoading={false}
        onLoadMore={onLoadMore}
      />,
    );

    // hasMore=false のときセンチネル監視自体が無効、または交差しても無視される想定
    if (mockObserverInstances.length > 0) {
      triggerIntersection(true);
    }

    expect(onLoadMore).not.toHaveBeenCalled();
  });

  it("isIntersecting=false のとき onLoadMore を呼ばない", () => {
    const onLoadMore = vi.fn();
    render(
      <SnapGrid
        snaps={SNAPS_3}
        hasMore
        isLoading={false}
        onLoadMore={onLoadMore}
      />,
    );

    triggerIntersection(false);

    expect(onLoadMore).not.toHaveBeenCalled();
  });

  it("isLoading=true のときセンチネルが画面に入っても onLoadMore を呼ばない（重複ロード防止）", () => {
    const onLoadMore = vi.fn();
    render(
      <SnapGrid snaps={SNAPS_3} hasMore isLoading onLoadMore={onLoadMore} />,
    );

    if (mockObserverInstances.length > 0) {
      triggerIntersection(true);
    }

    expect(onLoadMore).not.toHaveBeenCalled();
  });
});
