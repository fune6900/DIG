// ---------------------------------------------------------------------------
// OotdNewPageClient の画像選択時の挙動を検証する。
// 投稿確定時まで Supabase Storage には何も保存しないポリシーへ移行したため、
// - JPEG/PNG/WebP/GIF: ネットワークアクセスは一切発生せず、File が State に保持される
// - HEIC/HEIF: /api/ootd/heic-to-jpeg だけが呼ばれて JPEG Blob を受け取る
//   （Storage には何も保存されない）
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

describe("OotdNewPageClient — 画像選択時に Storage を触らない", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("JPEG 選択時はどの API も呼ばれず、AI分析ボタンが押せる状態になる", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    render(<OotdNewPageClient />);
    const file = new File([new Uint8Array([0, 1, 2])], "test.jpg", {
      type: "image/jpeg",
    });
    fireEvent.change(getFileInput(), { target: { files: [file] } });

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "AIで分析する" }),
      ).not.toBeDisabled();
    });

    // Storage 系もアップロード系も一切呼ばれない
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("HEIC 選択時は /api/ootd/heic-to-jpeg だけが呼ばれる（Storage には触らない）", async () => {
    const fetchMock = vi.fn().mockImplementation(async (input: RequestInfo) => {
      const url = typeof input === "string" ? input : (input as Request).url;
      expect(url).toMatch(/\/api\/ootd\/heic-to-jpeg$/);
      return new Response(new Uint8Array([1, 2, 3]), {
        status: 200,
        headers: { "Content-Type": "image/jpeg" },
      });
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

    const urls = pickedUrls(fetchMock);
    // Storage 関係のエンドポイントは呼ばれない
    expect(urls.some((u) => u.endsWith("/api/upload"))).toBe(false);
    expect(urls.some((u) => u.endsWith("/api/upload-url"))).toBe(false);
  });

  it("HEIC 変換 API が失敗したらエラーメッセージを表示する", async () => {
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
  });
});
