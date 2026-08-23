# DIG（ディグ）

今日のコーデを掘り起こす、AI コーデ日記アプリ。撮って、読んで、探す。毎日の一着を、未来の自分のために残す。

![Lint](https://img.shields.io/badge/lint-passing-success)
![Type Check](https://img.shields.io/badge/typecheck-passing-success)
![Build](https://img.shields.io/badge/build-passing-success)

---

## 機能

- **#OOTD**: 今日のコーデを 1 枚に。撮って、タグ付けて、シール手帳・カレンダーで振り返る
- **AI コーデ分析**: スタイル・カラー・印象・6 軸評価（カジュアル / 落ち着き / さりげなさ / フォーマル / 存在感 / カラフル）を自動生成
- **着こなし検索**: キーワード / 画像 / スタイル × カラーで、他のコーデを掘る
- **画像最適化**: HEIC 対応・クライアント圧縮・Supabase Storage への直接アップロード

---

## 技術スタック

- **Core**: Next.js 16 (App Router), React 19, Tailwind CSS v4
- **State**: TanStack Query v5
- **Database**: Prisma 7 (PostgreSQL) / Supabase
- **Storage**: Supabase Storage（ローカルは `public/uploads/` フォールバック）
- **AI**: Gemini（コーデ分析）
- **Validation**: TypeScript, Zod v4
- **Motion**: motion (Framer Motion 後継) + three.js (WebGL ヒーロー)
- **Testing**: Vitest, React Testing Library, Playwright
- **CI/CD**: GitHub Actions, Vercel

---

## 開発コマンド

```bash
npm run dev        # 開発サーバー起動
npm run build      # 本番ビルド
npm run lint       # ESLint
npm run typecheck  # 型チェック
npm test           # ユニットテスト（Vitest）
npm run e2e        # E2Eテスト（Playwright）
```

---

## Supabase Keepalive

Supabase 無料プランは **7 日間 API/DB アクセスが無いとプロジェクトが一時停止**される。
`.github/workflows/supabase-keepalive.yml` が毎日 03:17 UTC に PostgREST へ 1 行 SELECT を投げて回避する。

### セットアップ

リポジトリの Settings → Secrets and variables → Actions に登録する。

| 種別     | キー                        | 値                                          |
| -------- | --------------------------- | ------------------------------------------- |
| Secret   | `SUPABASE_URL`              | `https://<project-ref>.supabase.co`         |
| Secret   | `SUPABASE_SERVICE_ROLE_KEY` | Supabase の service_role キー               |
| Variable | `SUPABASE_KEEPALIVE_TABLE`  | 疎通に使うテーブル名（任意・既定は `Ootd`） |

### 手元での確認

```bash
SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npm run keepalive:supabase
```

Actions タブの **Supabase Keepalive** → Run workflow でも手動実行できる。

> **注意**: GitHub は 60 日間コミットが無いパブリックリポジトリの schedule を自動停止する。
> 停止時は GitHub からメールが届くので、Actions タブから再有効化すること。
