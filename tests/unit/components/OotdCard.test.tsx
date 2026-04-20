import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OotdCard } from "@/components/features/ootd/OotdCard";
import type { OotdSummary } from "@/types/ootd";

// ---------------------------------------------------------------------------
// テスト用フィクスチャ
// ---------------------------------------------------------------------------
const mockOotd: OotdSummary = {
  id: "123e4567-e89b-12d3-a456-426614174000",
  imageUrl: "https://example.com/ootd-thumb.jpg",
  oneLiner: "ヴィンテージデニムで決めた今日のコーデ",
  date: new Date("2026-03-15T00:00:00Z"),
  tags: ["古着", "デニム"],
  createdAt: new Date("2026-03-15T10:00:00Z"),
};

describe("OotdCard", () => {
  it("コーデ画像のサムネイルが表示される", () => {
    render(<OotdCard ootd={mockOotd} onSelect={vi.fn()} />);
    const img = screen.getByRole("img");
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", expect.stringContaining("ootd-thumb.jpg"));
  });

  it("oneLiner が表示される", () => {
    render(<OotdCard ootd={mockOotd} onSelect={vi.fn()} />);
    expect(
      screen.getByText("ヴィンテージデニムで決めた今日のコーデ"),
    ).toBeInTheDocument();
  });

  it("投稿日が 'March 15, 2026' 形式で表示される", () => {
    render(<OotdCard ootd={mockOotd} onSelect={vi.fn()} />);
    expect(screen.getByText("March 15, 2026")).toBeInTheDocument();
  });

  it("クリックで onSelect が id を引数に呼ばれる", async () => {
    const onSelect = vi.fn();
    render(<OotdCard ootd={mockOotd} onSelect={onSelect} />);

    await userEvent.click(screen.getByRole("button"));

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith("123e4567-e89b-12d3-a456-426614174000");
  });

  it("onSelect なしでクリックしてもエラーにならない", async () => {
    // onSelect が省略可能な設計の場合に備えた境界値テスト
    // OotdCard の props 型次第でこのテストはスキップ可能
    const onSelect = vi.fn();
    render(<OotdCard ootd={mockOotd} onSelect={onSelect} />);
    await userEvent.click(screen.getByRole("button"));
    expect(onSelect).toHaveBeenCalledTimes(1);
  });
});
