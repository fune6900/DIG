// ---------------------------------------------------------------------------
// lib/image-compress の振る舞いを検証する。
// - calculateResizedDimensions: アスペクト比維持・上限縮小・拡大しない
// - compressImage: 既に十分小さい JPEG は再エンコードしない
// - compressImage: 大きい画像は max edge 1920 / quality 0.85 で JPEG 化する
//
// 注: jsdom には canvas/Image の実体が無いため、必要箇所をモックする。
//     外部 I/O ではないが、ブラウザ API のみのコードはモック許可（外部API扱い）。
// ---------------------------------------------------------------------------

import {
  calculateResizedDimensions,
  compressImage,
} from "@/lib/image-compress";

describe("calculateResizedDimensions", () => {
  it("max edge より大きい横長画像は max edge を長辺に縮小する", () => {
    expect(calculateResizedDimensions(4000, 3000, 1920)).toEqual({
      width: 1920,
      height: 1440,
    });
  });

  it("max edge より大きい縦長画像は max edge を長辺に縮小する", () => {
    expect(calculateResizedDimensions(3000, 4000, 1920)).toEqual({
      width: 1440,
      height: 1920,
    });
  });

  it("max edge と等しい画像はそのまま返す", () => {
    expect(calculateResizedDimensions(1920, 1080, 1920)).toEqual({
      width: 1920,
      height: 1080,
    });
  });

  it("max edge より小さい画像は拡大せずそのまま返す", () => {
    expect(calculateResizedDimensions(1000, 500, 1920)).toEqual({
      width: 1000,
      height: 500,
    });
  });

  it("正方形画像は両辺を max edge に揃える", () => {
    expect(calculateResizedDimensions(3000, 3000, 1920)).toEqual({
      width: 1920,
      height: 1920,
    });
  });

  it("結果の寸法は整数に丸められる", () => {
    const r = calculateResizedDimensions(1921, 1080, 1920);
    expect(Number.isInteger(r.width)).toBe(true);
    expect(Number.isInteger(r.height)).toBe(true);
  });
});

describe("compressImage (skip path)", () => {
  it("既に上限以下の JPEG はそのまま返す（再エンコードしない）", async () => {
    const small = new File(["x".repeat(100)], "small.jpg", {
      type: "image/jpeg",
    });
    const result = await compressImage(small, {
      maxSizeBytes: 2 * 1024 * 1024,
    });
    expect(result).toBe(small);
  });

  it("image/jpg (非標準) の MIME でもサイズ以下ならスキップする", async () => {
    const small = new File(["x".repeat(100)], "small.jpg", {
      type: "image/jpg",
    });
    const result = await compressImage(small, {
      maxSizeBytes: 2 * 1024 * 1024,
    });
    expect(result).toBe(small);
  });
});

describe("compressImage (compress path)", () => {
  // canvas / Image / URL.createObjectURL を最低限モックする
  const ORIGINAL_CREATE_OBJECT_URL = global.URL.createObjectURL;
  const ORIGINAL_REVOKE_OBJECT_URL = global.URL.revokeObjectURL;
  const ORIGINAL_IMAGE = global.Image;

  beforeEach(() => {
    global.URL.createObjectURL = vi.fn(() => "blob:mock");
    global.URL.revokeObjectURL = vi.fn();

    // Image: src を代入したら次のティックで onload を発火する偽物
    class FakeImage {
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      width = 4000;
      height = 3000;
      private _src = "";
      get src() {
        return this._src;
      }
      set src(value: string) {
        this._src = value;
        queueMicrotask(() => this.onload?.());
      }
    }
    // @ts-expect-error テスト用差し替え
    global.Image = FakeImage;

    // canvas.getContext / toBlob の偽実装
    const fakeCtx = {
      drawImage: vi.fn(),
      imageSmoothingEnabled: true,
      imageSmoothingQuality: "high",
    };
    HTMLCanvasElement.prototype.getContext = vi.fn(
      () => fakeCtx,
    ) as unknown as HTMLCanvasElement["getContext"];
    HTMLCanvasElement.prototype.toBlob = function (
      cb: BlobCallback,
      type?: string,
    ) {
      // 圧縮後の小さい Blob を返す
      cb(new Blob(["compressed"], { type: type ?? "image/jpeg" }));
    } as HTMLCanvasElement["toBlob"];
  });

  afterEach(() => {
    global.URL.createObjectURL = ORIGINAL_CREATE_OBJECT_URL;
    global.URL.revokeObjectURL = ORIGINAL_REVOKE_OBJECT_URL;
    global.Image = ORIGINAL_IMAGE;
    vi.restoreAllMocks();
  });

  it("上限超え JPEG は image/jpeg の File として再エンコードして返す", async () => {
    const big = new File(["x".repeat(3 * 1024 * 1024)], "big.jpg", {
      type: "image/jpeg",
    });
    const result = await compressImage(big, {
      maxEdge: 1920,
      quality: 0.85,
      maxSizeBytes: 2 * 1024 * 1024,
    });
    expect(result).toBeInstanceOf(File);
    expect(result.type).toBe("image/jpeg");
    expect(result.size).toBeLessThan(big.size);
  });

  it("PNG 入力でも JPEG として再エンコードし、拡張子を .jpg に正規化する", async () => {
    const big = new File(["x".repeat(3 * 1024 * 1024)], "photo.png", {
      type: "image/png",
    });
    const result = await compressImage(big, {
      maxEdge: 1920,
      quality: 0.85,
      maxSizeBytes: 2 * 1024 * 1024,
    });
    expect(result.type).toBe("image/jpeg");
    expect(result.name).toMatch(/\.jpg$/);
  });

  it("ObjectURL は処理後に revoke される（リーク防止）", async () => {
    const big = new File(["x".repeat(3 * 1024 * 1024)], "big.jpg", {
      type: "image/jpeg",
    });
    await compressImage(big, { maxSizeBytes: 2 * 1024 * 1024 });
    expect(global.URL.revokeObjectURL).toHaveBeenCalledWith("blob:mock");
  });
});
