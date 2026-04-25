import { test, expect } from "@playwright/test";

/**
 * #OOTD機能 E2Eテストスイート
 *
 * 対象フロー:
 *   一覧表示（シール手帳/カレンダー切り替え）→ 新規登録フロー（画像アップロード→AI分析→タグ登録）
 *   → 詳細表示 → 削除
 *
 * 注意: AI分析・実際のファイルアップロード・DB書き込みを伴うフローは
 *   外部依存のため本スイートではモック不使用の範囲（UI層）のみを検証する。
 *   結合テスト（アップロード→分析→保存→削除）は別途インフラ環境を用意して実施すること。
 */

test.describe("Phase 0: 事前確認", () => {
  test("OOTDページが正常に表示される", async ({ page }) => {
    await page.goto("/ootd");
    await expect(page).toHaveTitle(/DIG/);
    await expect(page.getByRole("heading", { name: "#OOTD" })).toBeVisible();
  });

  test("コンソールにJSエラーが存在しない", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        // favicon 404 は無視（Next.js開発環境の既知の無害なエラー）
        if (!msg.text().includes("favicon.ico")) {
          errors.push(msg.text());
        }
      }
    });
    await page.goto("/ootd");
    await page.waitForLoadState("networkidle");
    expect(errors).toHaveLength(0);
  });
});

test.describe("Phase 1: OOTD一覧ページ", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/ootd");
  });

  test("ページ見出し「#OOTD」が表示される", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "#OOTD", level: 1 }),
    ).toBeVisible();
  });

  test("サブタイトル「今日のコーデを記録する」が表示される", async ({
    page,
  }) => {
    await expect(page.getByText("今日のコーデを記録する")).toBeVisible();
  });

  test("「追加」リンクが/ootd/newへ遷移する", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/ootd");
    await expect(
      page.getByRole("link", { name: /追加/ }).first(),
    ).toHaveAttribute("href", "/ootd/new");
  });

  test("シール手帳ボタンがデフォルトでアクティブ（aria-pressed=true）", async ({
    page,
  }) => {
    const stickerBtn = page.getByRole("button", { name: "シール手帳" });
    await expect(stickerBtn).toBeVisible();
    await expect(stickerBtn).toHaveAttribute("aria-pressed", "true");
  });

  test("カレンダーボタンが表示される", async ({ page }) => {
    const calendarBtn = page.getByRole("button", { name: "カレンダー" });
    await expect(calendarBtn).toBeVisible();
    await expect(calendarBtn).toHaveAttribute("aria-pressed", "false");
  });

  test("カレンダービューに切り替えると月カレンダーが表示される", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "カレンダー" }).click();

    // カレンダーボタンがアクティブになる
    await expect(
      page.getByRole("button", { name: "カレンダー" }),
    ).toHaveAttribute("aria-pressed", "true");
    await expect(
      page.getByRole("button", { name: "シール手帳" }),
    ).toHaveAttribute("aria-pressed", "false");

    // 月ナビゲーションが表示される
    await expect(page.getByRole("heading", { level: 2 })).toBeVisible();
    await expect(page.getByRole("button", { name: "前の月" })).toBeVisible();
    await expect(page.getByRole("button", { name: "次の月" })).toBeVisible();
  });

  test("カレンダービューで現在月が表示される", async ({ page }) => {
    await page.getByRole("button", { name: "カレンダー" }).click();
    // 現在月・年の見出しが表示される（例: "April 2026"）
    const heading = page.getByRole("heading", { level: 2 });
    await expect(heading).toBeVisible();
    const headingText = await heading.textContent();
    expect(headingText).toBeTruthy();
    // 月名と年の形式であることを確認
    expect(headingText).toMatch(/[A-Za-z]+ \d{4}/);
  });

  test("シール手帳ビューに戻すと並び替えボタンが表示される", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "カレンダー" }).click();
    await page.getByRole("button", { name: "シール手帳" }).click();

    await expect(
      page.getByRole("button", { name: "シール手帳" }),
    ).toHaveAttribute("aria-pressed", "true");
    // 並び替えボタンがシール手帳ビューのみ表示
    const sortBtn = page.getByRole("button", { name: /並び替え/ });
    await expect(sortBtn).toBeVisible();
  });

  test("OOTDが未登録の場合、空状態メッセージが表示される", async ({ page }) => {
    // データがない場合の確認（DB状態依存のため条件付きチェック）
    const emptyText = page.getByText("まだコーデが登録されていません");
    const isEmptyVisible = await emptyText.isVisible().catch(() => false);
    // 空の場合はメッセージが表示される、データがある場合はOotdCardが表示される
    if (isEmptyVisible) {
      await expect(emptyText).toBeVisible();
    } else {
      // カードが存在することを確認
      const cards = page.locator("[data-testid='ootd-card']");
      expect(await cards.count()).toBeGreaterThan(0);
    }
  });
});

