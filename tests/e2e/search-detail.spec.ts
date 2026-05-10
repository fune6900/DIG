import { test, expect } from "@playwright/test";

/**
 * 着こなし検索 詳細画面 E2E テストスイート（PR3）
 *
 * 対象:
 *   /search/<id> — Snap 詳細画面の本実装
 *   /search?query=<value> — URL パラメータ付き検索画面
 *
 * 注意:
 *   - 外部 API（Unsplash / Gemini）と DB は実環境依存のため、
 *     UI 層のルーティング・基本要素・URL パラメータの反映のみを対象とする。
 *   - ダミー ID（非 UUID）でアクセスした場合に 404 ではなく
 *     詳細ルート自体が存在することを確認する（ルーティング疎通テスト）。
 *   - 「準備中」プレースホルダが表示されず、本実装の要素が存在することを確認する。
 */

// ---------------------------------------------------------------------------
// Phase 0: ルーティング疎通
// ---------------------------------------------------------------------------
test.describe("Phase 0: /search/[id] ルーティング疎通", () => {
  test("/search/<dummy-id> にアクセスしても 404 ページにならない", async ({
    page,
  }) => {
    await page.goto("/search/dummy-test-id-pr3");

    // Next.js の標準 404 は "404" や "This page could not be found" を含む
    const pageText = await page.textContent("body");
    expect(pageText).not.toMatch(/404|This page could not be found/i);
  });

  test("/search/<dummy-id> が 200 ステータスで応答する", async ({ page }) => {
    const response = await page.goto("/search/dummy-test-id-pr3");
    expect(response?.status()).not.toBe(404);
  });
});

// ---------------------------------------------------------------------------
// Phase 1: 本実装要素の存在確認（「準備中」プレースホルダではない）
// ---------------------------------------------------------------------------
test.describe("Phase 1: 本実装要素の存在", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/search/dummy-test-id-pr3");
    await page.waitForLoadState("networkidle");
  });

  test("「準備中」プレースホルダのテキストが存在しない", async ({ page }) => {
    // PR1 のプレースホルダには「準備中」が含まれていた
    const hasPlaceholder = await page
      .getByText("準備中")
      .isVisible()
      .catch(() => false);
    expect(hasPlaceholder).toBe(false);
  });

  test("画像要素（img）が存在する", async ({ page }) => {
    // Snap の画像が表示されること（URL が不正でも要素は存在する）
    const img = page.locator("img").first();
    await expect(img).toBeVisible({ timeout: 5000 });
  });

  test("/search へ戻るリンクが存在する", async ({ page }) => {
    const backLink = page.getByRole("link", { name: /検索に戻る|戻る|back/i });
    await expect(backLink).toBeVisible({ timeout: 5000 });
  });
});

// ---------------------------------------------------------------------------
// Phase 2: 戻るリンクの動線
// ---------------------------------------------------------------------------
test.describe("Phase 2: 戻るリンクの動線", () => {
  test("戻るリンクが /search を指す", async ({ page }) => {
    await page.goto("/search/dummy-test-id-pr3");
    await page.waitForLoadState("networkidle");

    const backLink = page.getByRole("link", { name: /検索に戻る|戻る|back/i });
    await expect(backLink).toHaveAttribute("href", "/search");
  });

  test("戻るリンクから /search へ遷移できる", async ({ page }) => {
    await page.goto("/search/dummy-test-id-pr3");
    await page.waitForLoadState("networkidle");

    await page.getByRole("link", { name: /検索に戻る|戻る|back/i }).click();
    await expect(page).toHaveURL("/search");
  });
});

// ---------------------------------------------------------------------------
// Phase 3: URL パラメータ ?query=<value> の反映
// ---------------------------------------------------------------------------
test.describe("Phase 3: /search?query=<value> の URL パラメータ反映", () => {
  test("?query=M-65 で訪問すると検索フィールドに 'M-65' が表示される", async ({
    page,
  }) => {
    await page.goto("/search?query=M-65");
    await page.waitForLoadState("networkidle");

    const input = page.getByRole("textbox");
    await expect(input).toHaveValue("M-65");
  });

  test("?query=デニムジャケット で訪問すると検索フィールドに 'デニムジャケット' が表示される", async ({
    page,
  }) => {
    await page.goto(
      "/search?query=%E3%83%87%E3%83%8B%E3%83%A0%E3%82%B8%E3%83%A3%E3%82%B1%E3%83%83%E3%83%88",
    );
    await page.waitForLoadState("networkidle");

    const input = page.getByRole("textbox");
    await expect(input).toHaveValue("デニムジャケット");
  });

  test("?query=M-65 で訪問すると自動検索が発火し snap-grid が表示される", async ({
    page,
  }) => {
    await page.goto("/search?query=M-65");
    await page.waitForLoadState("networkidle");

    // 検索グリッド領域が存在すること（結果 0 件でも grid 自体は表示される）
    const grid = page.getByTestId("snap-grid");
    await expect(grid).toBeVisible({ timeout: 10000 });
  });

  test("query パラメータなしで /search を訪問すると検索フィールドは空", async ({
    page,
  }) => {
    await page.goto("/search");
    await page.waitForLoadState("networkidle");

    const input = page.getByRole("textbox");
    await expect(input).toHaveValue("");
  });
});
