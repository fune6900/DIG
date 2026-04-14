import { knowledgeService } from "@/services/knowledge-service";

describe("knowledgeService", () => {
  it("knowledgeService がエクスポートされている", () => {
    expect(knowledgeService).toBeDefined();
  });

  it("search メソッドが存在する", () => {
    expect(typeof knowledgeService.search).toBe("function");
  });

  it("findById メソッドが存在する", () => {
    expect(typeof knowledgeService.findById).toBe("function");
  });

  it("search は Promise を返す", () => {
    const result = knowledgeService.search({ page: 1, limit: 20 });
    expect(result).toBeInstanceOf(Promise);
    // 実際のDB接続はスキップするため、Promiseの解決を待たずに検証のみ行う
    // 実DB接続テストは E2E で担保する
    return result.catch(() => {
      // DB未接続環境ではエラーになる想定。それでもPromiseを返していることが確認できればOK
    });
  });
});
