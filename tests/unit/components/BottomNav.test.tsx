import { render, screen } from "@testing-library/react";
import { BottomNav } from "@/components/ui/BottomNav";

const usePathnameMock = vi.fn();
vi.mock("next/navigation", () => ({
  usePathname: () => usePathnameMock(),
}));

describe("BottomNav", () => {
  beforeEach(() => {
    usePathnameMock.mockReset();
    usePathnameMock.mockReturnValue("/ootd");
  });

  it("着こなし検索リンクは /search を指し、search アイコンを表示する", () => {
    render(<BottomNav />);
    const link = screen.getByRole("link", { name: /着こなし検索/ });
    expect(link).toHaveAttribute("href", "/search");
    // SearchIcon は <circle> + <line> を持つ虫眼鏡アイコン
    const svg = link.querySelector("svg");
    expect(svg).not.toBeNull();
    expect(svg?.querySelector("circle")).not.toBeNull();
  });

  it("OOTD一覧リンクは /ootd を指し、calendar アイコンを表示する", () => {
    render(<BottomNav />);
    const link = screen.getByRole("link", { name: /OOTD一覧/ });
    expect(link).toHaveAttribute("href", "/ootd");
    // CalendarIcon は <rect> を持つ
    const svg = link.querySelector("svg");
    expect(svg).not.toBeNull();
    expect(svg?.querySelector("rect")).not.toBeNull();
  });

  it("OOTD追加（中央）リンクは /ootd/new を指す", () => {
    render(<BottomNav />);
    const link = screen.getByRole("link", { name: /OOTDを追加/ });
    expect(link).toHaveAttribute("href", "/ootd/new");
  });

  it("/ootd/new ではナビが描画されない（早期リターン）", () => {
    usePathnameMock.mockReturnValue("/ootd/new");
    const { container } = render(<BottomNav />);
    expect(container.querySelector("nav")).toBeNull();
  });

  it("/ootd/new/foo（サブパス）でもナビは描画されない", () => {
    usePathnameMock.mockReturnValue("/ootd/new/foo");
    const { container } = render(<BottomNav />);
    expect(container.querySelector("nav")).toBeNull();
  });
});
