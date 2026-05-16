// ---------------------------------------------------------------------------
// uploadImageToStorage / buildImageSearchUrl のユニットテスト
//
// セキュリティ事前バリデーション（MIME / サイズ）と URL 組み立てのエンコード
// 安全性を検証する。アップロード本体（fetch）は副次的な検証のみ。
// ---------------------------------------------------------------------------

import {
  MAX_IMAGE_SIZE_BYTES,
  buildImageSearchUrl,
  uploadImageToStorage,
} from "@/lib/upload-image-client";

function makeFile({
  type,
  size,
  name = "x.bin",
}: {
  type: string;
  size: number;
  name?: string;
}): File {
  // File は内容そのものよりサイズが大事なテストなので、空 Blob にダミーサイズを
  // 持たせるために Object.defineProperty で上書きする。
  const file = new File([new Uint8Array(0)], name, { type });
  Object.defineProperty(file, "size", { value: size, configurable: true });
  return file;
}

describe("uploadImageToStorage — 入力バリデーション", () => {
  it("画像以外の MIME は invalid image type を throw する", async () => {
    const txt = makeFile({ type: "text/plain", size: 100, name: "a.txt" });
    await expect(uploadImageToStorage(txt)).rejects.toThrow(
      /invalid image type/,
    );
  });

  it("空ファイル (size=0) は invalid image size を throw する", async () => {
    const empty = makeFile({ type: "image/jpeg", size: 0 });
    await expect(uploadImageToStorage(empty)).rejects.toThrow(
      /invalid image size/,
    );
  });

  it(`MAX_IMAGE_SIZE_BYTES (${MAX_IMAGE_SIZE_BYTES}) を超えるファイルは invalid image size を throw する`, async () => {
    const huge = makeFile({
      type: "image/jpeg",
      size: MAX_IMAGE_SIZE_BYTES + 1,
    });
    await expect(uploadImageToStorage(huge)).rejects.toThrow(
      /invalid image size/,
    );
  });

  it("image/* の MIME 以外（例: application/octet-stream）は invalid image type を throw する", async () => {
    const bin = makeFile({ type: "application/octet-stream", size: 100 });
    await expect(uploadImageToStorage(bin)).rejects.toThrow(
      /invalid image type/,
    );
  });

  it("バリデーション失敗のときは fetch を呼ばない（送信前に弾く）", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const txt = makeFile({ type: "text/plain", size: 100 });
    await expect(uploadImageToStorage(txt)).rejects.toThrow();
    expect(fetchMock).not.toHaveBeenCalled();

    vi.unstubAllGlobals();
  });
});

describe("buildImageSearchUrl — エンコード安全性", () => {
  it("styles のみで URLSearchParams 経由のクエリを生成する", () => {
    const url = buildImageSearchUrl(["アメカジ"], []);
    const parsed = new URL(url, "http://x");
    expect(parsed.pathname).toBe("/search");
    expect(parsed.searchParams.get("styles")).toBe("アメカジ");
    expect(parsed.searchParams.has("colors")).toBe(false);
  });

  it("colorCategories のみで URL を生成する", () => {
    const url = buildImageSearchUrl([], ["ネイビー系"]);
    const parsed = new URL(url, "http://x");
    expect(parsed.searchParams.get("colors")).toBe("ネイビー系");
    expect(parsed.searchParams.has("styles")).toBe(false);
  });

  it("両方空のときは /search を返す（? 抜き）", () => {
    expect(buildImageSearchUrl([], [])).toBe("/search");
  });

  it("値に & や = が混じっても URLSearchParams で安全にエンコードされる", () => {
    const url = buildImageSearchUrl(["a&b", "c=d"], ["e&f"]);
    const parsed = new URL(url, "http://x");
    expect(parsed.searchParams.get("styles")).toBe("a&b,c=d");
    expect(parsed.searchParams.get("colors")).toBe("e&f");
  });
});
