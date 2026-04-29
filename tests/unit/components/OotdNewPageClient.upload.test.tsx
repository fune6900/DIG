// ---------------------------------------------------------------------------
// OotdNewPageClient のアップロード経路分岐を検証する。
// - JPEG/PNG/WebP/GIF: /api/upload-url を取得 → 署名URLへ直接 PUT → publicUrl を保持
// - HEIC/HEIF: /api/upload に FormData を送る既存経路
// ---------------------------------------------------------------------------

import { render, screen, fireEvent, waitFor } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("@/app/actions/ootd", () => ({
  createOotdAction: vi.fn(),
}));

vi.mock("@/hooks/useIsMobile", () => ({
  useIsMobile: () => false,
}));

import { OotdNewPageClient } from "@/app/(public)/ootd/new/OotdNewPageClient";

function getFileInput(): HTMLInputElement {
  const input = screen.getByLabelText("コーデ画像", { selector: "input" });
  return input as HTMLInputElement;
}

function fakeFetchResponse(body: unknown, init?: { status?: number }): Response {
  return new Response(JSON.stringify(body), {
    status: init?.status ?? 200,
    headers: { "Content-Type": "application/json" },
  });
}

describe("OotdNewPageClient — アップロード経路分岐", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("JPEG 選択時は /api/upload-url → 署名URLへ PUT → publicUrl を保持する", async () => {
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(async (input: RequestInfo) => {
        const url =
          typeof input === "string"
            ? input
            : (input as Request).url;
        expect(url).toMatch(/\/api\/upload-url$/);
        return fakeFetchResponse({
          signedUrl: "https://x.supabase.co/sign?token=abc",
          path: "abc.jpg",
          publicUrl: "https://x.supabase.co/public/abc.jpg",
        });
      })
      .mockImplementationOnce(async (input: RequestInfo, init?: RequestInit) => {
        const url =
          typeof input === "string"
            ? input
            : (input as Request).url;
        expect(url).toContain("token=");
        expect(init?.method).toBe("PUT");
        return new Response(null, { status: 200 });
      });
    vi.stubGlobal("fetch", fetchMock);

    render(<OotdNewPageClient />);
    const file = new File([new Uint8Array([0, 1, 2])], "test.jpg", {
      type: "image/jpeg",
    });
    fireEvent.change(getFileInput(), { target: { files: [file] } });

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    // /api/upload は呼ばれない
    const calledUrls = fetchMock.mock.calls.map((c) =>
      typeof c[0] === "string" ? c[0] : (c[0] as Request).url,
    );
    expect(calledUrls.some((u) => u.endsWith("/api/upload"))).toBe(false);
  });

  it("HEIC 選択時は /api/upload に FormData を送る既存経路を使う", async () => {
    const fetchMock = vi.fn().mockImplementation(async (input: RequestInfo) => {
      const url =
        typeof input === "string" ? input : (input as Request).url;
      expect(url).toMatch(/\/api\/upload$/);
      return fakeFetchResponse({ url: "https://x.supabase.co/public/p.jpg" });
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<OotdNewPageClient />);
    const heic = new File([new Uint8Array([0])], "photo.heic", {
      type: "image/heic",
    });
    fireEvent.change(getFileInput(), { target: { files: [heic] } });

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    // /api/upload-url は呼ばれない
    const calledUrls = fetchMock.mock.calls.map((c) =>
      typeof c[0] === "string" ? c[0] : (c[0] as Request).url,
    );
    expect(calledUrls.some((u) => u.endsWith("/api/upload-url"))).toBe(false);
  });

  it("署名URLへの PUT が失敗したらエラーメッセージを表示する", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        fakeFetchResponse({
          signedUrl: "https://x/sign?token=t",
          path: "p.jpg",
          publicUrl: "https://x/public/p.jpg",
        }),
      )
      .mockResolvedValueOnce(new Response(null, { status: 403 }));
    vi.stubGlobal("fetch", fetchMock);

    render(<OotdNewPageClient />);
    const jpeg = new File([new Uint8Array([0])], "x.jpg", {
      type: "image/jpeg",
    });
    fireEvent.change(getFileInput(), { target: { files: [jpeg] } });

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
  });
});
