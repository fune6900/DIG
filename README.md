# DIG（ディグ）

古着フリーク向けのナレッジ & バーチャル試着・コーデ日記プラットフォーム。

---

## リリースノート

### v0.2.0 — 2026-04-14

**古着図鑑（ナレッジ検索）**

- `/knowledge` — ブランド・年代・カテゴリ・フリーワードで古着アイテムを検索
- `/knowledge/[id]` — 年代識別ポイント（タグ・縫製・素材・シルエット・ディテール）の詳細表示
- ページネーション対応
- 共通UIコンポーネント追加（Badge, Card, Spinner, Pagination）

---

### v0.1.0 — 2026-04-14

**環境構築 & インフラ**

- Docker Compose（Next.js app + PostgreSQL 16）
- Prisma 7 + PrismaPg アダプター（接続プーリング対応）
- GitHub Actions CI（Lint / Type Check / Build）
- Vercel デプロイ設定
- CodeRabbit 日本語レビュー設定

---

## 技術スタック

- **Core**: Next.js (App Router), React, Tailwind CSS v4
- **State**: TanStack Query v5
- **Database**: Prisma 7 (PostgreSQL) / Supabase
- **Validation**: TypeScript, Zod v4
- **Testing**: Vitest, React Testing Library, Playwright
- **CI/CD**: GitHub Actions, Vercel

## 開発コマンド

```bash
npm run dev        # 開発サーバー起動
npm run build      # 本番ビルド
npm run lint       # ESLint
npm run typecheck  # 型チェック
npm test           # ユニットテスト（Vitest）
npm run e2e        # E2Eテスト（Playwright）
```
