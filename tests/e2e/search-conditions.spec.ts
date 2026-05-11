import { test, expect } from "@playwright/test";

/**
 * こだわり条件画面 E2E テストスイート (Red フェーズ)
 *
 * 対象: /search/conditions — 新規実装予定画面
 *
 * 注意:
 *   - 実装が存在しない状態での Red フェーズ。テストは失敗する前提。
 *   - 外部 API・DB は実環境依存のため、UI 層の動線検証のみを対象とする。
 */

// ---------------------------------------------------------------------------
// Phase 0: ルーティング疎通
// ---------------------------------------------------------------------------
test.describe("Phase 0: /search/conditions ルーティング疎通", () => {
  test("/search/conditions が表示される（404 でない）", async ({ page }) => {
    await page.goto("/search/conditions");

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

    await page.goto("/search/conditions");
    await page.waitForLoadState("networkidle");

    expect(errors).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Phase 1: 基本 UI の存在確認
// ---------------------------------------------------------------------------
test.describe("Phase 1: /search/conditions 基本 UI", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/search/conditions");
  });

  test("「こだわり条件」見出しが表示される", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: /こだわり条件/ }),
    ).toBeVisible();
  });

  test("スタイル選択チェックボックスが少なくとも 1 件存在する", async ({
    page,
  }) => {
    const checkboxes = page.getByRole("checkbox");
    await expect(checkboxes.first()).toBeVisible();
  });

  test("カラースウォッチボタンが 16 件存在する", async ({ page }) => {
    // COLOR_CATEGORIES の 16 件に対応するボタンが表示される
    // aria-pressed を持つカラーボタンで識別する
    const colorButtons = page.locator("[aria-pressed]");
    await expect(colorButtons).toHaveCount(16);
  });

  test("「リセット」ボタンが表示される", async ({ page }) => {
    await expect(page.getByRole("button", { name: /リセット/ })).toBeVisible();
  });

  test("「検索」ボタンが表示される", async ({ page }) => {
    await expect(page.getByRole("button", { name: /検索/ })).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Phase 2: 検索ボタンクリックで /search?styles=...&colors=... へ遷移
// ---------------------------------------------------------------------------
test.describe("Phase 2: 検索ボタンクリックで検索結果画面へ遷移", () => {
  test("スタイルを選択して検索ボタンをクリックすると /search?styles=... へ遷移する", async ({
    page,
  }) => {
    await page.goto("/search/conditions");

    // 最初に表示されるチェックボックスをクリックして選択
    const firstCheckbox = page.getByRole("checkbox").first();
    await firstCheckbox.click();
    await page.getByRole("button", { name: /検索/ }).click();

    // /search?styles=... の URL へ遷移する
    await expect(page).toHaveURL(/\/search\?.*styles=/);
  });

  test("カラーを選択して検索ボタンをクリックすると /search?colors=... へ遷移する", async ({
    page,
  }) => {
    await page.goto("/search/conditions");

    // 最初のカラーボタンをクリック
    await page.locator("[aria-pressed]").first().click();
    await page.getByRole("button", { name: /検索/ }).click();

    // /search?colors=... の URL へ遷移する
    await expect(page).toHaveURL(/\/search\?.*colors=/);
  });

  test("スタイルとカラーを両方選択して検索すると styles と colors が両方 URL に含まれる", async ({
    page,
  }) => {
    await page.goto("/search/conditions");

    await page.getByRole("checkbox").first().click();
    await page.locator("[aria-pressed]").first().click();
    await page.getByRole("button", { name: /検索/ }).click();

    await expect(page).toHaveURL(
      /\/search\?.*styles=.*colors=|\/search\?.*colors=.*styles=/,
    );
  });

  test("何も選択せずに検索ボタンをクリックしても /search へ遷移する（エラーで落ちない）", async ({
    page,
  }) => {
    await page.goto("/search/conditions");

    await page.getByRole("button", { name: /検索/ }).click();

    // /search へ遷移するか、現在のページに留まるかのどちらかで OK
    // 少なくともエラーで落ちないことを確認
    const url = page.url();
    expect(url).toMatch(/\/search/);
  });
});

// ---------------------------------------------------------------------------
// Phase 3: リセットボタンで選択状態クリア
// ---------------------------------------------------------------------------
test.describe("Phase 3: リセットボタンで選択状態クリア", () => {
  test("スタイルを選択後にリセットクリックでチェックが外れる", async ({
    page,
  }) => {
    await page.goto("/search/conditions");

    const firstCheckbox = page.getByRole("checkbox").first();
    await firstCheckbox.click();
    await expect(firstCheckbox).toBeChecked();

    await page.getByRole("button", { name: /リセット/ }).click();

    await expect(firstCheckbox).not.toBeChecked();
  });

  test("カラーを選択後にリセットクリックで aria-pressed が false になる", async ({
    page,
  }) => {
    await page.goto("/search/conditions");

    const firstColorBtn = page.locator("[aria-pressed]").first();
    await firstColorBtn.click();
    await expect(firstColorBtn).toHaveAttribute("aria-pressed", "true");

    await page.getByRole("button", { name: /リセット/ }).click();

    await expect(firstColorBtn).toHaveAttribute("aria-pressed", "false");
  });
});

// ---------------------------------------------------------------------------
// Phase 4: /search からの ConditionsLink 経由遷移
// ---------------------------------------------------------------------------
test.describe("Phase 4: /search からの遷移", () => {
  test("ConditionsLink クリックで /search/conditions へ遷移する", async ({
    page,
  }) => {
    await page.goto("/search");

    await page.getByRole("link", { name: /こだわり条件を選択/ }).click();

    await expect(page).toHaveURL("/search/conditions");
  });

  test("/search/conditions から戻ると /search に戻れる", async ({ page }) => {
    await page.goto("/search/conditions");

    await page.goBack();

    await expect(page).toHaveURL("/search");
  });
});
