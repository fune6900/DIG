import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OotdDetail } from "@/components/features/ootd/OotdDetail";
import type { Ootd } from "@/types/ootd";

// ---------------------------------------------------------------------------
// テスト用フィクスチャ
// ---------------------------------------------------------------------------
const mockOotd: Ootd = {
  id: "123e4567-e89b-12d3-a456-426614174000",
  imageUrl: "https://example.com/ootd-detail.jpg",
  oneLiner: "ヴィンテージデニムで決めた今日のコーデ",
  colorPalette: [
    { name: "インディゴ", colorCode: "#3B4D6B", percentage: 60 },
    { name: "ホワイト", colorCode: "#FFFFFF", percentage: 40 },
  ],
  styles: [{ name: "ストリート", percentage: 100 }],
  description: "90年代のリーバイス501を主役にしたシンプルなコーデ。",
  detectedItems: [
    { name: "デニムジャケット", imageHint: "vintage denim jacket" },
    { name: "白Tシャツ" },
  ],
  date: new Date("2026-03-15T00:00:00Z"),
  tags: ["古着", "デニム", "90s"],
  createdAt: new Date("2026-03-15T10:00:00Z"),
  updatedAt: new Date("2026-03-15T10:00:00Z"),
};

describe("OotdDetail", () => {
  it("oneLiner が表示される", () => {
    render(<OotdDetail ootd={mockOotd} onDelete={vi.fn()} />);
    expect(
      screen.getByText("ヴィンテージデニムで決めた今日のコーデ"),
    ).toBeInTheDocument();
  });

  it("description が表示される", () => {
    render(<OotdDetail ootd={mockOotd} onDelete={vi.fn()} />);
    expect(
      screen.getByText("90年代のリーバイス501を主役にしたシンプルなコーデ。"),
    ).toBeInTheDocument();
  });

  it("カラーパレットの色名「インディゴ」が表示される", () => {
    render(<OotdDetail ootd={mockOotd} onDelete={vi.fn()} />);
    expect(screen.getByText("インディゴ")).toBeInTheDocument();
  });

  it("カラーパレットのカラーコード「#3B4D6B」が表示される", () => {
    render(<OotdDetail ootd={mockOotd} onDelete={vi.fn()} />);
    expect(screen.getByText("#3B4D6B")).toBeInTheDocument();
  });

  it("カラーパレットの色名「ホワイト」が表示される", () => {
    render(<OotdDetail ootd={mockOotd} onDelete={vi.fn()} />);
    expect(screen.getByText("ホワイト")).toBeInTheDocument();
  });

  it("カラーパレットのカラーコード「#FFFFFF」が表示される", () => {
    render(<OotdDetail ootd={mockOotd} onDelete={vi.fn()} />);
    expect(screen.getByText("#FFFFFF")).toBeInTheDocument();
  });

  it("タグ「古着」が「#古着」形式（#プレフィックス付き）で表示される", () => {
    render(<OotdDetail ootd={mockOotd} onDelete={vi.fn()} />);
    expect(screen.getByText("#古着")).toBeInTheDocument();
  });

  it("タグ「デニム」が「#デニム」形式で表示される", () => {
    render(<OotdDetail ootd={mockOotd} onDelete={vi.fn()} />);
    expect(screen.getByText("#デニム")).toBeInTheDocument();
  });

  it("タグ「90s」が「#90s」形式で表示される", () => {
    render(<OotdDetail ootd={mockOotd} onDelete={vi.fn()} />);
    expect(screen.getByText("#90s")).toBeInTheDocument();
  });

  it("tags が空配列のときタグセクションが空でも表示エラーにならない", () => {
    const noTagsOotd: Ootd = { ...mockOotd, tags: [] };
    expect(() => render(<OotdDetail ootd={noTagsOotd} onDelete={vi.fn()} />)).not.toThrow();
  });

  it("削除ボタンクリックで onDelete が呼ばれる", async () => {
    const onDelete = vi.fn();
    render(<OotdDetail ootd={mockOotd} onDelete={onDelete} />);

    const deleteButton = screen.getByRole("button", { name: /削除/i });
    await userEvent.click(deleteButton);

    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it("削除ボタンクリックで onDelete が id を引数に呼ばれる", async () => {
    const onDelete = vi.fn();
    render(<OotdDetail ootd={mockOotd} onDelete={onDelete} />);

    const deleteButton = screen.getByRole("button", { name: /削除/i });
    await userEvent.click(deleteButton);

    expect(onDelete).toHaveBeenCalledWith("123e4567-e89b-12d3-a456-426614174000");
  });
});
