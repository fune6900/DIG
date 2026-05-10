// ---------------------------------------------------------------------------
// OotdNewPageClient の画像選択時の挙動を検証する。
// 投稿確定時まで Supabase Storage には何も保存しないポリシー。
// 画像選択完了時点で AI 分析（POST /api/ootd/analyze）を自動実行するように変更（手動ボタン廃止）。
// - JPEG/PNG/WebP/GIF: /api/ootd/analyze だけが自動で呼ばれる
// - HEIC/HEIF: /api/ootd/heic-to-jpeg → /api/ootd/analyze の順で自動で呼ばれる
// - Storage 系（/api/upload, /api/upload-url）は投稿確定時まで一切呼ばない
// ---------------------------------------------------------------------------

import { render, screen, fireEvent, waitFor } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("@/app/actions/ootd", () => ({
  createOotdAction: vi.fn(),
  deleteUploadedImagesAction: vi.fn(),
}));

vi.mock("@/hooks/useIsMobile", () => ({
  useIsMobile: () => false,
}));

import { OotdNewPageClient } from "@/app/(public)/ootd/new/OotdNewPageClient";

function getFileInput(): HTMLInputElement {
  const input = screen.getByLabelText("コーデ画像（写真ライブラリ）", {
    selector: "input",
  });
  return input as HTMLInputElement;
}

function pickedUrls(fetchMock: ReturnType<typeof vi.fn>): string[] {
  return fetchMock.mock.calls.map((c) =>
    typeof c[0] === "string" ? c[0] : (c[0] as Request).url,
  );
}

function jsonOk(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

const ANALYSIS_RESULT_FIXTURE = {
  oneLiner: "test-one-liner",
  colorPalette: [{ name: "white", colorCode: "#FFFFFF", percentage: 100 }],
  styles: [{ name: "ストリートウェア", percentage: 100 }],
  description: "test-description",
  detectedItems: [{ name: "shirt" }],
};

beforeAll(() => {
  if (typeof URL.createObjectURL !== "function") {
    Object.defineProperty(URL, "createObjectURL", {
      value: () => "blob:mock",
      configurable: true,
    });
  }
  if (typeof URL.revokeObjectURL !== "function") {
    Object.defineProperty(URL, "revokeObjectURL", {
      value: () => {},
      configurable: true,
    });
  }
});

describe("OotdNewPageClient — 画像選択時に自動で AI 分析する", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("「AIで分析する」ボタンは存在しない（自動分析へ移行）", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        jsonOk({ data: ANALYSIS_RESULT_FIXTURE, error: null }),
      );
    vi.stubGlobal("fetch", fetchMock);

    render(<OotdNewPageClient />);
    expect(screen.queryByRole("button", { name: "AIで分析する" })).toBeNull();
  });

  it("JPEG 選択時は /api/ootd/analyze だけが自動で呼ばれる（Storage には触らない）", async () => {
    const fetchMock = vi.fn().mockImplementation(async (input: RequestInfo) => {
      const url = typeof input === "string" ? input : (input as Request).url;
      expect(url).toMatch(/\/api\/ootd\/analyze$/);
      return jsonOk({ data: ANALYSIS_RESULT_FIXTURE, error: null });
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<OotdNewPageClient />);
    const file = new File([new Uint8Array([0, 1, 2])], "test.jpg", {
      type: "image/jpeg",
    });
    fireEvent.change(getFileInput(), { target: { files: [file] } });

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
    });

    const urls = pickedUrls(fetchMock);
    expect(urls.some((u) => u.endsWith("/api/ootd/analyze"))).toBe(true);
    expect(urls.some((u) => u.endsWith("/api/upload"))).toBe(false);
    expect(urls.some((u) => u.endsWith("/api/upload-url"))).toBe(false);
  });

  it("HEIC 選択時は /api/ootd/heic-to-jpeg → /api/ootd/analyze の順で自動で呼ばれる", async () => {
    const fetchMock = vi.fn().mockImplementation(async (input: RequestInfo) => {
      const url = typeof input === "string" ? input : (input as Request).url;
      if (url.endsWith("/api/ootd/heic-to-jpeg")) {
        return new Response(new Uint8Array([1, 2, 3]), {
          status: 200,
          headers: { "Content-Type": "image/jpeg" },
        });
      }
      if (url.endsWith("/api/ootd/analyze")) {
        return jsonOk({ data: ANALYSIS_RESULT_FIXTURE, error: null });
      }
      throw new Error(`Unexpected fetch: ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<OotdNewPageClient />);
    const heic = new File([new Uint8Array([0])], "photo.heic", {
      type: "image/heic",
    });
    fireEvent.change(getFileInput(), { target: { files: [heic] } });

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    const urls = pickedUrls(fetchMock);
    expect(urls[0]).toMatch(/\/api\/ootd\/heic-to-jpeg$/);
    expect(urls[1]).toMatch(/\/api\/ootd\/analyze$/);
    expect(urls.some((u) => u.endsWith("/api/upload"))).toBe(false);
    expect(urls.some((u) => u.endsWith("/api/upload-url"))).toBe(false);
  });

  it("HEIC 変換 API が失敗したらエラーメッセージを表示し、analyze は呼ばれない", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: { message: "boom" } }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    render(<OotdNewPageClient />);
    const heic = new File([new Uint8Array([0])], "photo.heic", {
      type: "image/heic",
    });
    fireEvent.change(getFileInput(), { target: { files: [heic] } });

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });

    const urls = pickedUrls(fetchMock);
    expect(urls.some((u) => u.endsWith("/api/ootd/analyze"))).toBe(false);
  });
});
