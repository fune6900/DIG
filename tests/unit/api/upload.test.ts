// @vitest-environment node
// ---------------------------------------------------------------------------
// /api/upload Route Handler の HEIC 経路を検証する。
// - HEIC/HEIF: convertHeicToJpeg を呼んで JPEG として保存し、URL を返す
// - JPEG/PNG: 従来通り uploadImage に直接渡す
//
// 環境: Route Handler は Node ランタイムを前提とするため jsdom ではなく node 環境で
// 検証する。jsdom の File/Blob/FormData は undici の実装と別物で `instanceof File`
// が false になりルートが 400 を返してしまうため。
// ---------------------------------------------------------------------------

const uploadImageMock = vi.fn();
const convertHeicToJpegMock = vi.fn();

vi.mock("@/lib/storage", () => ({
  uploadImage: (...args: unknown[]) => uploadImageMock(...args),
  convertHeicToJpeg: (...args: unknown[]) => convertHeicToJpegMock(...args),
}));

import { POST } from "@/app/api/upload/route";

afterEach(() => {
  vi.clearAllMocks();
});

function makeFormDataRequest(file: File): Request {
  const fd = new FormData();
  fd.append("image", file);
  return new Request("http://localhost/api/upload", {
    method: "POST",
    body: fd,
  });
}

describe("POST /api/upload — HEIC 経路", () => {
  it("HEIC を受けたら convertHeicToJpeg で変換した Buffer を image/jpeg として保存する", async () => {
    const converted = Buffer.from("jpeg-bytes");
    convertHeicToJpegMock.mockResolvedValue(converted);
    uploadImageMock.mockResolvedValue({
      url: "https://x/public/converted.jpg",
    });

    const heic = new File([new Uint8Array([0, 1, 2, 3])], "photo.heic", {
      type: "image/heic",
    });
    const res = await POST(makeFormDataRequest(heic));

    expect(res.status).toBe(200);
    expect(convertHeicToJpegMock).toHaveBeenCalled();
    // uploadImage は変換後 Buffer / image/jpeg / .jpg 拡張子で呼ばれる
    const [bufArg, mimeArg, nameArg] = uploadImageMock.mock.calls[0] ?? [];
    expect(Buffer.isBuffer(bufArg)).toBe(true);
    expect(mimeArg).toBe("image/jpeg");
    expect(nameArg).toMatch(/\.jpg$/);
  });

  it("HEIF も同様に JPEG 変換経路に乗る", async () => {
    convertHeicToJpegMock.mockResolvedValue(Buffer.from("ok"));
    uploadImageMock.mockResolvedValue({ url: "https://x/public/x.jpg" });

    const heif = new File([new Uint8Array([0])], "photo.heif", {
      type: "image/heif",
    });
    const res = await POST(makeFormDataRequest(heif));

    expect(res.status).toBe(200);
    expect(convertHeicToJpegMock).toHaveBeenCalled();
  });

  it("JPEG は変換せずに直接 uploadImage に渡す", async () => {
    uploadImageMock.mockResolvedValue({ url: "https://x/public/a.jpg" });

    const jpeg = new File([new Uint8Array([0])], "a.jpg", {
      type: "image/jpeg",
    });
    const res = await POST(makeFormDataRequest(jpeg));

    expect(res.status).toBe(200);
    expect(convertHeicToJpegMock).not.toHaveBeenCalled();
    expect(uploadImageMock).toHaveBeenCalledWith(
      expect.any(Buffer),
      "image/jpeg",
      "a.jpg",
    );
  });

  it("10MB を超えるファイルは 413 FILE_TOO_LARGE を返し、uploadImage を呼ばない", async () => {
    // 11MB の Uint8Array を File に詰める。File.size はバイト長で判定される。
    const oversize = new Uint8Array(11 * 1024 * 1024);
    const big = new File([oversize], "huge.jpg", { type: "image/jpeg" });

    const res = await POST(makeFormDataRequest(big));

    expect(res.status).toBe(413);
    const json = (await res.json()) as {
      data: unknown;
      error?: { code?: string };
    };
    expect(json.data).toBeNull();
    expect(json.error?.code).toBe("FILE_TOO_LARGE");
    expect(uploadImageMock).not.toHaveBeenCalled();
    expect(convertHeicToJpegMock).not.toHaveBeenCalled();
  });

  it("image/svg+xml のような未許可 MIME は 400 を返し、uploadImage を呼ばない", async () => {
    const svg = new File([new Uint8Array([0])], "evil.svg", {
      type: "image/svg+xml",
    });
    const res = await POST(makeFormDataRequest(svg));

    expect(res.status).toBe(400);
    const json = (await res.json()) as { error?: { code?: string } };
    expect(json.error?.code).toBe("INVALID_FILE_TYPE");
    expect(uploadImageMock).not.toHaveBeenCalled();
  });

  it("HEIC 変換失敗時は 500 を返し、内部エラーメッセージを露出しない", async () => {
    convertHeicToJpegMock.mockRejectedValue(new Error("libheif-secret"));

    const heic = new File([new Uint8Array([0])], "p.heic", {
      type: "image/heic",
    });
    const res = await POST(makeFormDataRequest(heic));

    expect(res.status).toBe(500);
    const json = (await res.json()) as {
      error?: { code?: string; message?: string };
    };
    expect(json.error?.code).toBe("INTERNAL_ERROR");
    expect(json.error?.message).not.toContain("libheif-secret");
  });
});
