// ---------------------------------------------------------------------------
// SearchPage — 画像検索フロー統合テスト
//
// 検索結果画面に画像ピッカーシートが統合され、
//   1. 『画像で検索』ボタンを押すとシートが開く
//   2. シートでアルバム選択した画像を渡すと、アップロード→解析→検索結果遷移
//   3. 解析中はオーバーレイ（aria-busy）が表示される
//   4. 解析失敗時はエラーが表示される
// を検証する。
// ---------------------------------------------------------------------------

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ColorCategory } from "@/lib/color-catalog";

// ---------------------------------------------------------------------------
// モック群
// ---------------------------------------------------------------------------

const useInfiniteSnapSearchMock = vi.fn();

vi.mock("@/hooks/useInfiniteSnapSearch", () => ({
  useInfiniteSnapSearch: (params: unknown) => useInfiniteSnapSearchMock(params),
}));

const pushMock = vi.fn();
const mockSearchParams = { get: vi.fn() };

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, replace: vi.fn() }),
  useSearchParams: () => mockSearchParams,
  usePathname: () => "/search",
}));

const analyzeImageForSearchActionMock = vi.fn();
vi.mock("@/app/actions/image-search", () => ({
  analyzeImageForSearchAction: (...args: unknown[]) =>
    analyzeImageForSearchActionMock(...args),
}));

const uploadImageToStorageMock = vi.fn();
vi.mock("@/lib/upload-image-client", () => ({
  uploadImageToStorage: (...args: unknown[]) =>
    uploadImageToStorageMock(...args),
  buildImageSearchUrl: (styles: string[], colors: string[]) => {
    const parts: string[] = [];
    if (styles.length) parts.push(`styles=${styles.join(",")}`);
    if (colors.length) parts.push(`colors=${colors.join(",")}`);
    return parts.length ? `/search?${parts.join("&")}` : "/search";
  },
}));

import { SearchPage } from "@/components/features/search/SearchPage";

// ---------------------------------------------------------------------------
// フィクスチャ
// ---------------------------------------------------------------------------

const defaultSearchReturn = {
  data: undefined,
  hasNextPage: false,
  isFetchingNextPage: false,
  isPending: false,
  fetchNextPage: vi.fn(),
};

const SUCCESS_ANALYSIS = {
  data: {
    styles: ["ストリートウェア"],
    colorCategories: ["ネイビー系"] as ColorCategory[],
  },
  error: null,
};

function makeJpegFile() {
  return new File([new Uint8Array([0xff, 0xd8, 0xff])], "test.jpg", {
    type: "image/jpeg",
  });
}

// ---------------------------------------------------------------------------
// セットアップ
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.resetAllMocks();
  mockSearchParams.get.mockReturnValue(null);
  useInfiniteSnapSearchMock.mockReturnValue(defaultSearchReturn);
  uploadImageToStorageMock.mockResolvedValue(
    "https://supabase.example.com/public/test.jpg",
  );
});

// ---------------------------------------------------------------------------
// テスト
// ---------------------------------------------------------------------------

describe("SearchPage — 画像検索シート", () => {
  it("初期状態でシートは開いていない", () => {
    render(<SearchPage />);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("『画像で検索』ボタンを押すとシートが開く", async () => {
    render(<SearchPage />);

    await userEvent.click(screen.getByRole("button", { name: /画像で検索/ }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /アルバムから選択/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /カメラで撮影/ }),
    ).toBeInTheDocument();
  });
});

describe("SearchPage — 画像選択後の解析フロー", () => {
  it("画像を選ぶとアップロード→解析→/search?... へ遷移する", async () => {
    analyzeImageForSearchActionMock.mockResolvedValue(SUCCESS_ANALYSIS);

    render(<SearchPage />);

    await userEvent.click(screen.getByRole("button", { name: /画像で検索/ }));

    const albumInput = screen.getByTestId(
      "image-search-album-input",
    ) as HTMLInputElement;
    fireEvent.change(albumInput, { target: { files: [makeJpegFile()] } });

    await waitFor(() => {
      expect(uploadImageToStorageMock).toHaveBeenCalledTimes(1);
    });
    await waitFor(() => {
      expect(analyzeImageForSearchActionMock).toHaveBeenCalledTimes(1);
    });
    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledTimes(1);
    });

    const pushedUrl: string = pushMock.mock.calls[0][0];
    expect(pushedUrl).toContain("styles=");
    expect(pushedUrl).toContain("colors=");
    const url = new URL(pushedUrl, "http://x");
    expect(url.searchParams.get("styles")).toBe("ストリートウェア");
    expect(url.searchParams.get("colors")).toBe("ネイビー系");
  });

  it("画像検索成功後にテキスト検索の query state がクリアされる", async () => {
    mockSearchParams.get.mockImplementation((key: string) =>
      key === "query" ? "hoge" : null,
    );
    analyzeImageForSearchActionMock.mockResolvedValue(SUCCESS_ANALYSIS);

    render(<SearchPage />);

    expect(screen.getByRole("textbox")).toHaveValue("hoge");

    await userEvent.click(screen.getByRole("button", { name: /画像で検索/ }));
    const albumInput = screen.getByTestId(
      "image-search-album-input",
    ) as HTMLInputElement;
    fireEvent.change(albumInput, { target: { files: [makeJpegFile()] } });

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.getByRole("textbox")).toHaveValue("");
    });
  });

  it("画像選択直後にシートは閉じる（中間プレビューなし）", async () => {
    analyzeImageForSearchActionMock.mockImplementation(
      () => new Promise(() => {}),
    );

    render(<SearchPage />);

    await userEvent.click(screen.getByRole("button", { name: /画像で検索/ }));

    const albumInput = screen.getByTestId(
      "image-search-album-input",
    ) as HTMLInputElement;
    fireEvent.change(albumInput, { target: { files: [makeJpegFile()] } });

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).toBeNull();
    });
  });

  it("解析中は aria-busy なオーバーレイが表示される", async () => {
    analyzeImageForSearchActionMock.mockImplementation(
      () => new Promise(() => {}),
    );

    render(<SearchPage />);

    await userEvent.click(screen.getByRole("button", { name: /画像で検索/ }));
    const albumInput = screen.getByTestId(
      "image-search-album-input",
    ) as HTMLInputElement;
    fireEvent.change(albumInput, { target: { files: [makeJpegFile()] } });

    await waitFor(() => {
      const busy = document.querySelector("[aria-busy='true']");
      expect(busy).not.toBeNull();
    });
  });

  it("解析失敗時にエラーアラートが表示される", async () => {
    analyzeImageForSearchActionMock.mockResolvedValue({
      data: null,
      error: { code: "ANALYSIS_FAILED", message: "解析に失敗しました" },
    });

    render(<SearchPage />);

    await userEvent.click(screen.getByRole("button", { name: /画像で検索/ }));
    const albumInput = screen.getByTestId(
      "image-search-album-input",
    ) as HTMLInputElement;
    fireEvent.change(albumInput, { target: { files: [makeJpegFile()] } });

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("アップロード失敗時にエラーアラートが表示される", async () => {
    uploadImageToStorageMock.mockRejectedValue(new Error("network down"));

    render(<SearchPage />);

    await userEvent.click(screen.getByRole("button", { name: /画像で検索/ }));
    const albumInput = screen.getByTestId(
      "image-search-album-input",
    ) as HTMLInputElement;
    fireEvent.change(albumInput, { target: { files: [makeJpegFile()] } });

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
    expect(analyzeImageForSearchActionMock).not.toHaveBeenCalled();
    expect(pushMock).not.toHaveBeenCalled();
  });
});
