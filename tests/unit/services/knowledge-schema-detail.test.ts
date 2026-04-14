import {
  IDENTIFICATION_POINT_TYPES,
  IdentificationPointSchema,
  KnowledgeSearchInputSchema,
} from "@/types/knowledge";

describe("IDENTIFICATION_POINT_TYPES — ディテール別検索拡張", () => {
  it("「ジッパー」が含まれる", () => {
    expect(IDENTIFICATION_POINT_TYPES).toContain("ジッパー");
  });

  it("「ボタン」が含まれる", () => {
    expect(IDENTIFICATION_POINT_TYPES).toContain("ボタン");
  });

  it("「ステッチ」が含まれる", () => {
    expect(IDENTIFICATION_POINT_TYPES).toContain("ステッチ");
  });
});

describe("IdentificationPointSchema — partName フィールド", () => {
  it("partName を持つオブジェクトがパースできる", () => {
    const result = IdentificationPointSchema.safeParse({
      type: "ジッパー",
      description: "TALONジッパー",
      partName: "TALON",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.partName).toBe("TALON");
    }
  });

  it("partName なしでもパースできる（optional）", () => {
    const result = IdentificationPointSchema.safeParse({
      type: "ボタン",
      description: "ドーナツボタン",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.partName).toBeUndefined();
    }
  });

  it("partName に空文字を渡してもパースできる（任意文字列）", () => {
    // partName は string であれば制約なし（最低長制限なし）
    const result = IdentificationPointSchema.safeParse({
      type: "ステッチ",
      description: "シングルステッチ",
      partName: "",
    });
    // 実装判断: 空文字を許容するかは Architect が決定する
    // ここでは「フィールドが存在し、パースが成功する」ことだけを検証する
    expect(result.success).toBe(true);
  });

  it("type に「ジッパー」を渡してパースできる", () => {
    const result = IdentificationPointSchema.safeParse({
      type: "ジッパー",
      description: "TALON 42ジッパー",
      partName: "TALON 42",
    });
    expect(result.success).toBe(true);
  });

  it("type に「ボタン」を渡してパースできる", () => {
    const result = IdentificationPointSchema.safeParse({
      type: "ボタン",
      description: "ドーナツボタン",
      partName: "ドーナツボタン",
    });
    expect(result.success).toBe(true);
  });

  it("type に「ステッチ」を渡してパースできる", () => {
    const result = IdentificationPointSchema.safeParse({
      type: "ステッチ",
      description: "シングルステッチ仕上げ",
      partName: "シングルステッチ",
    });
    expect(result.success).toBe(true);
  });
});

describe("KnowledgeSearchInputSchema — detailType フィールド", () => {
  it("detailType を持つオブジェクトがパースできる", () => {
    const result = KnowledgeSearchInputSchema.safeParse({
      detailType: "ジッパー",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.detailType).toBe("ジッパー");
    }
  });

  it("detailType なしでもパースできる（optional）", () => {
    const result = KnowledgeSearchInputSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.detailType).toBeUndefined();
    }
  });

  it("detailType に「ボタン」を渡してパースできる", () => {
    const result = KnowledgeSearchInputSchema.safeParse({
      detailType: "ボタン",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.detailType).toBe("ボタン");
    }
  });

  it("detailType に「ステッチ」を渡してパースできる", () => {
    const result = KnowledgeSearchInputSchema.safeParse({
      detailType: "ステッチ",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.detailType).toBe("ステッチ");
    }
  });

  it("detailType と他フィールドを組み合わせてパースできる", () => {
    const result = KnowledgeSearchInputSchema.safeParse({
      query: "Levi's 501",
      era: "1960s",
      detailType: "ジッパー",
      page: 1,
      limit: 20,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.detailType).toBe("ジッパー");
      expect(result.data.query).toBe("Levi's 501");
    }
  });
});
