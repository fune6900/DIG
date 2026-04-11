# 開発フロー（TDD駆動）

画像で定義された12ステップの開発フロー。全ての機能実装はこの順序を厳守すること。

---

## Step 1: Plan Mode（設計・タスク分解）

`/plan` を使い、実装前に必ず設計を行う。

- 要件を分解し、サブタスクに落とし込む
- 影響範囲（DB/型/UI/テスト）を特定する
- 実装方針が固まるまでコードに触れない

---

## Step 2: ISSUE 作成

以下のフォーマットで GitHub ISSUE を作成する。

```bash
gh issue create \
  --title "<機能名または修正内容>" \
  --body "$(cat <<'EOF'
## 概要
<!-- 何を実装/修正するか -->

## 受け入れ条件
- [ ] 条件1
- [ ] 条件2

## 技術的メモ
<!-- 実装方針・参照ファイル・依存関係 -->

## 関連
<!-- 関連ISSUEやPRがあればリンク -->
EOF
)"
```

---

## Step 3: ブランチ作成

ISSUE番号を含む命名規則でブランチを切る。

```bash
git checkout -b feat/<issue番号>-<機能名の短縮>
# 例: feat/12-knowledge-search
# 例: fix/15-tryon-button-disabled
```

ブランチ種別:
- `feat/` — 新機能
- `fix/` — バグ修正
- `refactor/` — リファクタリング
- `chore/` — 設定・依存関係変更

---

## Step 4: TDD Cycle（Red → Green → Refactor）

`@.claude/rules/tdd.md` を参照。

---

## Step 5: /smart-commit

実装完了後、`/smart-commit` でコミットする。

- lint・typecheck を通過したもののみコミット可
- コミットメッセージは変更の「理由」を書く（whatではなくwhy）
- 1コミット = 1つの意味のある変更単位

---

## Step 6: PR 作成

`/create-pr` でPRを作成する。

- タイトルは英語・70文字以内
- bodyは `.github/pull_request_template.md` に従う
- ISSUE番号を本文にリンクする（`Closes #<番号>`）

---

## Step 7: ローカル動作確認

PR作成前後に必ずローカルで確認する。

```bash
npm run lint       # ESLint
npm run typecheck  # TypeScript
npm run build      # ビルド成功確認
npm test           # ユニットテスト
```

E2Eが必要な場合は `/e2e-test` を実行する。

---

## Step 8: CI 確認（GitHub Actions）

push後、GitHub Actions の以下ジョブが全てグリーンになることを確認する。

| ジョブ | 内容 |
|--------|------|
| Lint | ESLintエラーがないこと |
| Type Check | 型エラーがないこと |
| Build | ビルドが成功すること |

CI が red の場合はマージしない。原因を特定して修正する。

---

## Step 9: AI コードレビュー

`/review-pr` でAIによるコードレビューを実施する。

レビュー観点:
- ロジックのバグ・抜け漏れ
- 型安全性（`any` の使用禁止）
- セキュリティ（XSS、SQLインジェクション等）
- パフォーマンス（N+1、不要な再レンダリング）
- テストの網羅性

重要度「高」の指摘がある場合はマージしない。

---

## Step 10: LGTM

レビュー指摘が全て解消されたら LGTM。

- 自分のPRは他者（または `/review-pr`）のレビューを受ける
- チェックリストが全て完了していることを確認する

---

## Step 11: マージ

```bash
gh pr merge <PR番号> --squash --delete-branch
```

- `--squash` でコミットを1つに圧縮
- `--delete-branch` でブランチを削除
- マージ後、ISSUE が自動クローズされることを確認（`Closes #` リンクがあれば自動）

---

## Step 12: リリース

main ブランチへのマージ = リリース。

現状は手動デプロイ。Vercel/Supabase の自動デプロイが設定されれば自動化される。
マージ後に本番環境での動作を確認すること。
