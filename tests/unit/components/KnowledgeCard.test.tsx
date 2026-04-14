import { render, screen } from "@testing-library/react";
import { KnowledgeCard } from "@/components/features/knowledge/KnowledgeCard";

const mockKnowledge = {
  id: "123e4567-e89b-12d3-a456-426614174000",
  brand: "Champion",
  category: "スウェット",
  era: "1990s",
  tags: ["刺繍タグ", "リブ長め"],
  imageUrls: [],
};

describe("KnowledgeCard", () => {
  it("ブランド名「Champion」が表示される", () => {
    render(<KnowledgeCard knowledge={mockKnowledge} />);
    expect(screen.getByText("Champion")).toBeInTheDocument();
  });

  it("年代「1990s」が表示される", () => {
    render(<KnowledgeCard knowledge={mockKnowledge} />);
    expect(screen.getByText("1990s")).toBeInTheDocument();
  });

  it("カテゴリ「スウェット」が表示される", () => {
    render(<KnowledgeCard knowledge={mockKnowledge} />);
    expect(screen.getByText("スウェット")).toBeInTheDocument();
  });

  it("タグ「刺繍タグ」が表示される", () => {
    render(<KnowledgeCard knowledge={mockKnowledge} />);
    expect(screen.getByText("刺繍タグ")).toBeInTheDocument();
  });

  it("タグ「リブ長め」が表示される", () => {
    render(<KnowledgeCard knowledge={mockKnowledge} />);
    expect(screen.getByText("リブ長め")).toBeInTheDocument();
  });

  it("詳細ページへの href='/knowledge/123e4567...' のリンクが存在する", () => {
    render(<KnowledgeCard knowledge={mockKnowledge} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute(
      "href",
      `/knowledge/${mockKnowledge.id}`
    );
  });

  it("imageUrls が空のときプレースホルダーが表示される", () => {
    render(<KnowledgeCard knowledge={mockKnowledge} />);
    const placeholder =
      screen.queryByTestId("placeholder") ??
      screen.queryByAltText("画像なし");
    expect(placeholder).toBeInTheDocument();
  });
});
