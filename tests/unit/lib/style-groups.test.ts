import { STYLE_CATALOG } from "@/lib/style-catalog";
import { STYLE_GROUPS, STYLE_GROUPS_FLAT } from "@/lib/style-groups";

describe("STYLE_GROUPS 不変条件", () => {
  it("STYLE_CATALOG の全件が STYLE_GROUPS のいずれかのグループに含まれる", () => {
    const flat = new Set(STYLE_GROUPS_FLAT);
    const missing = STYLE_CATALOG.filter((name) => !flat.has(name));

    // 一件でも欠落していたら「こだわり条件」UI からそのスタイルが
    // 永久に到達不能になるので、不変条件として強制する。
    expect(missing).toEqual([]);
  });

  it("STYLE_GROUPS_FLAT に重複が無い", () => {
    const set = new Set(STYLE_GROUPS_FLAT);
    expect(set.size).toBe(STYLE_GROUPS_FLAT.length);
  });

  it("STYLE_GROUPS_FLAT の全件が STYLE_CATALOG に存在する", () => {
    const catalog = new Set<string>(STYLE_CATALOG);
    const orphan = STYLE_GROUPS_FLAT.filter((name) => !catalog.has(name));

    // グループ側に STYLE_CATALOG に存在しないスタイル名が紛れ込むと、
    // AI 出力（STYLE_CATALOG 限定）と整合せず常に 0 件マッチになるので弾く。
    expect(orphan).toEqual([]);
  });

  it("グループ名が一意である", () => {
    const names = STYLE_GROUPS.map((g) => g.name);
    expect(new Set(names).size).toBe(names.length);
  });
});
