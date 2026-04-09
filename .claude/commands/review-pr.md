Pull Requestをレビューする。以下の手順を厳守すること。

## 対象
- 引数 $ARGUMENTS にPR番号またはURLが指定される。未指定の場合は `gh pr list` で一覧を表示し確認する。

## 手順

1. `gh pr view $ARGUMENTS` でPRの概要を取得する。
2. `gh pr diff $ARGUMENTS` で差分を取得する。
3. `gh pr view $ARGUMENTS --json commits` でコミット一覧を取得する。
4. 以下の観点でレビューを実施する:

### レビュー観点
- **正確性**: ロジックにバグや抜け漏れがないか
- **型安全**: `any` の使用、型の不整合がないか
- **セキュリティ**: XSS, SQLインジェクション, 機密情報の漏洩がないか
- **パフォーマンス**: 不要な再レンダリング、N+1クエリ等がないか
- **テスト**: 変更に対応するテストが存在するか
- **規約遵守**: プロジェクトのディレクトリ構造・命名規約に従っているか

5. レビュー結果を以下の形式で報告する:

```
## レビュー結果: PR #<番号>

### 判定: ✅ LGTM / ⚠️ 要修正 / ❌ 差し戻し

### 指摘事項
- [重要度: 高/中/低] ファイル名:行番号 — 指摘内容

### 良い点
- （あれば記載）

### 総評
（1〜2文で総括）
```

6. `gh pr view $ARGUMENTS --json author --jq '.author.login'` でPR作者を取得する。
7. レビュー結果をGitHubに投稿する（自分のPRには `--request-changes` / `--approve` が使えないため分岐する）:
   - **自分のPR**: `gh pr review $ARGUMENTS --comment --body "<レビュー内容>"`
   - **他人のPR + 重要度「高」あり**: `gh pr review $ARGUMENTS --request-changes --body "<レビュー内容>"`
   - **他人のPR + 指摘なし or 「低」のみ**: `gh pr review $ARGUMENTS --approve --body "LGTM"`
   - **他人のPR + それ以外**: `gh pr review $ARGUMENTS --comment --body "<レビュー内容>"`
8. レビュー本文には指摘事項・良い点・総評をすべて含め、末尾に `🤖 Generated with [Claude Code](https://claude.com/claude-code)` を付与する。
