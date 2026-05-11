import { test, expect } from "@playwright/test";

/**
 * 画像検索機能 E2E テストスイート（Red フェーズ）
 *
 * 対象フロー:
 *   /search/image 訪問 → 画像アップロード UI 確認
 *   /search からの「画像で検索」リンク動線
 *   /search/image からの /search への戻る導線
 *
 * 注意:
 *   - 実装が存在しない状態での Red フェーズ。テストは失敗する前提。
 *   - 実際のファイルアップロード・AI 解析は行わない（UI 動線のみ）。
 *   - 外部 API・DB は実環境依存のため UI 層のレンダリングのみを対象とする。
 */

// ---------------------------------------------------------------------------
// Phase 0: /search/image ルーティング疎通
// ---------------------------------------------------------------------------

test.describe("Phase 0: /search/image ルーティング疎通", () => {
  test("/search/image が表示される（404 でない）", async ({ page }) => {
    await page.goto("/search/image");

    const pageText = await page.textContent("body");
    expect(pageText).not.toMatch(/404|This page could not be found/i);
  });

  test("コンソールに JS エラーが存在しない", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error" && !msg.text().includes("favicon.ico")) {
        errors.push(msg.text());
      }
    });

    await page.goto("/search/image");
    await page.waitForLoadState("networkidle");

    expect(errors).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Phase 1: /search/image 画面の基本 UI
// ---------------------------------------------------------------------------

test.describe("Phase 1: /search/image 画面の基本 UI", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/search/image");
  });

  test("アップロード UI が表示される", async ({ page }) => {
    // 画像選択ボタン or アップロードエリアが存在すること
    const uploader = page.getByRole("button", { name: /画像を選択/ }).first();
    await expect(uploader).toBeVisible();
  });

  test("「画像を選択」ボタンが表示される", async ({ page }) => {
    await expect(
      page.getByRole("button", { name: /画像を選択/ }),
    ).toBeVisible();
  });

  test("「解析して検索」ボタンが表示される", async ({ page }) => {
    await expect(
      page.getByRole("button", { name: /解析して検索/ }),
    ).toBeVisible();
  });

  test("初期状態で「解析して検索」ボタンが disabled になっている", async ({
    page,
  }) => {
    const btn = page.getByRole("button", { name: /解析して検索/ });
    await expect(btn).toBeDisabled();
  });

  test("ページタイトルに DIG が含まれる", async ({ page }) => {
    await expect(page).toHaveTitle(/DIG/);
  });
});

// ---------------------------------------------------------------------------
// Phase 2: /search からの「画像で検索」動線
// ---------------------------------------------------------------------------

test.describe("Phase 2: /search からの「画像で検索」動線", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/search");
  });

  test("「画像で検索」リンクが /search 上に存在する", async ({ page }) => {
    const link = page.getByRole("link", { name: /画像で検索/ });
    await expect(link).toBeVisible();
  });

  test("「画像で検索」リンクのhref が /search/image を指す", async ({
    page,
  }) => {
    const link = page.getByRole("link", { name: /画像で検索/ });
    await expect(link).toHaveAttribute("href", "/search/image");
  });

  test("「画像で検索」リンクをクリックすると /search/image へ遷移する", async ({
    page,
  }) => {
    await page.getByRole("link", { name: /画像で検索/ }).click();
    await expect(page).toHaveURL("/search/image");
  });
});

// ---------------------------------------------------------------------------
// Phase 3: /search/image からの戻る導線
// ---------------------------------------------------------------------------

test.describe("Phase 3: /search/image からの戻る導線", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/search/image");
  });

  test("/search への戻るリンクが存在する", async ({ page }) => {
    // 「戻る」「着こなし検索へ」「検索に戻る」などのリンクを想定
    const backLink = page
      .getByRole("link", { name: /戻る|着こなし検索|検索に戻る/ })
      .first();
    await expect(backLink).toBeVisible();
  });

  test("戻るリンクが /search を指す", async ({ page }) => {
    const backLink = page
      .getByRole("link", { name: /戻る|着こなし検索|検索に戻る/ })
      .first();
    const href = await backLink.getAttribute("href");
    expect(href).toMatch(/^\/search($|\?)/);
  });

  test("戻るリンクをクリックすると /search へ遷移する", async ({ page }) => {
    const backLink = page
      .getByRole("link", { name: /戻る|着こなし検索|検索に戻る/ })
      .first();
    await backLink.click();
    await expect(page).toHaveURL(/\/search($|\?)/);
  });
});

// ---------------------------------------------------------------------------
// Phase 4: SP / PC レイアウト確認
// ---------------------------------------------------------------------------

test.describe("Phase 4: レスポンシブ UI 確認", () => {
  test("SP（390px）でアップロード UI が表示される", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/search/image");

    await expect(
      page.getByRole("button", { name: /画像を選択/ }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /解析して検索/ }),
    ).toBeVisible();
  });

  test("PC（1280px）でアップロード UI が表示される", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/search/image");

    await expect(
      page.getByRole("button", { name: /画像を選択/ }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /解析して検索/ }),
    ).toBeVisible();
  });
});
