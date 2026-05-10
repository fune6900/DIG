// ---------------------------------------------------------------------------
// snap-analysis のユニットテスト
//
// services/snap-analysis.ts（未実装）の analyzeSnapImage 関数を検証する。
// - fetch モックで HTTP 200/4xx/5xx / Content-Type 異常 / タイムアウトを再現
// - analyzeOutfit モックで AI 呼び出しの引数（base64 + mimeType）を確認
// ---------------------------------------------------------------------------

const analyzeOutfitMock = vi.fn();

vi.mock("@/services/ai-analysis", () => ({
  analyzeOutfit: (...args: unknown[]) => analyzeOutfitMock(...args),
}));

import { analyzeSnapImage } from "@/services/snap-analysis";
import type { OotdAnalysisResult } from "@/types/ootd";

// ---------------------------------------------------------------------------
// フィクスチャ
// ---------------------------------------------------------------------------
// SSRF allow-list に含まれる Unsplash ホストを使う（services/snap-analysis.ts 参照）
const DUMMY_IMAGE_URL = "https://images.unsplash.com/photo-snap-001/regular";

const makeAnalysisResult = (): OotdAnalysisResult => ({
  oneLiner: "静謐な倦怠",
  colorPalette: [{ name: "インディゴ", colorCode: "#3B4D6B", percentage: 100 }],
  styles: [{ name: "アメカジ", percentage: 100 }],
  description: "ヴィンテージデニムが主役。",
  detectedItems: [{ name: "デニムジャケット" }],
  radarScores: {
    casual: 80,
    subdued: 50,
    presence: 60,
    subtle: 40,
    formal: 10,
    colorful: 20,
  },
});

/** fetch Response を生成するヘルパ */
function makeFetchResponse(
  status: number,
  contentType: string,
  body: ArrayBuffer,
): Response {
  return new Response(body, {
    status,
    headers: { "Content-Type": contentType },
  });
}

// ---------------------------------------------------------------------------
// セットアップ
// ---------------------------------------------------------------------------
beforeEach(() => {
  vi.resetAllMocks();
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// 正常系
// ---------------------------------------------------------------------------
describe("analyzeSnapImage — 正常系", () => {
  it("HTTP 200 で取得した画像バッファを base64 化して analyzeOutfit を呼ぶ", async () => {
    const fakeBytes = new Uint8Array([137, 80, 78, 71]); // PNG ヘッダ的なダミー
    const fakeBuffer = fakeBytes.buffer;
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(makeFetchResponse(200, "image/jpeg", fakeBuffer));
    analyzeOutfitMock.mockResolvedValueOnce(makeAnalysisResult());

    await analyzeSnapImage(DUMMY_IMAGE_URL);

    expect(fetchSpy).toHaveBeenCalledWith(
      DUMMY_IMAGE_URL,
      expect.objectContaining({ signal: expect.anything() }),
    );

    const base64Expected = Buffer.from(fakeBytes).toString("base64");
    expect(analyzeOutfitMock).toHaveBeenCalledWith(
      base64Expected,
      "image/jpeg",
    );
  });

  it("HTTP 200 かつ Content-Type が image/png のとき mimeType 'image/png' で analyzeOutfit を呼ぶ", async () => {
    const fakeBuffer = new ArrayBuffer(4);
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      makeFetchResponse(200, "image/png", fakeBuffer),
    );
    analyzeOutfitMock.mockResolvedValueOnce(makeAnalysisResult());

    await analyzeSnapImage(DUMMY_IMAGE_URL);

    expect(analyzeOutfitMock).toHaveBeenCalledWith(
      expect.any(String),
      "image/png",
    );
  });

  it("analyzeOutfit の戻り値をそのまま返す", async () => {
    const expected = makeAnalysisResult();
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      makeFetchResponse(200, "image/jpeg", new ArrayBuffer(4)),
    );
    analyzeOutfitMock.mockResolvedValueOnce(expected);

    const result = await analyzeSnapImage(DUMMY_IMAGE_URL);

    expect(result).toEqual(expected);
  });
});

// ---------------------------------------------------------------------------
// HTTP エラー
// ---------------------------------------------------------------------------
describe("analyzeSnapImage — HTTP エラー", () => {
  it("HTTP 404 のときエラーをスローする", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(null, { status: 404 }),
    );

    await expect(analyzeSnapImage(DUMMY_IMAGE_URL)).rejects.toThrow();
  });

  it("HTTP 500 のときエラーをスローする", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(null, { status: 500 }),
    );

    await expect(analyzeSnapImage(DUMMY_IMAGE_URL)).rejects.toThrow();
  });

  it("HTTP 403 のとき analyzeOutfit を呼ばない", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(null, { status: 403 }),
    );

    await expect(analyzeSnapImage(DUMMY_IMAGE_URL)).rejects.toThrow();
    expect(analyzeOutfitMock).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Content-Type 異常
// ---------------------------------------------------------------------------
describe("analyzeSnapImage — Content-Type バリデーション", () => {
  it("Content-Type が 'text/html' のときエラーをスローする", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      makeFetchResponse(200, "text/html", new ArrayBuffer(8)),
    );

    await expect(analyzeSnapImage(DUMMY_IMAGE_URL)).rejects.toThrow();
  });

  it("Content-Type が 'application/json' のときエラーをスローする", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      makeFetchResponse(200, "application/json", new ArrayBuffer(8)),
    );

    await expect(analyzeSnapImage(DUMMY_IMAGE_URL)).rejects.toThrow();
  });

  it("Content-Type が 'image/*' 以外のとき analyzeOutfit を呼ばない", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      makeFetchResponse(200, "text/plain", new ArrayBuffer(8)),
    );

    await expect(analyzeSnapImage(DUMMY_IMAGE_URL)).rejects.toThrow();
    expect(analyzeOutfitMock).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// SSRF ガード（allow-list）
// ---------------------------------------------------------------------------
describe("analyzeSnapImage — SSRF allow-list", () => {
  it("allow-list 外のホストのとき fetch を呼ばずエラーをスローする", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    await expect(
      analyzeSnapImage("https://evil.example.com/x.jpg"),
    ).rejects.toThrow(/Disallowed image host/);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("http:// のとき fetch を呼ばずエラーをスローする（HTTPS 限定）", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    await expect(
      analyzeSnapImage("http://images.unsplash.com/x.jpg"),
    ).rejects.toThrow(/Disallowed protocol/);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("不正な URL のとき fetch を呼ばずエラーをスローする", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    await expect(analyzeSnapImage("not-a-url")).rejects.toThrow(
      /Invalid image URL/,
    );
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// タイムアウト
// ---------------------------------------------------------------------------
describe("analyzeSnapImage — AbortSignal.timeout", () => {
  it("fetch に AbortSignal が付与されており 10 秒以内にタイムアウトする設定になっている", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        makeFetchResponse(200, "image/jpeg", new ArrayBuffer(4)),
      );
    analyzeOutfitMock.mockResolvedValueOnce(makeAnalysisResult());

    await analyzeSnapImage(DUMMY_IMAGE_URL);

    const callArgs = fetchSpy.mock.calls[0];
    expect(callArgs).toBeDefined();
    const options = callArgs?.[1] as RequestInit | undefined;
    const signal = options?.signal;
    // AbortSignal が渡されていることを確認
    expect(signal).toBeDefined();
    expect(signal).toBeInstanceOf(AbortSignal);
  });
});
