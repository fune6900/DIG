import { render, screen } from "@testing-library/react";

// useRouter / Server Action / useIsMobile を差し替えてレンダリング可能にする。
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("@/app/actions/ootd", () => ({
  createOotdAction: vi.fn(),
}));

const useIsMobileMock = vi.fn();
vi.mock("@/hooks/useIsMobile", () => ({
  useIsMobile: () => useIsMobileMock(),
}));

import { OotdNewPageClient } from "@/app/(public)/ootd/new/OotdNewPageClient";

function getFileInput(): HTMLInputElement {
  const input = screen.getByLabelText("コーデ画像", { selector: "input" });
  expect(input.tagName).toBe("INPUT");
  return input as HTMLInputElement;
}

describe("OotdNewPageClient — capture 属性", () => {
  beforeEach(() => {
    useIsMobileMock.mockReset();
  });

  it("SP（isMobile=true）のとき file input に capture='environment' が付く", () => {
    useIsMobileMock.mockReturnValue(true);
    render(<OotdNewPageClient />);
    expect(getFileInput().getAttribute("capture")).toBe("environment");
  });

  it("PC（isMobile=false）のとき file input に capture 属性が付かない", () => {
    useIsMobileMock.mockReturnValue(false);
    render(<OotdNewPageClient />);
    expect(getFileInput().hasAttribute("capture")).toBe(false);
  });
});
