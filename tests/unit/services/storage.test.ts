// ---------------------------------------------------------------------------
// lib/storage の振る舞いを検証する。
// - driver=local（既定）: public/uploads/ にファイルを書き出して /uploads/<filename> を返す
// - driver=supabase: Supabase Storage クライアントの upload を呼んで public URL を返す
//
// 注: fs/promises は外部 I/O のためモック許可（testing.md の例外条項に倣う）。
// 実 FS への書き込みは E2E ではなく実機検証で担保する。
// ---------------------------------------------------------------------------

vi.mock("fs/promises", () => {
  const writeFile = vi.fn().mockResolvedValue(undefined);
  const mkdir = vi.fn().mockResolvedValue(undefined);
  return {
    default: { writeFile, mkdir },
    writeFile,
    mkdir,
  };
});

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(),
}));

import { writeFile, mkdir } from "fs/promises";
import { createClient } from "@supabase/supabase-js";

const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
  process.env = { ...ORIGINAL_ENV };
});

describe("uploadImage (local driver)", () => {
  it("STORAGE_DRIVER 未設定または 'local' のときローカルに保存する", async () => {
    process.env.STORAGE_DRIVER = "local";
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    const { uploadImage } = await import("@/lib/storage");
    const buffer = Buffer.from("dummy-image-bytes");

    const result = await uploadImage(buffer, "image/jpeg", "test.jpg");

    expect(result.url).toMatch(/^\/uploads\/[^/]+\.jpg$/);
    expect(mkdir).toHaveBeenCalled();
    expect(writeFile).toHaveBeenCalled();
  });

  it("拡張子を mimeType から推測する", async () => {
    process.env.STORAGE_DRIVER = "local";

    const { uploadImage } = await import("@/lib/storage");
    const buffer = Buffer.from("dummy");

    const result = await uploadImage(buffer, "image/png", "noext");

    expect(result.url).toMatch(/\.png$/);
  });

  it("不正な拡張子（パス区切りや特殊文字混入）は .jpg にフォールバックする", async () => {
    process.env.STORAGE_DRIVER = "local";

    const { uploadImage } = await import("@/lib/storage");
    const buffer = Buffer.from("dummy");

    // mimeType がマップ外で、ファイル名末尾が安全でないケース
    const result = await uploadImage(
      buffer,
      "application/octet-stream",
      "evil.../bin/sh",
    );

    expect(result.url).toMatch(/\.jpg$/);
  });
});

describe("uploadImage (supabase driver)", () => {
  it("STORAGE_DRIVER='supabase' のとき Supabase に upload する", async () => {
    process.env.STORAGE_DRIVER = "supabase";
    process.env.SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";
    process.env.SUPABASE_STORAGE_BUCKET = "ootd-images";

    const upload = vi
      .fn()
      .mockResolvedValue({ data: { path: "abc.jpg" }, error: null });
    const getPublicUrl = vi.fn().mockReturnValue({
      data: {
        publicUrl:
          "https://example.supabase.co/storage/v1/object/public/ootd-images/abc.jpg",
      },
    });
    const from = vi.fn().mockReturnValue({ upload, getPublicUrl });

    vi.mocked(createClient).mockReturnValue({ storage: { from } } as never);

    const { uploadImage } = await import("@/lib/storage");
    const buffer = Buffer.from("dummy");

    const result = await uploadImage(buffer, "image/jpeg", "abc.jpg");

    expect(createClient).toHaveBeenCalledWith(
      "https://example.supabase.co",
      "service-role-key",
      expect.any(Object),
    );
    expect(from).toHaveBeenCalledWith("ootd-images");
    expect(upload).toHaveBeenCalled();
    expect(result.url).toBe(
      "https://example.supabase.co/storage/v1/object/public/ootd-images/abc.jpg",
    );
  });

  it("Supabase upload がエラーを返したら例外を投げる", async () => {
    process.env.STORAGE_DRIVER = "supabase";
    process.env.SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";
    process.env.SUPABASE_STORAGE_BUCKET = "ootd-images";

    const upload = vi
      .fn()
      .mockResolvedValue({ data: null, error: { message: "boom" } });
    const from = vi.fn().mockReturnValue({ upload, getPublicUrl: vi.fn() });
    vi.mocked(createClient).mockReturnValue({ storage: { from } } as never);

    const { uploadImage } = await import("@/lib/storage");
    const buffer = Buffer.from("dummy");

    await expect(
      uploadImage(buffer, "image/jpeg", "abc.jpg"),
    ).rejects.toThrow();
  });

  it("STORAGE_DRIVER='supabase' でも Supabase の env が無いと例外を投げる", async () => {
    process.env.STORAGE_DRIVER = "supabase";
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    const { uploadImage } = await import("@/lib/storage");
    const buffer = Buffer.from("dummy");

    await expect(
      uploadImage(buffer, "image/jpeg", "abc.jpg"),
    ).rejects.toThrow();
  });
});

describe("uploadImage (driver 解決)", () => {
  it("STORAGE_DRIVER に 'local'/'supabase' 以外を指定すると例外を投げる", async () => {
    process.env.STORAGE_DRIVER = "s3";

    const { uploadImage } = await import("@/lib/storage");
    const buffer = Buffer.from("dummy");

    await expect(uploadImage(buffer, "image/jpeg", "x.jpg")).rejects.toThrow(
      /Invalid STORAGE_DRIVER/,
    );
  });

  it("STORAGE_DRIVER 未設定のときはローカルに落ちる", async () => {
    delete process.env.STORAGE_DRIVER;

    const { uploadImage } = await import("@/lib/storage");
    const buffer = Buffer.from("dummy");

    const result = await uploadImage(buffer, "image/jpeg", "x.jpg");
    expect(result.url.startsWith("/uploads/")).toBe(true);
  });
});
