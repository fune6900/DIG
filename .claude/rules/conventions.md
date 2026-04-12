# コーディング規約

## TypeScript

- `any` 使用禁止。`unknown` で受けて型ガードする
- `as` キャストは最終手段。使う場合はコメントで理由を明記する
- 型は `types/` に集約する。インライン型定義は小規模な場合のみ許可
- Zod スキーマと TypeScript 型を必ずペアで定義する

```ts
// OK
export const KnowledgeSchema = z.object({
  id: z.string().uuid(),
  brand: z.string().min(1),
  era: z.enum(["1950s", "1960s", "1970s", "1980s", "1990s", "2000s"]),
});
export type Knowledge = z.infer<typeof KnowledgeSchema>;

// NG
const data: any = fetchData();
```

---

## 命名規則

| 対象 | 規則 | 例 |
|------|------|----|
| コンポーネント | PascalCase | `KnowledgeCard.tsx` |
| 関数・変数 | camelCase | `fetchKnowledge()` |
| 定数 | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT` |
| 型・インターフェース | PascalCase | `KnowledgeItem` |
| Zodスキーマ | PascalCase + Schema suffix | `KnowledgeSchema` |
| ファイル（コンポーネント以外） | kebab-case | `knowledge-service.ts` |
| テストファイル | `<対象>.test.ts(x)` | `KnowledgeCard.test.tsx` |

---

## ファイル・ディレクトリ構造

```
app/
  (auth)/           # 認証が必要なルートグループ
  (public)/         # 認証不要なルートグループ
  api/              # Route Handlers
components/
  ui/               # 汎用UIコンポーネント（Button, Input, Card等）
  features/
    knowledge/      # ナレッジ機能コンポーネント
    tryon/          # AI試着コンポーネント
    diary/          # コーデ日記コンポーネント
hooks/              # カスタムフック（use*.ts）
lib/                # ユーティリティ・設定・定数
services/           # 外部API・DBアクセスロジック
types/              # 型定義・Zodスキーマ
tests/
  unit/             # Vitestユニットテスト
  e2e/              # Playwright E2Eテスト
```

---

## コンポーネント設計

- Server Component を原則とし、インタラクティブな部分のみ `"use client"` を付与する
- `props` の型は必ずインターフェースで定義する（インライン型は禁止）
- コンポーネントは単一責任。1コンポーネント = 1つの関心事
- `children` を多用しない。意図が明確な named props を優先する

```tsx
// OK
interface KnowledgeCardProps {
  knowledge: Knowledge;
  onSelect: (id: string) => void;
}
export function KnowledgeCard({ knowledge, onSelect }: KnowledgeCardProps) { ... }

// NG
export function KnowledgeCard(props: any) { ... }
```

---

## 禁止事項

- `console.log` をプロダクションコードに残す（デバッグ後は必ず削除）
- `TODO` コメントをコミットに含める（ISSUEに起票してから削除する）
- `.env` 系ファイルをコミットする
- `any` の使用
- テストなしの機能実装（`/review-pr` で弾く）
- デフォルトエクスポート（`export default`）を components 以外で使う
