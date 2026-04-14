import { BookmarkSchema } from "@/types/bookmark";

describe("BookmarkSchema", () => {
  it("should validate valid bookmark", () => {
    const result = BookmarkSchema.safeParse({
      id: "123e4567-e89b-12d3-a456-426614174000",
      knowledgeId: "223e4567-e89b-12d3-a456-426614174001",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.knowledgeId).toBe(
        "223e4567-e89b-12d3-a456-426614174001",
      );
    }
  });

  it("should reject bookmark without knowledgeId", () => {
    const result = BookmarkSchema.safeParse({
      id: "123e4567-e89b-12d3-a456-426614174000",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
    });
    expect(result.success).toBe(false);
  });
});
