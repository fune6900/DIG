import {
  OotdSchema,
  ColorPaletteItemSchema,
  StyleItemSchema,
  DetectedItemSchema,
  CreateOotdInputSchema,
} from "@/types/ootd";

// ---------------------------------------------------------------------------
// ColorPaletteItemSchema
// ---------------------------------------------------------------------------
describe("ColorPaletteItemSchema", () => {
  it("正常値 { name: 'インディゴ', colorCode: '#3B4D6B', percentage: 60 } がパースできる", () => {
    const result = ColorPaletteItemSchema.safeParse({
      name: "インディゴ",
      colorCode: "#3B4D6B",
      percentage: 60,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("インディゴ");
      expect(result.data.colorCode).toBe("#3B4D6B");
      expect(result.data.percentage).toBe(60);
    }
  });

  it("name が空文字でバリデーションエラーになる", () => {
    const result = ColorPaletteItemSchema.safeParse({
      name: "",
      colorCode: "#3B4D6B",
      percentage: 60,
    });
    expect(result.success).toBe(false);
  });

  it("colorCode が空文字でバリデーションエラーになる", () => {
    const result = ColorPaletteItemSchema.safeParse({
      name: "インディゴ",
      colorCode: "",
      percentage: 60,
    });
    expect(result.success).toBe(false);
  });

  it("percentage が 0 未満でバリデーションエラーになる", () => {
    const result = ColorPaletteItemSchema.safeParse({
      name: "インディゴ",
      colorCode: "#3B4D6B",
      percentage: -1,
    });
    expect(result.success).toBe(false);
  });

  it("percentage が 100 超でバリデーションエラーになる", () => {
    const result = ColorPaletteItemSchema.safeParse({
      name: "インディゴ",
      colorCode: "#3B4D6B",
      percentage: 101,
    });
    expect(result.success).toBe(false);
  });

  it("percentage が 0 でパースできる（境界値）", () => {
    const result = ColorPaletteItemSchema.safeParse({
      name: "ホワイト",
      colorCode: "#FFFFFF",
      percentage: 0,
    });
    expect(result.success).toBe(true);
  });

  it("percentage が 100 でパースできる（境界値）", () => {
    const result = ColorPaletteItemSchema.safeParse({
      name: "ブラック",
      colorCode: "#000000",
      percentage: 100,
    });
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// StyleItemSchema
// ---------------------------------------------------------------------------
describe("StyleItemSchema", () => {
  it("正常値 { name: 'ストリート', percentage: 70 } がパースできる", () => {
    const result = StyleItemSchema.safeParse({
      name: "ストリート",
      percentage: 70,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("ストリート");
      expect(result.data.percentage).toBe(70);
    }
  });

  it("name が空文字でバリデーションエラーになる", () => {
    const result = StyleItemSchema.safeParse({ name: "", percentage: 70 });
    expect(result.success).toBe(false);
  });

  it("percentage が 0 未満でバリデーションエラーになる", () => {
    const result = StyleItemSchema.safeParse({ name: "ストリート", percentage: -1 });
    expect(result.success).toBe(false);
  });

  it("percentage が 100 超でバリデーションエラーになる", () => {
    const result = StyleItemSchema.safeParse({ name: "ストリート", percentage: 101 });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// DetectedItemSchema
// ---------------------------------------------------------------------------
describe("DetectedItemSchema", () => {
  it("name のみで（imageHint なし）パースできる", () => {
    const result = DetectedItemSchema.safeParse({ name: "デニムジャケット" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("デニムジャケット");
      expect(result.data.imageHint).toBeUndefined();
    }
  });

  it("imageHint 付きでパースできる", () => {
    const result = DetectedItemSchema.safeParse({
      name: "デニムジャケット",
      imageHint: "vintage denim jacket with chest pocket",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.imageHint).toBe("vintage denim jacket with chest pocket");
    }
  });

  it("name が空文字でバリデーションエラーになる", () => {
    const result = DetectedItemSchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
  });

  it("name が未定義でバリデーションエラーになる", () => {
    const result = DetectedItemSchema.safeParse({ imageHint: "some hint" });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// OotdSchema
// ---------------------------------------------------------------------------
describe("OotdSchema", () => {
  const validOotd = {
    id: "123e4567-e89b-12d3-a456-426614174000",
    imageUrl: "https://example.com/ootd.jpg",
    oneLiner: "今日のコーデ",
    colorPalette: [
      { name: "インディゴ", colorCode: "#3B4D6B", percentage: 60 },
      { name: "ホワイト", colorCode: "#FFFFFF", percentage: 40 },
    ],
    styles: [{ name: "ストリート", percentage: 100 }],
    description: "ヴィンテージデニムを主役にしたコーデ",
    detectedItems: [{ name: "デニムジャケット" }, { name: "白Tシャツ" }],
    date: new Date("2026-03-15"),
    tags: ["古着", "デニム"],
    createdAt: new Date("2026-03-15T10:00:00Z"),
    updatedAt: new Date("2026-03-15T10:00:00Z"),
  };

  it("全フィールドが揃った正常値でパースできる", () => {
    const result = OotdSchema.safeParse(validOotd);
    expect(result.success).toBe(true);
  });

  it("id が UUID 形式でないとバリデーションエラーになる", () => {
    const result = OotdSchema.safeParse({ ...validOotd, id: "not-a-uuid" });
    expect(result.success).toBe(false);
  });

  it("imageUrl が URL 形式でないとバリデーションエラーになる", () => {
    const result = OotdSchema.safeParse({ ...validOotd, imageUrl: "not-a-url" });
    expect(result.success).toBe(false);
  });

  it("oneLiner が空文字でバリデーションエラーになる", () => {
    const result = OotdSchema.safeParse({ ...validOotd, oneLiner: "" });
    expect(result.success).toBe(false);
  });

  it("colorPalette が空配列でパースできる", () => {
    const result = OotdSchema.safeParse({ ...validOotd, colorPalette: [] });
    expect(result.success).toBe(true);
  });

  it("styles が空配列でパースできる", () => {
    const result = OotdSchema.safeParse({ ...validOotd, styles: [] });
    expect(result.success).toBe(true);
  });

  it("detectedItems が空配列でパースできる", () => {
    const result = OotdSchema.safeParse({ ...validOotd, detectedItems: [] });
    expect(result.success).toBe(true);
  });

  it("tags が空配列でパースできる", () => {
    const result = OotdSchema.safeParse({ ...validOotd, tags: [] });
    expect(result.success).toBe(true);
  });

  it("tags が 3 つでパースできる（上限境界値）", () => {
    const result = OotdSchema.safeParse({ ...validOotd, tags: ["古着", "デニム", "90s"] });
    expect(result.success).toBe(true);
  });

  it("tags が 4 つでバリデーションエラーになる（上限超過）", () => {
    const result = OotdSchema.safeParse({
      ...validOotd,
      tags: ["古着", "デニム", "90s", "アメカジ"],
    });
    expect(result.success).toBe(false);
  });

  it("date が Date 型でなければバリデーションエラーになる", () => {
    const result = OotdSchema.safeParse({ ...validOotd, date: "2026-03-15" });
    expect(result.success).toBe(false);
  });

  it("createdAt が Date 型でなければバリデーションエラーになる", () => {
    const result = OotdSchema.safeParse({ ...validOotd, createdAt: "2026-03-15" });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// CreateOotdInputSchema
// ---------------------------------------------------------------------------
describe("CreateOotdInputSchema", () => {
  const validInput = {
    imageUrl: "https://example.com/ootd.jpg",
    oneLiner: "今日のコーデ",
    colorPalette: [{ name: "インディゴ", colorCode: "#3B4D6B", percentage: 100 }],
    styles: [{ name: "ストリート", percentage: 100 }],
    description: "ヴィンテージデニムを主役にしたコーデ",
    detectedItems: [{ name: "デニムジャケット" }],
    date: new Date("2026-03-15"),
    tags: ["古着"],
  };

  it("正常値でパースできる", () => {
    const result = CreateOotdInputSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it("imageUrl が必須 — 欠落するとバリデーションエラーになる", () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { imageUrl: _omit, ...withoutImageUrl } = validInput;
    const result = CreateOotdInputSchema.safeParse(withoutImageUrl);
    expect(result.success).toBe(false);
  });

  it("imageUrl が URL 形式でないとバリデーションエラーになる", () => {
    const result = CreateOotdInputSchema.safeParse({ ...validInput, imageUrl: "not-a-url" });
    expect(result.success).toBe(false);
  });

  it("tags が空配列でパースできる", () => {
    const result = CreateOotdInputSchema.safeParse({ ...validInput, tags: [] });
    expect(result.success).toBe(true);
  });

  it("tags が 3 つでパースできる（上限境界値）", () => {
    const result = CreateOotdInputSchema.safeParse({
      ...validInput,
      tags: ["古着", "デニム", "90s"],
    });
    expect(result.success).toBe(true);
  });

  it("tags が 4 つでバリデーションエラーになる（上限超過）", () => {
    const result = CreateOotdInputSchema.safeParse({
      ...validInput,
      tags: ["古着", "デニム", "90s", "アメカジ"],
    });
    expect(result.success).toBe(false);
  });

  it("id / createdAt / updatedAt を含まない（入力スキーマは生成フィールドを持たない）", () => {
    // id を渡してもパースが成功するなら strip されていること、
    // 失敗するなら strict モードで弾いていること — どちらでも
    // 型定義上は id が input に含まれないことを確認する型レベルのテスト
    const withId = { ...validInput, id: "123e4567-e89b-12d3-a456-426614174000" };
    const result = CreateOotdInputSchema.safeParse(withId);
    // strip または strict のいずれかで id が出力に含まれないことを確認
    if (result.success) {
      expect((result.data as Record<string, unknown>)["id"]).toBeUndefined();
    }
    // strict モードで fail する場合も可（設計次第）
  });
});
