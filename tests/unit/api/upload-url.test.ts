// ---------------------------------------------------------------------------
// /api/upload-url Route Handler の振る舞いを検証する。
// - POST {mimeType, originalName} -> 200 {signedUrl, path, publicUrl}
// - 不正な mimeType -> 400 VALIDATION_ERROR
// - 内部例外 -> 500 INTERNAL_ERROR（スタックトレースを返さないこと）
// ---------------------------------------------------------------------------

const createSignedUploadUrlMock = vi.fn();

vi.mock("@/lib/storage", () => ({
  createSignedUploadUrl: (...args: unknown[]) =>
    createSignedUploadUrlMock(...args),
}));

import { POST } from "@/app/api/upload-url/route";

afterEach(() => {
  vi.clearAllMocks();
});

function makeRequest(body: unknown): Request {
  return new Request("http://localhost/api/upload-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/upload-url", () => {
  it("不正な JSON ボディなら 400 VALIDATION_ERROR を返し、createSignedUploadUrl を呼ばない", async () => {
    const req = new Request("http://localhost/api/upload-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);

    const json = (await res.json()) as { error?: { code?: string } };
    expect(json.error?.code).toBe("VALIDATION_ERROR");
    expect(createSignedUploadUrlMock).not.toHaveBeenCalled();
  });

  it("有効な入力で 200 と署名URLを返す", async () => {
    createSignedUploadUrlMock.mockResolvedValue({
      signedUrl: "https://x/sign?token=t",
      path: "abc.jpg",
      publicUrl: "https://x/public/abc.jpg",
    });

    const res = await POST(
      makeRequest({ mimeType: "image/jpeg", originalName: "abc.jpg" }),
    );
    expect(res.status).toBe(200);

    const json = (await res.json()) as {
      signedUrl?: string;
      path?: string;
      publicUrl?: string;
    };
    expect(json.signedUrl).toContain("token=");
    expect(json.path).toBe("abc.jpg");
    expect(json.publicUrl).toBe("https://x/public/abc.jpg");
  });

  it("HEIC のような未対応 mimeType は 400 を返す", async () => {
    const res = await POST(
      makeRequest({ mimeType: "image/heic", originalName: "p.heic" }),
    );
    expect(res.status).toBe(400);

    const json = (await res.json()) as {
      error?: { code?: string };
    };
    expect(json.error?.code).toBe("VALIDATION_ERROR");
    expect(createSignedUploadUrlMock).not.toHaveBeenCalled();
  });

  it("originalName が空でも 400 を返す", async () => {
    const res = await POST(
      makeRequest({ mimeType: "image/jpeg", originalName: "" }),
    );
    expect(res.status).toBe(400);
  });

  it("内部例外時は 500 を返し、スタックトレースを露出しない", async () => {
    createSignedUploadUrlMock.mockRejectedValue(
      new Error("internal-detail-leak"),
    );

    const res = await POST(
      makeRequest({ mimeType: "image/jpeg", originalName: "abc.jpg" }),
    );
    expect(res.status).toBe(500);

    const json = (await res.json()) as {
      error?: { code?: string; message?: string };
    };
    expect(json.error?.code).toBe("INTERNAL_ERROR");
    expect(json.error?.message).not.toContain("internal-detail-leak");
  });
});
