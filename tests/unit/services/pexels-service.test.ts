// ---------------------------------------------------------------------------
// pexels-service のユニットテスト
//
// fetch を vi.stubGlobal でモックして外部通信を完全遮断する。
// Pexels API は Unsplash と並列で呼ぶため、片方失敗を許容できるよう
// すべての失敗パスで { photos: [], totalPages: 0 } を返す設計を検証する。
// ---------------------------------------------------------------------------

import { searchPexelsPhotos } from "@/services/pexels-service";

const MOCK_ACCESS_KEY = "pexels-test-key-xyz";

const makePexelsApiResponse = (
  overrides: Partial<{
    total_results: number;
    per_page: number;
    page: number;
    photos: unknown[];
  }> = {},
) => ({
  total_results: overrides.total_results ?? 100,
  per_page: overrides.per_page ?? 30,
  page: overrides.page ?? 1,
  next_page: "https://api.pexels.com/v1/search?page=2",
  photos: overrides.photos ?? [
    {
      id: 12345,
      width: 1200,
      height: 1600,
      url: "https://www.pexels.com/photo/sample-12345/",
      photographer: "Sample Photographer",
      photographer_url: "https://www.pexels.com/@sample",
      photographer_id: 99,
      src: {
        original: "https://images.pexels.com/photos/12345/orig.jpg",
        large: "https://images.pexels.com/photos/12345/large.jpg",
        medium: "https://images.pexels.com/photos/12345/medium.jpg",
      },
      alt: "A model in monotone outfit",
    },
  ],
});

beforeEach(() => {
  vi.unstubAllGlobals();
  vi.stubEnv("PEXELS_API_KEY", MOCK_ACCESS_KEY);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("searchPexelsPhotos — URL / ヘッダ", () => {
  it("Pexels v1/search エンドポイントを叩く", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify(makePexelsApiResponse()), { status: 200 }),
      );
    vi.stubGlobal("fetch", fetchMock);

    await searchPexelsPhotos({ query: "denim", page: 1, perPage: 30 });

    const calledUrl: string = fetchMock.mock.calls[0][0];
    expect(calledUrl).toContain("https://api.pexels.com/v1/search");
  });

  it("query / page / per_page が URL に含まれる", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify(makePexelsApiResponse()), { status: 200 }),
      );
    vi.stubGlobal("fetch", fetchMock);

    await searchPexelsPhotos({ query: "denim", page: 3, perPage: 20 });

    const calledUrl: string = fetchMock.mock.calls[0][0];
    expect(calledUrl).toContain("query=");
    expect(calledUrl).toContain("page=3");
    expect(calledUrl).toContain("per_page=20");
  });

  it("query に fashion 系のサフィックスが付与される（検索精度補強）", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify(makePexelsApiResponse()), { status: 200 }),
      );
    vi.stubGlobal("fetch", fetchMock);

    await searchPexelsPhotos({ query: "denim", page: 1, perPage: 30 });

    const calledUrl: string = fetchMock.mock.calls[0][0];
    const decoded = decodeURIComponent(calledUrl.replace(/\+/g, " "));
    expect(decoded.toLowerCase()).toContain("fashion");
  });

  it("Authorization ヘッダに API キーを直接設定する（Bearer 無し）", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify(makePexelsApiResponse()), { status: 200 }),
      );
    vi.stubGlobal("fetch", fetchMock);

    await searchPexelsPhotos({ query: "denim", page: 1, perPage: 30 });

    const calledOptions: RequestInit = fetchMock.mock.calls[0][1];
    const headers = calledOptions.headers as Record<string, string>;
    expect(headers["Authorization"]).toBe(MOCK_ACCESS_KEY);
  });
});

describe("searchPexelsPhotos — 成功時", () => {
  it("photos 配列と totalPages を返す", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(
          JSON.stringify(
            makePexelsApiResponse({ total_results: 60, per_page: 30 }),
          ),
          { status: 200 },
        ),
      );
    vi.stubGlobal("fetch", fetchMock);

    const result = await searchPexelsPhotos({
      query: "denim",
      page: 1,
      perPage: 30,
    });

    expect(result.photos).toHaveLength(1);
    // total_results 60 / per_page 30 → 2 ページ
    expect(result.totalPages).toBe(2);
  });

  it("photos の各要素に id / src.large / photographer が含まれる", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify(makePexelsApiResponse()), { status: 200 }),
      );
    vi.stubGlobal("fetch", fetchMock);

    const result = await searchPexelsPhotos({
      query: "denim",
      page: 1,
      perPage: 30,
    });

    const photo = result.photos[0];
    expect(photo).toHaveProperty("id");
    expect(photo.src).toHaveProperty("large");
    expect(photo).toHaveProperty("photographer");
  });
});

describe("searchPexelsPhotos — フォールバック（throws しない）", () => {
  it("PEXELS_API_KEY 未設定なら fetch を叩かず空結果を返す", async () => {
    vi.unstubAllEnvs();
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const result = await searchPexelsPhotos({
      query: "denim",
      page: 1,
      perPage: 30,
    });

    expect(result).toEqual({ photos: [], totalPages: 0 });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("HTTP 401/403/429/500 はすべて空結果を返す", async () => {
    for (const status of [401, 403, 429, 500]) {
      const fetchMock = vi
        .fn()
        .mockResolvedValue(new Response("err", { status }));
      vi.stubGlobal("fetch", fetchMock);

      const result = await searchPexelsPhotos({
        query: "denim",
        page: 1,
        perPage: 30,
      });

      expect(result).toEqual({ photos: [], totalPages: 0 });
    }
  });

  it("fetch が reject したとき空結果を返す（throws しない）", async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValue(new TypeError("Failed to fetch"));
    vi.stubGlobal("fetch", fetchMock);

    const result = await searchPexelsPhotos({
      query: "denim",
      page: 1,
      perPage: 30,
    });

    expect(result).toEqual({ photos: [], totalPages: 0 });
  });

  it("レスポンスの photos が想定形式と異なる要素を含むとき、その要素はスキップされる", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify(
          makePexelsApiResponse({
            photos: [
              // 有効
              {
                id: 1,
                width: 100,
                height: 100,
                url: "https://www.pexels.com/photo/1/",
                photographer: "A",
                photographer_url: "https://www.pexels.com/@a",
                photographer_id: 1,
                src: {
                  original: "https://images.pexels.com/photos/1/orig.jpg",
                  large: "https://images.pexels.com/photos/1/large.jpg",
                  medium: "https://images.pexels.com/photos/1/medium.jpg",
                },
                alt: "ok",
              },
              // 不正 (src 欠落)
              { id: 2, photographer: "B" },
            ],
          }),
        ),
        { status: 200 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await searchPexelsPhotos({
      query: "denim",
      page: 1,
      perPage: 30,
    });

    expect(result.photos).toHaveLength(1);
    expect(result.photos[0].id).toBe(1);
  });

  it("レスポンスが JSON として壊れているとき空結果を返す", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response("not json", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await searchPexelsPhotos({
      query: "denim",
      page: 1,
      perPage: 30,
    });

    expect(result).toEqual({ photos: [], totalPages: 0 });
  });
});
