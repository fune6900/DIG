import { render, screen } from "@testing-library/react";
import { KnowledgeDetail } from "@/components/features/knowledge/KnowledgeDetail";
import type { Knowledge } from "@/types/knowledge";

const mockKnowledge: Knowledge = {
  id: "123e4567-e89b-12d3-a456-426614174000",
  brand: "Levi's",
  category: "デニム",
  era: "1970s",
  description: "1970年代のUSA製デニムジャケット。",
  tags: ["リベット", "USA製"],
  identificationPoints: [
    { type: "タグ", description: "赤耳タグが特徴", imageHint: undefined },
    { type: "縫製", description: "チェーンステッチが使われている" },
  ],
  imageUrls: [],
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("KnowledgeDetail", () => {
  it("ブランド名「Levi's」が表示される", () => {
    render(<KnowledgeDetail knowledge={mockKnowledge} />);
    expect(screen.getByText("Levi's")).toBeInTheDocument();
  });

  it("カテゴリ「デニム」が表示される", () => {
    render(<KnowledgeDetail knowledge={mockKnowledge} />);
    expect(screen.getByText("デニム")).toBeInTheDocument();
  });

  it("年代「1970s」が表示される", () => {
    render(<KnowledgeDetail knowledge={mockKnowledge} />);
    expect(screen.getByText("1970s")).toBeInTheDocument();
  });

  it("description「1970年代のUSA製デニムジャケット。」が表示される", () => {
    render(<KnowledgeDetail knowledge={mockKnowledge} />);
    expect(
      screen.getByText("1970年代のUSA製デニムジャケット。")
    ).toBeInTheDocument();
  });

  it("description が null のとき description セクションが表示されない", () => {
    const knowledgeWithoutDescription: Knowledge = {
      ...mockKnowledge,
      description: null,
    };
    render(<KnowledgeDetail knowledge={knowledgeWithoutDescription} />);
    expect(
      screen.queryByText("1970年代のUSA製デニムジャケット。")
    ).not.toBeInTheDocument();
  });

  it("識別ポイント「赤耳タグが特徴」が表示される", () => {
    render(<KnowledgeDetail knowledge={mockKnowledge} />);
    expect(screen.getByText("赤耳タグが特徴")).toBeInTheDocument();
  });

  it("識別ポイント「チェーンステッチが使われている」が表示される", () => {
    render(<KnowledgeDetail knowledge={mockKnowledge} />);
    expect(
      screen.getByText("チェーンステッチが使われている")
    ).toBeInTheDocument();
  });
});
