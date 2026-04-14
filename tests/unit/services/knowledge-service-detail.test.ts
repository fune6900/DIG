import { knowledgeService } from "@/services/knowledge-service";
import { filterByDetailType } from "@/services/knowledge-service";
import type { KnowledgeSummary } from "@/types/knowledge";

// ---- テスト用フィクスチャ ----
// knowledge-service の detailType フィルタリングロジックを検証するための
// 軽量なインメモリフィクスチャ。DB モックは使わない（testing.md 準拠）。
// filterByDetailType は純粋関数として実装されることを前提とする。

const makeItem = (
  id: string,
  identificationPointTypes: string[],
): KnowledgeSummary & {
  identificationPoints: { type: string; description: string }[];
} => ({
  id,
  brand: "TestBrand",
  category: "ジャケット",
  era: "1960s",
  tags: [],
  imageUrls: [],
  identificationPoints: identificationPointTypes.map((type) => ({
    type,
    description: `${type}の説明`,
  })),
});

const FIXTURES = [
  makeItem("uuid-1", ["ジッパー", "タグ"]),
  makeItem("uuid-2", ["ボタン"]),
  makeItem("uuid-3", ["ステッチ", "縫製"]),
  makeItem("uuid-4", ["タグ"]),
  makeItem("uuid-5", ["ジッパー", "ステッチ"]),
];

describe("filterByDetailType — ディテール別絞り込み純粋関数", () => {
  it("detailType: 'ジッパー' で identificationPoints に type:'ジッパー' を持つアイテムのみ返す", () => {
    const result = filterByDetailType(FIXTURES, "ジッパー");
    expect(result).toHaveLength(2);
    expect(result.map((r) => r.id)).toEqual(
      expect.arrayContaining(["uuid-1", "uuid-5"]),
    );
  });

  it("detailType: 'ボタン' で identificationPoints に type:'ボタン' を持つアイテムのみ返す", () => {
    const result = filterByDetailType(FIXTURES, "ボタン");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("uuid-2");
  });

  it("detailType: 'ステッチ' で identificationPoints に type:'ステッチ' を持つアイテムのみ返す", () => {
    const result = filterByDetailType(FIXTURES, "ステッチ");
    expect(result).toHaveLength(2);
    expect(result.map((r) => r.id)).toEqual(
      expect.arrayContaining(["uuid-3", "uuid-5"]),
    );
  });

  it("detailType: undefined のとき全件返す", () => {
    const result = filterByDetailType(FIXTURES, undefined);
    expect(result).toHaveLength(FIXTURES.length);
  });

  it("該当アイテムが 0 件の場合は空配列を返す", () => {
    const result = filterByDetailType(FIXTURES, "存在しない種別");
    expect(result).toHaveLength(0);
  });

  it("空のフィクスチャを渡したとき空配列を返す", () => {
    const result = filterByDetailType([], "ジッパー");
    expect(result).toHaveLength(0);
  });
});

describe("knowledgeService.search — detailType パラメータ受け入れ", () => {
  it("search の引数に detailType フィールドを渡せる（型レベルの確認）", () => {
    // DB 未接続環境なので Promise の解決は待たない。
    // KnowledgeSearchInput 型に detailType が含まれていれば TypeScript コンパイルが通る。
    // 含まれていない場合は型エラーとなり、このテストはコンパイル段階で失敗する。
    const promise = knowledgeService.search({
      detailType: "ジッパー",
      page: 1,
      limit: 20,
    });
    expect(promise).toBeInstanceOf(Promise);
    return promise.catch(() => {
      // DB 未接続時のエラーは想定内。型の確認が目的。
    });
  });

  it("search の引数に detailType なしで呼び出せる（後方互換）", () => {
    const promise = knowledgeService.search({ page: 1, limit: 20 });
    expect(promise).toBeInstanceOf(Promise);
    return promise.catch(() => {});
  });
});
