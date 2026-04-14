import { KnowledgeSearchInputSchema, IdentificationPointSchema } from "@/types/knowledge";

describe("KnowledgeSearchInputSchema", () => {
  it("クエリなしで page=1, limit=20 のデフォルト値が入る", () => {
    const result = KnowledgeSearchInputSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.limit).toBe(20);
    }
  });

  it("page が文字列 '2' でも数値 2 に coerce される", () => {
    const result = KnowledgeSearchInputSchema.safeParse({ page: "2" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(2);
    }
  });

  it("query が201文字以上でバリデーションエラーになる", () => {
    const longQuery = "a".repeat(201);
    const result = KnowledgeSearchInputSchema.safeParse({ query: longQuery });
    expect(result.success).toBe(false);
  });

  it("limit が51以上でバリデーションエラーになる", () => {
    const result = KnowledgeSearchInputSchema.safeParse({ limit: 51 });
    expect(result.success).toBe(false);
  });

  it("page が 0 以下でバリデーションエラーになる", () => {
    const result = KnowledgeSearchInputSchema.safeParse({ page: 0 });
    expect(result.success).toBe(false);
  });

  it("page が -1 でバリデーションエラーになる", () => {
    const result = KnowledgeSearchInputSchema.safeParse({ page: -1 });
    expect(result.success).toBe(false);
  });
});

describe("IdentificationPointSchema", () => {
  it("正常値 { type: 'タグ', description: 'Champion刺繍タグ' } がパースできる", () => {
    const result = IdentificationPointSchema.safeParse({
      type: "タグ",
      description: "Champion刺繍タグ",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.type).toBe("タグ");
      expect(result.data.description).toBe("Champion刺繍タグ");
    }
  });

  it("type に不正値 '不明' でバリデーションエラーになる", () => {
    const result = IdentificationPointSchema.safeParse({
      type: "不明",
      description: "何かの説明",
    });
    expect(result.success).toBe(false);
  });

  it("description が空文字でバリデーションエラーになる", () => {
    const result = IdentificationPointSchema.safeParse({
      type: "タグ",
      description: "",
    });
    expect(result.success).toBe(false);
  });
});
