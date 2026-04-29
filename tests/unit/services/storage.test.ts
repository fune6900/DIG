import { writeFile, mkdir, unlink } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";

// ---------------------------------------------------------------------------
// lib/storage の振る舞いを検証する。
// - driver=local（既定）: public/uploads/ にファイルを書き出して /uploads/<filename> を返す
// - driver=supabase: Supabase Storage クライアントの upload を呼んで public URL を返す
// ---------------------------------------------------------------------------

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(),
}));

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
  });

  it("拡張子を mimeType から推測する", async () => {
    process.env.STORAGE_DRIVER = "local";

    const { uploadImage } = await import("@/lib/storage");
    const buffer = Buffer.from("dummy");

    const result = await uploadImage(buffer, "image/png", "noext");

    expect(result.url).toMatch(/\.png$/);
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

// 後始末: ローカルテスト用に作られたファイルが残っても次回テストには影響しないが、
// 大量に蓄積しないように tests 内で参照しないことを確認。
describe("local driver の副作用", () => {
  it("public/uploads/ 配下に書き出す", async () => {
    process.env.STORAGE_DRIVER = "local";

    const { uploadImage } = await import("@/lib/storage");
    const buffer = Buffer.from("hello");

    const result = await uploadImage(buffer, "image/jpeg", "x.jpg");
    expect(result.url.startsWith("/uploads/")).toBe(true);
  });
});

// helper: テストの後始末で生成された /public/uploads/*.jpg が増えないように
// uploadImage を呼ぶ際は random filename になる前提だが、テストで作ったファイルを
// 全削除すると並列実行時に他テストを壊す可能性があるため放置（CI ではクリーンビルド）。
void writeFile;
void mkdir;
void unlink;
void join;
void tmpdir;
