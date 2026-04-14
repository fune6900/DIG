import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Pagination } from "@/components/ui/Pagination";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

describe("Pagination", () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  it("totalPages=1 のとき何もレンダリングされない", () => {
    const { container } = render(
      <Pagination currentPage={1} totalPages={1} baseUrl="/knowledge" />
    );
    expect(container.firstChild).toBeNull();
  });

  it("currentPage=1 のとき「前へ」ボタンが disabled", () => {
    render(
      <Pagination currentPage={1} totalPages={5} baseUrl="/knowledge" />
    );
    const prevButton = screen.getByRole("button", { name: /前へ/ });
    expect(prevButton).toBeDisabled();
  });

  it("currentPage=totalPages のとき「次へ」ボタンが disabled", () => {
    render(
      <Pagination currentPage={5} totalPages={5} baseUrl="/knowledge" />
    );
    const nextButton = screen.getByRole("button", { name: /次へ/ });
    expect(nextButton).toBeDisabled();
  });

  it("「次へ」ボタンクリックで router.push が次のページの URL で呼ばれる", async () => {
    const user = userEvent.setup();
    render(
      <Pagination currentPage={2} totalPages={5} baseUrl="/knowledge" />
    );
    const nextButton = screen.getByRole("button", { name: /次へ/ });
    await user.click(nextButton);

    expect(mockPush).toHaveBeenCalledTimes(1);
    const calledUrl: string = mockPush.mock.calls[0][0] as string;
    expect(calledUrl).toContain("page=3");
  });
});
