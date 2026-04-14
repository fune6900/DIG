現在のブランチのPRをmainにマージし、ローカルをmainに切り替えて最新状態に同期する。以下の手順を厳守すること。

## 手順

### Phase 1: 事前確認

1. `git status` で未コミットの変更がないことを確認する。変更があればマスターに報告し、コミットするか中止するか確認する。
2. `git branch --show-current` で現在のブランチ名を取得する。
3. `gh pr list --head <現在のブランチ名> --json number,title,state` で対応する PR を特定する。PRが存在しない場合はマスターに報告して中止する。

### Phase 2: README.md にリリース内容を記載

マージ前に `README.md` のリリースノートを更新する。

1. `gh pr view <PR番号> --json title,body,mergedAt` で PR の内容を取得する
2. `git log main..HEAD --oneline` で変更コミットを確認する
3. `README.md` を Read して現在のバージョン番号を確認する（最新の `vX.Y.Z` を取得）
4. パッチ/マイナー/メジャーを判断してバージョンをインクリメントする:
   - バグ修正・軽微な改善 → パッチ（v0.2.0 → v0.2.1）
   - 新機能追加 → マイナー（v0.2.0 → v0.3.0）
   - 破壊的変更 → メジャー（v0.2.0 → v1.0.0）
5. `README.md` の `## リリースノート` セクションの先頭に以下の形式で追記する:

```markdown
### vX.Y.Z — YYYY-MM-DD

**<機能名>**

- 追加・変更内容を箇条書きで記載

---
```

6. 追記後に `/smart-commit` の手順に従いコミット・push する:
   ```
   docs: update release notes for vX.Y.Z
   ```

### Phase 3: PR のマージ

1. 対象 PR の CI ステータスを確認する:

   ```bash
   gh pr checks <PR番号>
   ```

   CI が全件グリーンでない場合はマスターに警告し、続行するか確認する。

2. PR を Squash マージする:

   ```bash
   gh pr merge <PR番号> --squash --delete-branch
   ```

   - `--squash` でコミットを1つに圧縮する
   - `--delete-branch` でリモートのフィーチャーブランチを削除する

### Phase 4: main への切り替えと同期

1. main ブランチに切り替える:

   ```bash
   git checkout main
   ```

2. リモートの最新状態を取得する:

   ```bash
   git pull origin main
   ```

3. ローカルのフィーチャーブランチを削除する（リモートが削除済みの場合）:
   ```bash
   git branch -d <フィーチャーブランチ名>
   ```

### Phase 4: 完了報告

以下を報告する:

- マージされた PR 番号とタイトル
- 現在のブランチ（main）
- `git log --oneline -5` で最新5件のコミット履歴

## 注意

- CI が red のままマージしない。マスターが明示的に許可した場合のみ続行する。
- `--force` や `--no-verify` は絶対に使わない。
- マージ後は必ず `git pull` で最新状態にしてから完了を報告する。
