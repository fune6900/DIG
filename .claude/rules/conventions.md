# コーディング規約

## ブランチ命名

```
<種別>/<issue番号>-<内容の短縮>

feat/12-knowledge-search
fix/15-tryon-button-disabled
refactor/20-outfit-diary-query
chore/25-update-dependencies
```

| 種別 | 用途 |
|------|------|
| `feat/` | 新機能 |
| `fix/` | バグ修正 |
| `refactor/` | リファクタリング（機能変更なし） |
| `chore/` | 設定・依存関係・CI変更 |

---

## コミットメッセージ

```
<種別>: <変更の理由または内容>

本文（省略可）: 詳細な理由・背景

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```

種別は英語小文字:
- `feat` — 新機能
- `fix` — バグ修正
- `refactor` — リファクタリング
- `test` — テスト追加・修正
- `chore` — 設定変更・依存更新
- `ci` — CI/CD変更

**NG例**: `fix bug`, `update`, `WIP`
**OK例**: `fix: prevent double submission on tryon button`

---

## TypeScript

- `any` は使用禁止。`unknown` で受けて型ガードする
- `as` キャストは最終手段。使う場合はコメントで理由を書く
- 型は `types/` に集約。インラインの `type Foo = {...}` は小さい場合のみ許可
- Zod スキーマとTypeScript型を同時に定義する（`z.infer<typeof Schema>`）

---

## ファイル・ディレクトリ

```
app/              # Next.js App Router（ページ・Server Actions）
components/       # 再利用可能なUIコンポーネント
  ui/             # 汎用UI（Button, Input等）
  features/       # 機能ごとのコンポーネント
hooks/            # カスタムフック
lib/              # ユーティリティ・設定
services/         # 外部API・DBアクセスロジック
types/            # 型定義・Zodスキーマ
tests/
  unit/           # Vitestユニットテスト
  e2e/            # Playwrightテスト
```

---

## 禁止事項

- `console.log` をプロダクションコードに残す
- `TODO` コメントをコミットに含める（ISSUEに起票してから消す）
- `.env` ファイルをコミットする
- `any` の使用
- テストなしの機能実装
