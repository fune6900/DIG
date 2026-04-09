Pull Requestを作成する。以下の手順を厳守すること。

## 手順

1. `git status` と `git diff` で未コミットの変更を確認し、あればコミットするか確認する。
2. `git log main..HEAD --oneline` でmainブランチからの全コミットを取得する。
3. `git diff main...HEAD` で差分の全体像を把握する。
4. 差分とコミット履歴を分析し、以下の形式でPRを作成する:

```
gh pr create --title "<70文字以内の簡潔なタイトル>" --body "$(cat <<'EOF'
## Summary
<変更内容の要約を箇条書き3点以内>

## Changes
<変更したファイルと内容の概要>

## Test plan
<テスト方法のチェックリスト>

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

5. 必要に応じて `git push -u origin HEAD` を先に実行する。
6. 作成後、PRのURLを報告する。

## 注意
- タイトルは英語で、変更の本質を端的に表すこと。
- bodyは日本語で記述すること。
- 全コミットの内容を反映すること。最新コミットだけを見ない。
- ベースブランチの指定が必要な場合は $ARGUMENTS を使用する（デフォルト: main）。
