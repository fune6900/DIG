// ---------------------------------------------------------------------------
// ImageSearchUploader のユニットテスト（Red フェーズ）
//
// components/features/search/ImageSearchUploader.tsx（未実装）を検証する。
//
// 検証項目:
//   - 「画像を選択」ボタンが表示される
//   - input[type="file"] に accept="image/*" が付与される
//   - input に capture="environment" 属性が付与される
//   - ファイル選択後にプレビュー画像が表示される
//   - 画像未選択時「解析して検索」ボタンが disabled
//   - 解析中はボタンが disabled + ローディング表示
//   - 解析成功時に router.push で /search?styles=...&colors=... へ遷移
//   - 解析失敗時にエラーメッセージを表示しボタンを再有効化
//   - 「別の画像を選ぶ」でリセットされる
// ---------------------------------------------------------------------------

import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
    back: vi.fn(),
    refresh: vi.fn(),
  }),
}));

const analyzeImageForSearchActionMock = vi.fn();

vi.mock("@/app/actions/image-search", () => ({
  analyzeImageForSearchAction: (...args: unknown[]) =>
    analyzeImageForSearchActionMock(...args),
}));

// upload-url API をモック
const fetchMock = vi.fn();

import { ImageSearchUploader } from "@/components/features/search/ImageSearchUploader";
import type { ColorCategory } from "@/lib/color-catalog";

// ---------------------------------------------------------------------------
// フィクスチャ
// ---------------------------------------------------------------------------

const SUCCESS_RESULT = {
  data: {
    styles: ["ストリートウェア", "カジュアル"],
    colorCategories: ["ネイビー系", "ベージュ系"] as ColorCategory[],
  },
  error: null,
};

function makeJpegFile(name = "outfit.jpg") {
  return new File([new Uint8Array([0xff, 0xd8, 0xff])], name, {
    type: "image/jpeg",
  });
}

function getFileInput(): HTMLInputElement {
  return screen.getByTestId("image-search-file-input") as HTMLInputElement;
}

// ---------------------------------------------------------------------------
// セットアップ
// ---------------------------------------------------------------------------

