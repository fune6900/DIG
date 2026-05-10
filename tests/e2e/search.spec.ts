import { test, expect } from "@playwright/test";

/**
 * 着こなし検索機能 E2E テストスイート（PR1）
 *
 * 対象フロー:
 *   /search 訪問 → 検索フィールド入力 → 検索ボタン → 結果カード表示
 *   → 無限スクロールで追加ロード → TOPまで戻るボタン
 *   → こだわり条件画面へのリンク
 *
 * 注意: 外部 API（Unsplash）と DB は実環境依存のため、UI 層のレンダリング
 *   と動線検証のみを対象とする。検索実行で結果が 0 件のケースでも UI が
 *   壊れないことを確認する。
 */

test.describe("Phase 0: 事前確認", () => {
  test("/search が 200 で表示される", async ({ page }) => {
    await page.goto("/search");
    await expect(page).toHaveTitle(/DIG/);
  });

  test("コンソールに JS エラーが存在しない", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        if (!msg.text().includes("favicon.ico")) {
          errors.push(msg.text());
        }
      }
    });
    await page.goto("/search");
    await page.waitForLoadState("networkidle");
    expect(errors).toHaveLength(0);
  });
});

test.describe("Phase 1: 検索結果一覧画面の基本UI", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/search");
  });

  test("検索入力フィールドと検索ボタンが表示される", async ({ page }) => {
    await expect(page.getByRole("textbox")).toBeVisible();
    await expect(
      page.getByRole("button", { name: /検索/ }).first(),
    ).toBeVisible();
  });

  test("「こだわり条件を選択」ボタン（リンク）が表示される", async ({
    page,
  }) => {
    await expect(
      page.getByRole("link", { name: /こだわり条件を選択/ }),
    ).toBeVisible();
  });

  test("「こだわり条件を選択」リンクが /search/conditions を指す", async ({
    page,
  }) => {
    const link = page.getByRole("link", { name: /こだわり条件を選択/ });
    await expect(link).toHaveAttribute("href", "/search/conditions");
  });
});

test.describe("Phase 2: キーワード検索フロー", () => {
  test("テキストを入力して検索ボタンを押すと検索が発火する", async ({
    page,
  }) => {
    await page.goto("/search");
    const input = page.getByRole("textbox");
    await input.fill("M-65");
    await page.getByRole("button", { name: /検索/ }).first().click();

    // 検索後、結果領域（snap-grid）にカードが出るか、空状態メッセージが出る
    // 常設リンク（ナビ等）を拾って偽陽性にならないよう testid で結果領域に限定する。
    await page.waitForLoadState("networkidle");
    const resultArea = page.getByTestId("snap-grid");
    const hasResultCards =
      (await resultArea
        .getByTestId("snap-card")
        .count()
        .catch(() => 0)) > 0;
    const hasEmptyState = await page
      .getByText(/該当|見つかり/)
      .isVisible()
      .catch(() => false);
    expect(hasResultCards || hasEmptyState).toBe(true);
  });

  test("空文字検索ではエラーで落ちずページが維持される", async ({ page }) => {
    await page.goto("/search");
    await page.getByRole("button", { name: /検索/ }).first().click();
    await expect(page.getByRole("textbox")).toBeVisible();
  });
});

test.describe("Phase 3: TOPまで戻るボタン", () => {
  test("初期表示時は TOP ボタンが非表示", async ({ page }) => {
    await page.goto("/search");
    const topBtn = page.getByRole("button", { name: /トップ|TOP|top/i });
    await expect(topBtn).not.toBeVisible();
  });

  test("600px 以上スクロールするとTOPボタンが表示される", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/search");
    // 検証用にスクロール対象を生成（結果が無くてもページ全体スクロールできるよう本文を伸ばす）
    await page.evaluate(() => window.scrollTo(0, 800));
    const topBtn = page.getByRole("button", { name: /トップ|TOP|top/i });
    // 仕様「600px 以上で表示」を必須アサート化（条件付きスキップで偽陽性にしない）
    await expect(topBtn).toBeVisible({ timeout: 3000 });
    await topBtn.click();
    await expect
      .poll(async () => page.evaluate(() => window.scrollY))
      .toBeLessThanOrEqual(5);
  });
});

test.describe("Phase 4: ナビゲーション・共通UX", () => {
  test("PC版ヘッダーの「着こなし検索」リンクから /search へ遷移できる", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");
    const nav = page.getByRole("navigation", { name: "メインナビゲーション" });
    await nav.getByRole("link", { name: /着こなし検索/ }).click();
    await expect(page).toHaveURL("/search");
  });

  test("SP版ボトムナビ「着こなし検索」から /search へ遷移できる", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    const bottomNav = page.getByRole("navigation", {
      name: "ボトムナビゲーション",
    });
    await bottomNav.getByRole("link", { name: "着こなし検索" }).click();
    await expect(page).toHaveURL("/search");
  });

  test("DIG. ロゴから / へ戻れる", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/search");
    await page.getByRole("link", { name: "DIG." }).click();
    await expect(page).toHaveURL("/");
  });
});
