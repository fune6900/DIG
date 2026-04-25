# DIG（ディグ）

今日のコーデを記録・振り返るプラットフォーム。AI分析でスタイル・カラー・アイテムを自動抽出。

---

## リリースノート

### v0.8.0 — 2026-04-26

**SP版OOTD詳細ポップアップ + 戻るソフトナビ + 6軸評価レーダーUI**

- 新規 `OotdEvaluationRadar`: Recharts ヘキサゴナル レーダー（時計回りに カジュアル → 落ち着いたトーン → さりげない → フォーマル → カラフル → 存在感のある）を緑線 stroke で描画
- `OotdDetail`: `radarScores` がある OOTD は ITEMS の下に Evaluation セクションを表示。optional `onBack` prop で戻るソフトナビボタン
- 新規 `OotdDetailModal` (SP only): 画面下からスライドアップ / 80dvh / 暗オーバーレイ + blur / ドラッグハンドル / ESC・戻る・オーバーレイで閉じる
- 新規 `useIsMobile` hook（matchMedia <=767px）+ ユニットテスト 6 件
- `OotdListClient`: SP では `getOotdByIdAction` でモーダル表示、PC は従来通り `/ootd/[id]` フルページ遷移。モーダルは conditional render で再オープン時にアニメーション再生
- `OotdDetailPage` (フルページ): `onBack` を `router.back`（履歴がない場合は `/ootd`）にフォールバック

---

### v0.7.0 — 2026-04-26

**6軸評価レーダー基盤 + Notion 出典の AI プロンプト刷新**

- `EvaluationRadar` スキーマを追加（casual / subdued / presence / subtle / formal / colorful の0〜100 スコア）。`Ootd` / `OotdAnalysisResult` / `CreateOotdInput` に optional で組み込み
- Prisma `Ootd` モデルに `radarScores Json?` を追加（既存レコードは null 許容）
- `services/ai-analysis.ts` のプロンプトを Notion 出典の few-shot に刷新
  - `そのコーデを一言で表した言葉.md` の語彙・文学的トーンを `oneLiner` に継承
  - `コーデを構成する説明文（DESCRIPTION）.md` の分析的・サブカル参照スタイルを `description` に継承
  - 同時に 6 軸 `radarScores` を生成するよう指示
- 新規 OOTD 登録フローで `radarScores` を `createOotdAction` にそのまま転送
- `EvaluationRadarSchema` に対するスキーマテストを追加

---

### v0.6.0 — 2026-04-25

**#OOTD一覧のラベル整理 + コーデカレンダー3段リデザイン**

- 一覧切替ボタンのラベル変更: 「シール手帳」→「コーデ」、「カレンダー」→「コーデカレンダー」
- `OotdCalendar` を3段構成にリデザイン
  1. 今日見出し（例: `Sat. April 25, 2026`）
  2. 今週ストリップ（日付＋曜日、今日に▲インジケータ）
  3. 既存の月カレンダー
- 月見出しを `h3` に降格し、`h2` を Today 見出しに割り当て
- 月グリッドの `isToday` 判定を共通 `isSameDate` ヘルパーに統一

---

### v0.5.0 — 2026-04-25

**#OOTD中心への再構成 + ボトムナビ + デバイス別起動画面**

- 古着図鑑・年代判別・マイ図鑑機能を全削除（route・component・service・types・hook・lib・test 一括）
- 起動画面を device-aware 化: PC=トップ、SP=`/ootd`（`proxy.ts` UA判定 + クライアント側 `MobileRedirect` フォールバック）
- SP専用ボトムナビゲーション追加（左:着こなし検索 / 中央:+OOTD追加 / 右:自分=OOTD一覧）。`/ootd/new` では非表示
- 共通アイコンライブラリ `components/ui/icons.tsx` を導入し、全アクションボタンの左横にアイコンを付与
- ルートレベルローディング追加（`app/loading.tsx`、`app/(public)/ootd/loading.tsx`、`app/(public)/ootd/[id]/loading.tsx`）+ `Spinner` の size/variant 対応 + `FullScreenLoader`
- 着こなし検索の仮ページ `/search` を追加
- Prismaから `Knowledge` モデルを削除

---

### v0.4.0 — 2026-04-14

**ナレッジ更新Skill + Notion連携**

- `/knowledge-update` スラッシュコマンドを追加。ブランド・年代・ディテール情報を対話形式で収集
- `.claude/knowledge-base/brands/<ブランド名>.md` にMarkdown形式でローカル保存
- Notion MCPで古着図鑑ナレッジベースページ（`34218002-901a-8195-93b9-df0e88c875dd`）に自動同期
- `.env.example` に `NOTION_KNOWLEDGE_PAGE_ID` を追加

---

### v0.3.0 — 2026-04-15

**ブックマーク（マイ図鑑）**

- `/knowledge/[id]` — ★ブックマークボタンを追加。ローカルストレージに保存
- `/knowledge/bookmarks` — 保存したナレッジを一覧表示する「マイ図鑑」ページを追加
- 認証不要。将来的な DB 永続化に対応できる設計

---

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
