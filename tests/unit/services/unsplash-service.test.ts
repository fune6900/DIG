// ---------------------------------------------------------------------------
// unsplash-service のユニットテスト
//
// fetch を vi.stubGlobal でモックして外部通信を完全遮断する。
// URL 組み立て・Authorization ヘッダ・クエリ補強・エラーハンドリングを検証する。
// ---------------------------------------------------------------------------

import { searchUnsplashPhotos } from "@/services/unsplash-service";

const MOCK_ACCESS_KEY = "test-access-key-12345";

// ---------------------------------------------------------------------------
// フィクスチャ
// ---------------------------------------------------------------------------
const makeUnsplashApiResponse = (
  overrides: Partial<{
    total: number;
    total_pages: number;
    results: unknown[];
  }> = {},
) => ({
  total: overrides.total ?? 100,
  total_pages: overrides.total_pages ?? 4,
  results: overrides.results ?? [
    {
      id: "photo-abc",
      urls: {
        regular: "https://images.unsplash.com/photo-abc/regular",
        small: "https://images.unsplash.com/photo-abc/small",
      },
      description: "A stylish outfit photo",
      alt_description: "Person wearing denim jacket",
      user: {
        name: "Jane Doe",
        links: { html: "https://unsplash.com/@janedoe" },
      },
      links: { html: "https://unsplash.com/photos/photo-abc" },
      tags: [{ title: "fashion" }, { title: "denim" }],
    },
  ],
});

// ---------------------------------------------------------------------------
// セットアップ
// ---------------------------------------------------------------------------
beforeEach(() => {
  vi.unstubAllGlobals();
  vi.stubEnv("UNSPLASH_ACCESS_KEY", MOCK_ACCESS_KEY);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

// ---------------------------------------------------------------------------
// URL 組み立て
// ---------------------------------------------------------------------------
describe("searchUnsplashPhotos — URL 組み立て", () => {
  it("Unsplash search/photos エンドポイントを叩く", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify(makeUnsplashApiResponse()), {
          status: 200,
        }),
      );
    vi.stubGlobal("fetch", fetchMock);

    await searchUnsplashPhotos({ query: "denim jacket", page: 1, perPage: 30 });

    const calledUrl: string = fetchMock.mock.calls[0][0];
    expect(calledUrl).toContain("https://api.unsplash.com/search/photos");
  });

  it("query パラメータが URL に含まれる", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify(makeUnsplashApiResponse()), {
          status: 200,
        }),
      );
    vi.stubGlobal("fetch", fetchMock);

    await searchUnsplashPhotos({ query: "M-65", page: 1, perPage: 30 });

    const calledUrl: string = fetchMock.mock.calls[0][0];
    expect(calledUrl).toContain("query=");
  });

  it("query に 'outfit fashion' サフィックスが付与される", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify(makeUnsplashApiResponse()), {
          status: 200,
        }),
      );
    vi.stubGlobal("fetch", fetchMock);

    await searchUnsplashPhotos({ query: "denim", page: 1, perPage: 30 });

    const calledUrl: string = fetchMock.mock.calls[0][0];
    // エンコードされた形で "outfit" と "fashion" が含まれること
    const decodedUrl = decodeURIComponent(calledUrl);
    expect(decodedUrl).toContain("outfit");
    expect(decodedUrl).toContain("fashion");
  });

  it("page パラメータが URL に含まれる", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify(makeUnsplashApiResponse()), {
          status: 200,
        }),
      );
    vi.stubGlobal("fetch", fetchMock);

    await searchUnsplashPhotos({ query: "jacket", page: 3, perPage: 30 });

    const calledUrl: string = fetchMock.mock.calls[0][0];
    expect(calledUrl).toContain("page=3");
  });

  it("per_page パラメータが URL に含まれる", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify(makeUnsplashApiResponse()), {
          status: 200,
        }),
      );
    vi.stubGlobal("fetch", fetchMock);

    await searchUnsplashPhotos({ query: "jacket", page: 1, perPage: 20 });

    const calledUrl: string = fetchMock.mock.calls[0][0];
    expect(calledUrl).toContain("per_page=20");
  });
});