beforeAll(() => {
  if (typeof URL.createObjectURL !== "function") {
    Object.defineProperty(URL, "createObjectURL", {
      value: () => "blob:mock-preview",
      configurable: true,
    });
  }
  if (typeof URL.revokeObjectURL !== "function") {
    Object.defineProperty(URL, "revokeObjectURL", {
      value: () => {},
      configurable: true,
    });
  }
});

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubGlobal("fetch", fetchMock);
  // upload-url API のデフォルトモック
  fetchMock.mockResolvedValue(
    new Response(
      JSON.stringify({
        signedUrl: "https://supabase.example.com/upload",
        path: "uploads/test.jpg",
        publicUrl: "https://supabase.example.com/public/test.jpg",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    ),
  );
  // /api/upload-url（POST）と Supabase signed URL（PUT）を区別してモックする。
  // 両方 url.includes("upload") にマッチするので、より具体的な /api/upload-url を
  // 先に判定する。
  fetchMock.mockImplementation(async (input: RequestInfo) => {
    const url = typeof input === "string" ? input : (input as Request).url;
    if (url.includes("/api/upload-url")) {
      return new Response(
        JSON.stringify({
          signedUrl: "https://supabase.example.com/upload",
          path: "uploads/test.jpg",
          publicUrl: "https://supabase.example.com/public/test.jpg",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }
    // Supabase signed URL への PUT は空ボディの 200
    return new Response(null, { status: 200 });
  });
});

// ---------------------------------------------------------------------------
// 初期 UI
// ---------------------------------------------------------------------------

describe("ImageSearchUploader — 初期 UI", () => {
  it("「画像を選択」ボタンが表示される", () => {
    render(<ImageSearchUploader />);

    expect(
      screen.getByRole("button", { name: /画像を選択/ }),
    ).toBeInTheDocument();
  });

  it("input[type='file'] が存在し accept='image/*' が付与されている", () => {
    render(<ImageSearchUploader />);

    const input = getFileInput();
    expect(input).toBeInTheDocument();
    expect(input.type).toBe("file");
    expect(input.accept).toBe("image/*");
  });

  it("input に capture='environment' 属性が付与されている（カメラ撮影対応）", () => {
    render(<ImageSearchUploader />);

    const input = getFileInput();
    expect(input.getAttribute("capture")).toBe("environment");
  });

  it("画像未選択時「解析して検索」ボタンが disabled になっている", () => {
    render(<ImageSearchUploader />);

    const searchBtn = screen.getByRole("button", { name: /解析して検索/ });
    expect(searchBtn).toBeDisabled();
  });

  it("初期状態でプレビュー画像は表示されない", () => {
    render(<ImageSearchUploader />);

    expect(screen.queryByRole("img", { name: /プレビュー/ })).toBeNull();
  });

  it("初期状態で「別の画像を選ぶ」ボタンは表示されない", () => {
    render(<ImageSearchUploader />);

    expect(screen.queryByRole("button", { name: /別の画像を選ぶ/ })).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// ファイル選択
// ---------------------------------------------------------------------------

describe("ImageSearchUploader — ファイル選択後", () => {
  it("ファイルを選択するとプレビュー画像が表示される", async () => {
    render(<ImageSearchUploader />);

    fireEvent.change(getFileInput(), { target: { files: [makeJpegFile()] } });

    await waitFor(() => {
      expect(
        screen.getByRole("img", { name: /プレビュー/ }),
      ).toBeInTheDocument();
    });
  });

  it("ファイルを選択すると「解析して検索」ボタンが有効になる", async () => {
    render(<ImageSearchUploader />);

    fireEvent.change(getFileInput(), { target: { files: [makeJpegFile()] } });

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /解析して検索/ }),
      ).not.toBeDisabled();
    });
  });

  it("ファイルを選択すると「別の画像を選ぶ」ボタンが表示される", async () => {
    render(<ImageSearchUploader />);

    fireEvent.change(getFileInput(), { target: { files: [makeJpegFile()] } });

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /別の画像を選ぶ/ }),
      ).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// 解析フロー（成功）
// ---------------------------------------------------------------------------

describe("ImageSearchUploader — 解析成功フロー", () => {
  it("解析中はボタンが disabled になる", async () => {
    // 解析を意図的に遅延させて「解析中」状態を観察する
    analyzeImageForSearchActionMock.mockImplementation(
      () => new Promise(() => {}),
    );

    render(<ImageSearchUploader />);
    fireEvent.change(getFileInput(), { target: { files: [makeJpegFile()] } });

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /解析して検索/ }),
      ).not.toBeDisabled();
    });

    fireEvent.click(screen.getByRole("button", { name: /解析して検索/ }));

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /解析して検索|解析中/ }),
      ).toBeDisabled();
    });
  });

  it("解析中はローディング表示が出る", async () => {
    analyzeImageForSearchActionMock.mockImplementation(
      () => new Promise(() => {}),
    );

    render(<ImageSearchUploader />);
    fireEvent.change(getFileInput(), { target: { files: [makeJpegFile()] } });

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /解析して検索/ }),
      ).not.toBeDisabled();
    });

    fireEvent.click(screen.getByRole("button", { name: /解析して検索/ }));

    await waitFor(() => {
      // ローディング状態: テキスト変化 or aria-busy または role="status" の存在
      const loading =
        screen.queryByText(/解析中/) ??
        screen.queryByRole("status") ??
        document.querySelector("[aria-busy='true']");
      expect(loading).not.toBeNull();
    });
  });

  it("解析成功時に router.push で /search?styles=...&colors=... へ遷移する", async () => {
    analyzeImageForSearchActionMock.mockResolvedValue(SUCCESS_RESULT);

    render(<ImageSearchUploader />);
    fireEvent.change(getFileInput(), { target: { files: [makeJpegFile()] } });

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /解析して検索/ }),
      ).not.toBeDisabled();
    });

    fireEvent.click(screen.getByRole("button", { name: /解析して検索/ }));

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledTimes(1);
    });

    const pushedUrl: string = pushMock.mock.calls[0][0];
    expect(pushedUrl).toMatch(/^\/search\?/);
    expect(pushedUrl).toContain("styles=");
    expect(pushedUrl).toContain("colors=");
  });

  it("遷移先 URL に styles の値がすべて含まれる", async () => {
    analyzeImageForSearchActionMock.mockResolvedValue(SUCCESS_RESULT);

    render(<ImageSearchUploader />);
    fireEvent.change(getFileInput(), { target: { files: [makeJpegFile()] } });

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /解析して検索/ }),
      ).not.toBeDisabled(),
    );
    fireEvent.click(screen.getByRole("button", { name: /解析して検索/ }));

    await waitFor(() => expect(pushMock).toHaveBeenCalled());

    const pushedUrl: string = pushMock.mock.calls[0][0];
    expect(pushedUrl).toContain("ストリートウェア");
    expect(pushedUrl).toContain("カジュアル");
  });

  it("遷移先 URL に colorCategories の値がすべて含まれる", async () => {
    analyzeImageForSearchActionMock.mockResolvedValue(SUCCESS_RESULT);

    render(<ImageSearchUploader />);
    fireEvent.change(getFileInput(), { target: { files: [makeJpegFile()] } });

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /解析して検索/ }),
      ).not.toBeDisabled(),
    );
    fireEvent.click(screen.getByRole("button", { name: /解析して検索/ }));

    await waitFor(() => expect(pushMock).toHaveBeenCalled());

    const pushedUrl: string = pushMock.mock.calls[0][0];
    expect(pushedUrl).toContain("ネイビー系");
    expect(pushedUrl).toContain("ベージュ系");
  });
});

