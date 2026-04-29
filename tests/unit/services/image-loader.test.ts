// ---------------------------------------------------------------------------
// lib/image-loader の振る舞いを検証する。
// - /uploads/<file>: ローカル開発用の public/uploads/ から読む
// - https://<SUPABASE_URL のホスト>/...: fetch で取得
// - 上記以外（外部任意 URL）: SSRF 防止のため拒否
// - 不正 URL: 拒否
//
// 注: fs/promises と global.fetch をモック化する（外部 I/O のためモック許可）。
// ---------------------------------------------------------------------------

vi.mock("fs/promises", () => {
  const readFile = vi.fn();
  return { default: { readFile }, readFile };
});

import { readFile } from "fs/promises";

const ORIGINAL_ENV = { ...process.env };
const ORIGINAL_FETCH = global.fetch;

afterEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
  process.env = { ...ORIGINAL_ENV };
  global.fetch = ORIGINAL_FETCH;
});

describe("loadImageBuffer (local)", () => {
  it("/uploads/<file> はローカルファイルから読み、拡張子から MIME を決める", async () => {
    vi.mocked(readFile).mockResolvedValue(Buffer.from("local-bytes"));

    const { loadImageBuffer } = await import("@/lib/image-loader");
    const result = await loadImageBuffer("/uploads/abc.png");

    expect(readFile).toHaveBeenCalled();
    expect(result.buffer.toString()).toBe("local-bytes");
    expect(result.mimeType).toBe("image/png");
  });

  it("/uploads/<file>.jpg は image/jpeg と解決する", async () => {
    vi.mocked(readFile).mockResolvedValue(Buffer.from("x"));

    const { loadImageBuffer } = await import("@/lib/image-loader");
    const result = await loadImageBuffer("/uploads/x.jpg");

    expect(result.mimeType).toBe("image/jpeg");
  });
});

describe("loadImageBuffer (Supabase remote)", () => {
  it("SUPABASE_URL ホストの URL は fetch で取得し、Content-Type から MIME を決める", async () => {
    process.env.SUPABASE_URL = "https://abc.supabase.co";

    const fetchMock = vi.fn().mockResolvedValue(
      new Response(new Uint8Array([0x89, 0x50, 0x4e, 0x47]).buffer, {
        status: 200,
        headers: { "Content-Type": "image/png" },
      }),
    );
    global.fetch = fetchMock as never;

    const url =
      "https://abc.supabase.co/storage/v1/object/public/ootd-images/abc.png";

    const { loadImageBuffer } = await import("@/lib/image-loader");
    const result = await loadImageBuffer(url);

    expect(fetchMock).toHaveBeenCalledWith(url);
    expect(result.mimeType).toBe("image/png");
    expect(result.buffer.length).toBe(4);
  });

  it("Content-Type が無いときは拡張子から MIME を補完する", async () => {
    process.env.SUPABASE_URL = "https://abc.supabase.co";

    const fetchMock = vi.fn().mockResolvedValue(
      new Response(new Uint8Array([0]).buffer, {
        status: 200,
        headers: {},
      }),
    );
    global.fetch = fetchMock as never;

    const { loadImageBuffer } = await import("@/lib/image-loader");
    const result = await loadImageBuffer(
      "https://abc.supabase.co/storage/v1/object/public/ootd-images/x.webp",
    );

    expect(result.mimeType).toBe("image/webp");
  });

  it("fetch が 200 以外を返したら例外を投げる", async () => {
    process.env.SUPABASE_URL = "https://abc.supabase.co";

    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 404 }));
    global.fetch = fetchMock as never;

    const { loadImageBuffer } = await import("@/lib/image-loader");

    await expect(
      loadImageBuffer(
        "https://abc.supabase.co/storage/v1/object/public/ootd-images/x.jpg",
      ),
    ).rejects.toThrow();
  });
});

describe("loadImageBuffer (バリデーション)", () => {
  it("SUPABASE_URL のホストと一致しない外部 URL は拒否する（SSRF 防止）", async () => {
    process.env.SUPABASE_URL = "https://abc.supabase.co";

    const fetchMock = vi.fn();
    global.fetch = fetchMock as never;

    const { loadImageBuffer } = await import("@/lib/image-loader");

    await expect(
      loadImageBuffer("https://evil.example.com/x.jpg"),
    ).rejects.toThrow();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("/uploads/ でも https:// でもない URL は拒否する", async () => {
    process.env.SUPABASE_URL = "https://abc.supabase.co";

    const { loadImageBuffer } = await import("@/lib/image-loader");

    await expect(loadImageBuffer("file:///etc/passwd")).rejects.toThrow();
    await expect(
      loadImageBuffer("ftp://abc.supabase.co/x.jpg"),
    ).rejects.toThrow();
    await expect(loadImageBuffer("not-a-url")).rejects.toThrow();
  });

  it("SUPABASE_URL 未設定でもローカル URL は読める", async () => {
    delete process.env.SUPABASE_URL;
    vi.mocked(readFile).mockResolvedValue(Buffer.from("ok"));

    const { loadImageBuffer } = await import("@/lib/image-loader");
    const result = await loadImageBuffer("/uploads/x.jpg");

    expect(result.buffer.toString()).toBe("ok");
  });

  it("SUPABASE_URL 未設定で https URL は拒否される", async () => {
    delete process.env.SUPABASE_URL;

    const { loadImageBuffer } = await import("@/lib/image-loader");

    await expect(
      loadImageBuffer("https://abc.supabase.co/x.jpg"),
    ).rejects.toThrow();
  });
});