// ---------------------------------------------------------------------------
// Authorization ヘッダ
// ---------------------------------------------------------------------------
describe("searchUnsplashPhotos — Authorization ヘッダ", () => {
  it("Authorization ヘッダに 'Client-ID <UNSPLASH_ACCESS_KEY>' を設定する", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify(makeUnsplashApiResponse()), {
          status: 200,
        }),
      );
    vi.stubGlobal("fetch", fetchMock);

    await searchUnsplashPhotos({ query: "jacket", page: 1, perPage: 30 });

    const calledOptions: RequestInit = fetchMock.mock.calls[0][1];
    const headers = calledOptions.headers as Record<string, string>;
    expect(headers["Authorization"]).toBe(`Client-ID ${MOCK_ACCESS_KEY}`);
  });
});

// ---------------------------------------------------------------------------
// 成功時のレスポンス
// ---------------------------------------------------------------------------
describe("searchUnsplashPhotos — 成功時", () => {
  it("photos 配列と totalPages を返す", async () => {
    const apiResponse = makeUnsplashApiResponse({ total_pages: 5 });
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify(apiResponse), { status: 200 }),
      );
    vi.stubGlobal("fetch", fetchMock);

    const result = await searchUnsplashPhotos({
      query: "denim jacket",
      page: 1,
      perPage: 30,
    });

    expect(result.photos).toHaveLength(1);
    expect(result.totalPages).toBe(5);
  });

  it("photos の各要素に id / urls / user が含まれる", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify(makeUnsplashApiResponse()), {
          status: 200,
        }),
      );
    vi.stubGlobal("fetch", fetchMock);

    const result = await searchUnsplashPhotos({
      query: "jacket",
      page: 1,
      perPage: 30,
    });

    const photo = result.photos[0];
    expect(photo).toHaveProperty("id");
    expect(photo).toHaveProperty("urls");
    expect(photo).toHaveProperty("user");
  });

  it("results が空配列のとき photos は空配列で totalPages は 0 を返す", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(
          JSON.stringify(
            makeUnsplashApiResponse({ results: [], total_pages: 0 }),
          ),
          { status: 200 },
        ),
      );
    vi.stubGlobal("fetch", fetchMock);

    const result = await searchUnsplashPhotos({
      query: "nonexistent",
      page: 1,
      perPage: 30,
    });

    expect(result.photos).toHaveLength(0);
    expect(result.totalPages).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// エラーハンドリング
// ---------------------------------------------------------------------------
describe("searchUnsplashPhotos — HTTP エラー", () => {
  it("HTTP 401 のとき Error をスローする", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ errors: ["Unauthorized"] }), {
        status: 401,
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      searchUnsplashPhotos({ query: "jacket", page: 1, perPage: 30 }),
    ).rejects.toThrow();
  });

  it("HTTP 403 のとき Error をスローする", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ errors: ["Forbidden"] }), {
          status: 403,
        }),
      );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      searchUnsplashPhotos({ query: "jacket", page: 1, perPage: 30 }),
    ).rejects.toThrow();
  });

  it("HTTP 429 (レート制限) のとき Error をスローする", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ errors: ["Rate limit exceeded"] }), {
        status: 429,
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      searchUnsplashPhotos({ query: "jacket", page: 1, perPage: 30 }),
    ).rejects.toThrow();
  });

  it("HTTP 500 のとき Error をスローする", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ errors: ["Internal server error"] }), {
        status: 500,
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      searchUnsplashPhotos({ query: "jacket", page: 1, perPage: 30 }),
    ).rejects.toThrow();
  });
});

describe("searchUnsplashPhotos — ネットワークエラー", () => {
  it("fetch がネットワークエラーで reject したとき Error が伝播する", async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValue(new TypeError("Failed to fetch"));
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      searchUnsplashPhotos({ query: "jacket", page: 1, perPage: 30 }),
    ).rejects.toThrow("Failed to fetch");
  });
});
