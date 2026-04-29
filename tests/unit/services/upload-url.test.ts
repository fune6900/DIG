// ---------------------------------------------------------------------------
// lib/storage.ts: createSignedUploadUrl / convertHeicToJpeg の振る舞いを検証する。
// - createSignedUploadUrl: Supabase の createSignedUploadUrl を呼び、{signedUrl, path, publicUrl}
//   の3点セットを返すこと
// - convertHeicToJpeg: heic-convert を呼んで JPEG Buffer を返すこと
//
// 注: heic-convert と @supabase/supabase-js は外部依存のためモック許可。
// ---------------------------------------------------------------------------

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(),
}));

vi.mock("heic-convert", () => ({
  default: vi.fn(),
}));

import { createClient } from "@supabase/supabase-js";
import heicConvert from "heic-convert";

const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
  process.env = { ...ORIGINAL_ENV };
});

describe("createSignedUploadUrl", () => {
  function setEnv() {
    process.env.STORAGE_DRIVER = "supabase";
    process.env.SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";
    process.env.SUPABASE_STORAGE_BUCKET = "ootd-images";
  }

  it("Supabase の createSignedUploadUrl を呼んで {signedUrl, path, publicUrl} を返す", async () => {
    setEnv();

    const createSignedUploadUrl = vi.fn().mockResolvedValue({
      data: {
        signedUrl:
          "https://example.supabase.co/storage/v1/object/upload/sign/ootd-images/abc.jpg?token=xxx",
        path: "abc.jpg",
        token: "xxx",
      },
      error: null,
    });
    const getPublicUrl = vi.fn().mockReturnValue({
      data: {
        publicUrl:
          "https://example.supabase.co/storage/v1/object/public/ootd-images/abc.jpg",
      },
    });
    const from = vi.fn().mockReturnValue({ createSignedUploadUrl, getPublicUrl });
    vi.mocked(createClient).mockReturnValue({ storage: { from } } as never);

    const { createSignedUploadUrl: createSignedUploadUrlFn } = await import(
      "@/lib/storage"
    );

    const result = await createSignedUploadUrlFn("image/jpeg", "abc.jpg");

    expect(from).toHaveBeenCalledWith("ootd-images");
    expect(createSignedUploadUrl).toHaveBeenCalled();
    expect(result.signedUrl).toContain("token=");
    expect(result.path).toMatch(/\.jpg$/);
    expect(result.publicUrl).toBe(
      "https://example.supabase.co/storage/v1/object/public/ootd-images/abc.jpg",
    );
  });

  it("拡張子は mimeType から決定する（fallback name に依存しない）", async () => {
    setEnv();

    const createSignedUploadUrlMock = vi.fn().mockResolvedValue({
      data: {
        signedUrl: "https://x/sign?token=t",
        path: "ignored",
        token: "t",
      },
      error: null,
    });
    const getPublicUrl = vi.fn().mockReturnValue({
      data: { publicUrl: "https://public/url.png" },
    });
    const from = vi
      .fn()
      .mockReturnValue({ createSignedUploadUrl: createSignedUploadUrlMock, getPublicUrl });
    vi.mocked(createClient).mockReturnValue({ storage: { from } } as never);

    const { createSignedUploadUrl: createSignedUploadUrlFn } = await import(
      "@/lib/storage"
    );

    const result = await createSignedUploadUrlFn("image/png", "noext");

    expect(result.path).toMatch(/\.png$/);
  });

  it("Supabase が error を返したら例外を投げる", async () => {
    setEnv();

    const createSignedUploadUrlMock = vi.fn().mockResolvedValue({
      data: null,
      error: { message: "boom" },
    });
    const from = vi.fn().mockReturnValue({
      createSignedUploadUrl: createSignedUploadUrlMock,
      getPublicUrl: vi.fn(),
    });
    vi.mocked(createClient).mockReturnValue({ storage: { from } } as never);

    const { createSignedUploadUrl: createSignedUploadUrlFn } = await import(
      "@/lib/storage"
    );

    await expect(
      createSignedUploadUrlFn("image/jpeg", "abc.jpg"),
    ).rejects.toThrow();
  });

  it("STORAGE_DRIVER が supabase でないと例外を投げる", async () => {
    process.env.STORAGE_DRIVER = "local";

    const { createSignedUploadUrl: createSignedUploadUrlFn } = await import(
      "@/lib/storage"
    );

    await expect(
      createSignedUploadUrlFn("image/jpeg", "abc.jpg"),
    ).rejects.toThrow();
  });
});

describe("convertHeicToJpeg", () => {
  it("heic-convert を JPEG フォーマットで呼び出して Buffer を返す", async () => {
    const out = new ArrayBuffer(8);
    vi.mocked(heicConvert).mockResolvedValue(out as never);

    const { convertHeicToJpeg } = await import("@/lib/storage");
    const input = Buffer.from("heic-bytes");

    const result = await convertHeicToJpeg(input);

    expect(heicConvert).toHaveBeenCalledWith(
      expect.objectContaining({
        format: "JPEG",
        buffer: input,
      }),
    );
    expect(Buffer.isBuffer(result)).toBe(true);
  });

  it("変換中の例外を呼び出し元に伝播する", async () => {
    vi.mocked(heicConvert).mockRejectedValue(new Error("decode fail"));

    const { convertHeicToJpeg } = await import("@/lib/storage");
    const input = Buffer.from("broken");

    await expect(convertHeicToJpeg(input)).rejects.toThrow("decode fail");
  });
});
