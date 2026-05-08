// ---------------------------------------------------------------------------
// POST /api/ootd/analyze Route Handler の振る舞いを検証する。
// - formData() 失敗       -> 500 INTERNAL_ERROR
// - image フィールドなし  -> 400 MISSING_FILE
// - 不正 MIME タイプ      -> 400 INVALID_FILE_TYPE
// - ファイルサイズ超過    -> 413 FILE_TOO_LARGE
// - 有効 JPEG             -> 200 (analyzeOutfit 呼び出し確認)
// - image/jpg 正規化      -> analyzeOutfit に "image/jpeg" を渡す
// - HEIC 変換パス         -> convertHeicToJpeg 後に "image/jpeg" で呼ぶ
// - analyzeOutfit 失敗    -> 500 INTERNAL_ERROR (内部詳細を漏らさない)
// ---------------------------------------------------------------------------

const analyzeOutfitMock = vi.fn();
const convertHeicToJpegMock = vi.fn();

vi.mock("@/services/ai-analysis", () => ({
  analyzeOutfit: (...args: unknown[]) => analyzeOutfitMock(...args),
  normalizeColorCode: vi.fn(),
  normalizeAnalysisResult: vi.fn(),
}));

vi.mock("@/lib/storage", () => ({
  convertHeicToJpeg: (...args: unknown[]) => convertHeicToJpegMock(...args),
}));

import { POST } from "@/app/api/ootd/analyze/route";

const MOCK_RESULT = {
  oneLiner: "テストコーデ",
  colorPalette: [{ name: "黒", colorCode: "#000000", percentage: 100 }],
  styles: [{ name: "ストリート", percentage: 100 }],
  description: "テスト説明",
  detectedItems: [{ name: "Tシャツ" }],
};

function makeReq(formData: FormData): Request {
  return {
    formData: vi.fn().mockResolvedValue(formData),
  } as unknown as Request;
}

function makeFailingReq(): Request {
  return {
    formData: vi.fn().mockRejectedValue(new Error("boundary parse error")),
  } as unknown as Request;
}

afterEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/ootd/analyze", () => {
  it("formData() が失敗したら 500 INTERNAL_ERROR を返す", async () => {
    const res = await POST(makeFailingReq());
    expect(res.status).toBe(500);
    const json = (await res.json()) as { error?: { code?: string } };
    expect(json.error?.code).toBe("INTERNAL_ERROR");
  });

  it("image フィールドがなければ 400 MISSING_FILE を返す", async () => {
    const res = await POST(makeReq(new FormData()));
    expect(res.status).toBe(400);
    const json = (await res.json()) as { error?: { code?: string } };
    expect(json.error?.code).toBe("MISSING_FILE");
  });

  it("許可外の MIME タイプは 400 INVALID_FILE_TYPE を返す", async () => {
    const file = new File(["fake"], "test.svg", { type: "image/svg+xml" });
    const fd = new FormData();
    fd.append("image", file);
    const res = await POST(makeReq(fd));
    expect(res.status).toBe(400);
    const json = (await res.json()) as { error?: { code?: string } };
    expect(json.error?.code).toBe("INVALID_FILE_TYPE");
  });

  it("10MB 超のファイルは 413 FILE_TOO_LARGE を返す", async () => {
    const file = new File(["fake"], "large.jpg", { type: "image/jpeg" });
    Object.defineProperty(file, "size", { value: 10 * 1024 * 1024 + 1 });
    const fd = new FormData();
    fd.append("image", file);
    const res = await POST(makeReq(fd));
    expect(res.status).toBe(413);
    const json = (await res.json()) as { error?: { code?: string } };
    expect(json.error?.code).toBe("FILE_TOO_LARGE");
  });

  it("有効な JPEG ファイルで 200 と分析結果を返す", async () => {
    analyzeOutfitMock.mockResolvedValue(MOCK_RESULT);
    const file = new File([new Uint8Array(10)], "test.jpg", {
      type: "image/jpeg",
    });
    const fd = new FormData();
    fd.append("image", file);
    const res = await POST(makeReq(fd));
    expect(res.status).toBe(200);
    const json = (await res.json()) as { data?: typeof MOCK_RESULT; error: null };
    expect(json.data).toEqual(MOCK_RESULT);
    expect(json.error).toBeNull();
    expect(analyzeOutfitMock).toHaveBeenCalledWith(
      expect.any(String),
      "image/jpeg",
    );
  });

  it("image/jpg は image/jpeg に正規化して analyzeOutfit を呼ぶ", async () => {
    analyzeOutfitMock.mockResolvedValue(MOCK_RESULT);
    const file = new File([new Uint8Array(10)], "photo.jpg", {
      type: "image/jpg",
    });
    const fd = new FormData();
    fd.append("image", file);
    await POST(makeReq(fd));
    expect(analyzeOutfitMock).toHaveBeenCalledWith(
      expect.any(String),
      "image/jpeg",
    );
  });

  it("HEIC ファイルは JPEG 変換後に image/jpeg で analyzeOutfit を呼ぶ", async () => {
    convertHeicToJpegMock.mockResolvedValue(Buffer.from([0xff, 0xd8, 0xff]));
    analyzeOutfitMock.mockResolvedValue(MOCK_RESULT);
    const file = new File([new Uint8Array(10)], "photo.heic", {
      type: "image/heic",
    });
    const fd = new FormData();
    fd.append("image", file);
    const res = await POST(makeReq(fd));
    expect(res.status).toBe(200);
    expect(convertHeicToJpegMock).toHaveBeenCalled();
    expect(analyzeOutfitMock).toHaveBeenCalledWith(
      expect.any(String),
      "image/jpeg",
    );
  });

  it("analyzeOutfit が失敗したら 500 を返し、内部エラーを露出しない", async () => {
    analyzeOutfitMock.mockRejectedValue(new Error("gemini-internal-error"));
    const file = new File([new Uint8Array(10)], "test.jpg", {
      type: "image/jpeg",
    });
    const fd = new FormData();
    fd.append("image", file);
    const res = await POST(makeReq(fd));
    expect(res.status).toBe(500);
    const json = (await res.json()) as {
      error?: { code?: string; message?: string };
    };
    expect(json.error?.code).toBe("INTERNAL_ERROR");
    expect(json.error?.message).not.toContain("gemini-internal-error");
  });
});