// ---------------------------------------------------------------------------
// 解析フロー（失敗）
// ---------------------------------------------------------------------------

describe("ImageSearchUploader — 解析失敗フロー", () => {
  it("解析失敗時にエラーメッセージが表示される", async () => {
    analyzeImageForSearchActionMock.mockResolvedValue({
      data: null,
      error: { code: "ANALYSIS_FAILED", message: "解析に失敗しました" },
    });

    render(<ImageSearchUploader />);
    fireEvent.change(getFileInput(), { target: { files: [makeJpegFile()] } });

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /解析して検索/ }),
      ).not.toBeDisabled(),
    );
    fireEvent.click(screen.getByRole("button", { name: /解析して検索/ }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
  });

  it("解析失敗後は「解析して検索」ボタンが再び有効になる", async () => {
    analyzeImageForSearchActionMock.mockResolvedValue({
      data: null,
      error: { code: "ANALYSIS_FAILED", message: "解析に失敗しました" },
    });

    render(<ImageSearchUploader />);
    fireEvent.change(getFileInput(), { target: { files: [makeJpegFile()] } });

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /解析して検索/ }),
      ).not.toBeDisabled(),
    );
    fireEvent.click(screen.getByRole("button", { name: /解析して検索/ }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });

    expect(
      screen.getByRole("button", { name: /解析して検索/ }),
    ).not.toBeDisabled();
  });

  it("解析失敗後に router.push は呼ばれない", async () => {
    analyzeImageForSearchActionMock.mockResolvedValue({
      data: null,
      error: { code: "ANALYSIS_FAILED", message: "解析に失敗しました" },
    });

    render(<ImageSearchUploader />);
    fireEvent.change(getFileInput(), { target: { files: [makeJpegFile()] } });

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /解析して検索/ }),
      ).not.toBeDisabled(),
    );
    fireEvent.click(screen.getByRole("button", { name: /解析して検索/ }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });

    expect(pushMock).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// リセット
// ---------------------------------------------------------------------------

describe("ImageSearchUploader — リセット（別の画像を選ぶ）", () => {
  it("「別の画像を選ぶ」クリックでプレビューが消える", async () => {
    render(<ImageSearchUploader />);
    fireEvent.change(getFileInput(), { target: { files: [makeJpegFile()] } });

    await waitFor(() => {
      expect(
        screen.getByRole("img", { name: /プレビュー/ }),
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /別の画像を選ぶ/ }));

    await waitFor(() => {
      expect(screen.queryByRole("img", { name: /プレビュー/ })).toBeNull();
    });
  });

  it("「別の画像を選ぶ」クリックで「解析して検索」ボタンが再び disabled になる", async () => {
    render(<ImageSearchUploader />);
    fireEvent.change(getFileInput(), { target: { files: [makeJpegFile()] } });

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /解析して検索/ }),
      ).not.toBeDisabled(),
    );

    fireEvent.click(screen.getByRole("button", { name: /別の画像を選ぶ/ }));

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /解析して検索/ }),
      ).toBeDisabled();
    });
  });

  it("「別の画像を選ぶ」クリックでエラーメッセージがリセットされる", async () => {
    analyzeImageForSearchActionMock.mockResolvedValue({
      data: null,
      error: { code: "ANALYSIS_FAILED", message: "解析に失敗しました" },
    });

    render(<ImageSearchUploader />);
    fireEvent.change(getFileInput(), { target: { files: [makeJpegFile()] } });

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /解析して検索/ }),
      ).not.toBeDisabled(),
    );
    fireEvent.click(screen.getByRole("button", { name: /解析して検索/ }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });

    // 別ファイルを選択してリセット
    fireEvent.change(getFileInput(), {
      target: { files: [makeJpegFile("outfit2.jpg")] },
    });

    await waitFor(() => {
      expect(screen.queryByRole("alert")).toBeNull();
    });
  });
});
