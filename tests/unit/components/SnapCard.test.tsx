// ---------------------------------------------------------------------------
// SnapCard コンポーネントのユニットテスト
//
// 仕様: 画像のみ表示、テキスト情報を載せない。詳細ページへのリンク付き。
// アクセシビリティ: alt 属性に description / authorName を含む。
// ---------------------------------------------------------------------------

import { render, screen } from "@testing-library/react";
import { SnapCard } from "@/components/features/search/SnapCard";
import type { SnapSummary } from "@/types/snap";

// ---------------------------------------------------------------------------
// フィクスチャ
// ---------------------------------------------------------------------------
const mockSnap: SnapSummary = {
  id: "snap-uuid-1",
  imageUrl: "https://images.unsplash.com/photo-abc/regular",
  authorName: "Jane Doe",
  sourceUrl: "https://unsplash.com/photos/photo-abc",
  source: "unsplash",
};

const mockSnapNoAuthor: SnapSummary = {
  id: "snap-uuid-2",
  imageUrl: "https://images.unsplash.com/photo-xyz/regular",
  authorName: null,
  sourceUrl: "https://unsplash.com/photos/photo-xyz",
  source: "unsplash",
};

const mockSnapPexels: SnapSummary = {
  id: "snap-uuid-3",
  imageUrl: "https://images.pexels.com/photos/123/large.jpg",
  authorName: "Sample Photographer",
  sourceUrl: "https://www.pexels.com/photo/sample-123/",
  source: "pexels",
};

// ---------------------------------------------------------------------------
// テスト
// ---------------------------------------------------------------------------
describe("SnapCard", () => {
  it("画像（img 要素）が表示される", () => {
    render(<SnapCard snap={mockSnap} />);

    expect(screen.getByRole("img")).toBeInTheDocument();
  });

  it("画像の src に imageUrl が含まれる", () => {
    render(<SnapCard snap={mockSnap} />);

    const img = screen.getByRole("img");
    expect(img).toHaveAttribute(
      "src",
      expect.stringContaining("images.unsplash.com"),
    );
  });

  it("img の alt 属性が空でない（アクセシビリティ）", () => {
    render(<SnapCard snap={mockSnap} />);

    const img = screen.getByRole("img");
    const alt = img.getAttribute("alt");
    expect(alt).toBeTruthy();
    expect(alt!.length).toBeGreaterThan(0);
  });

  it("authorName が存在するとき alt 属性に authorName が含まれる", () => {
    render(<SnapCard snap={mockSnap} />);

    const img = screen.getByRole("img");
    expect(img.getAttribute("alt")).toContain("Jane Doe");
  });

  it("authorName が null のとき img がレンダリングされる（クラッシュしない）", () => {
    render(<SnapCard snap={mockSnapNoAuthor} />);

    expect(screen.getByRole("img")).toBeInTheDocument();
  });

  it("詳細ページ /search/<id> へのリンクが存在する", () => {
    render(<SnapCard snap={mockSnap} />);

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/search/snap-uuid-1");
  });

  it("テキスト情報（authorName の文字列）がカード上に表示されない（画像のみ仕様）", () => {
    render(<SnapCard snap={mockSnap} />);

    // authorName の文字列がテキストノードとして表示されていないこと
    // alt 属性には含まれてよいが、表示テキストには含まれない
    expect(screen.queryByText("Jane Doe")).not.toBeInTheDocument();
  });

  it("sourceUrl のテキストが表示されない（画像のみ仕様）", () => {
    render(<SnapCard snap={mockSnap} />);

    expect(
      screen.queryByText("https://unsplash.com/photos/photo-abc"),
    ).not.toBeInTheDocument();
  });

  describe("ソースバッジ", () => {
    it("source='unsplash' のとき 'Unsplash' バッジが表示される", () => {
      render(<SnapCard snap={mockSnap} />);
      const badge = screen.getByTestId("snap-source-badge");
      expect(badge).toHaveTextContent("Unsplash");
    });

    it("source='pexels' のとき UI 表記は 'Pinterest' になる", () => {
      render(<SnapCard snap={mockSnapPexels} />);
      const badge = screen.getByTestId("snap-source-badge");
      expect(badge).toHaveTextContent("Pinterest");
      // 内部実装名 "Pexels" が漏れていないこと
      expect(badge).not.toHaveTextContent("Pexels");
    });
  });
});