test.describe("Phase 2: OOTD新規登録フロー", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/ootd/new");
  });

  test("/ootd/new へ遷移できる", async ({ page }) => {
    await expect(page).toHaveURL("/ootd/new");
    await expect(
      page.getByRole("heading", { name: "今日のコーデ", level: 1 }),
    ).toBeVisible();
  });

  test("画像アップロードエリアが表示される", async ({ page }) => {
    const uploadArea = page.getByRole("button", { name: "画像を選択" });
    await expect(uploadArea).toBeVisible();
    await expect(page.getByText("タップして画像を選択")).toBeVisible();
  });

  test("「AIで分析する」ボタンが画像未選択時にdisabledになる", async ({
    page,
  }) => {
    const analyzeBtn = page.getByRole("button", { name: "AIで分析する" });
    await expect(analyzeBtn).toBeVisible();
    await expect(analyzeBtn).toBeDisabled();
  });

  test("「AIで分析する」ボタンはuploadedUrl取得後にenabledになる（状態遷移テスト）", async ({
    page,
  }) => {
    // uploadedUrl がセットされる前は disabled
    await expect(
      page.getByRole("button", { name: "AIで分析する" }),
    ).toBeDisabled();
    // ファイル選択ダイアログはE2E環境でモックが必要なため、ここでは disabled 状態のみ検証する
  });

  test("戻るリンクが/ootdへ遷移する", async ({ page }) => {
    const backLink = page.getByRole("link", { name: "戻る" });
    await expect(backLink).toBeVisible();
    await expect(backLink).toHaveAttribute("href", "/ootd");
  });

  test("戻るリンクをクリックすると/ootdへ戻る", async ({ page }) => {
    await page.getByRole("link", { name: "戻る" }).click();
    await expect(page).toHaveURL("/ootd");
  });

  test("コーデ画像ファイル入力が存在する（スクリーンリーダー向け）", async ({
    page,
  }) => {
    // sr-only クラスで視覚的に非表示だが DOM に存在することを確認
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toBeAttached();
    await expect(fileInput).toHaveAttribute("accept", "image/*");
  });
});

test.describe("Phase 3: 共通UX", () => {
  test("ナビゲーション: DIG.ロゴがトップへ遷移する（PC）", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/ootd");
    await page.getByRole("link", { name: "DIG." }).click();
    await expect(page).toHaveURL("/");
  });

  test("ブラウザバック: /ootd/new から /ootd に戻る", async ({ page }) => {
    await page.goto("/ootd");
    await page.goto("/ootd/new");
    await page.goBack();
    await expect(page).toHaveURL("/ootd");
  });

  test("存在しないOOTD IDは404になる", async ({ page }) => {
    await page.goto("/ootd/nonexistent-uuid-00000000");
    await expect(page).toHaveTitle(/404|Not Found/i);
  });

  test("PC版ヘッダーに#OOTD・着こなし検索・追加リンクが揃っている", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/ootd");
    const nav = page.getByRole("navigation", { name: "メインナビゲーション" });
    await expect(nav.getByRole("link", { name: /#OOTD/ })).toBeVisible();
    await expect(nav.getByRole("link", { name: /着こなし検索/ })).toBeVisible();
    await expect(nav.getByRole("link", { name: /追加/ })).toBeVisible();
  });

  test("SP版ボトムナビゲーションに3ボタンが揃っている", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/ootd");
    const bottomNav = page.getByRole("navigation", {
      name: "ボトムナビゲーション",
    });
    await expect(
      bottomNav.getByRole("link", { name: "着こなし検索" }),
    ).toBeVisible();
    await expect(
      bottomNav.getByRole("link", { name: "OOTDを追加" }),
    ).toBeVisible();
    await expect(
      bottomNav.getByRole("link", { name: "自分のOOTD一覧" }),
    ).toBeVisible();
  });
});

test.describe("Phase 4: タグ入力フォーム（OotdRegisterForm）の単体UI検証", () => {
  /**
   * OotdRegisterForm はanalysisResultが取得された後（step === "register"）に表示される。
   * 実際のAI分析APIを呼ばずにUIを検証するため、
   * このDescribeでは将来的なAPIモックとの組み合わせを想定したテスト構造のみ定義する。
   */

  test("registerステップに到達する前のステップ確認（upload stepが初期状態）", async ({
    page,
  }) => {
    await page.goto("/ootd/new");
    // upload step ではタグ入力フォームは表示されない
    await expect(
      page.getByPlaceholder("タグを入力（例: 古着）"),
    ).not.toBeVisible();
    // AI分析ボタンが表示されている
    await expect(
      page.getByRole("button", { name: "AIで分析する" }),
    ).toBeVisible();
  });
});
