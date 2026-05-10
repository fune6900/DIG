// ---------------------------------------------------------------------------
// lib/sticker-book-layout の不変条件を検証する。
// SP 幅（360px viewport - 左綴じ marginLeft 44px = 316px のページ内容幅）でも
// 全 6 ポジションの sticker（幅 96px、回転バッファ込み）が右端をはみ出さないこと。
// 直前の不具合（3 列目が SP で切れる）の回帰防止を目的とする。
// ---------------------------------------------------------------------------

import {
  STICKER_PAGE_POSITIONS,
  STICKER_WIDTH_PX,
  STICKER_ROTATION_BUFFER_PX,
  SP_PAGE_CONTENT_WIDTH_PX,
  getStickerPagePosition,
} from "@/lib/sticker-book-layout";

function leftPercent(pos: { left: string }): number {
  const m = /^(-?\d+(?:\.\d+)?)%$/.exec(pos.left);
  if (!m) throw new Error(`Unexpected left value: ${pos.left}`);
  return parseFloat(m[1]);
}

function topPercent(pos: { top: string }): number {
  const m = /^(-?\d+(?:\.\d+)?)%$/.exec(pos.top);
  if (!m) throw new Error(`Unexpected top value: ${pos.top}`);
  return parseFloat(m[1]);
}

describe("STICKER_PAGE_POSITIONS", () => {
  it("ちょうど 6 個のポジションを定義する（1 ページ = 6 sticker）", () => {
    expect(STICKER_PAGE_POSITIONS.length).toBe(6);
  });

  it("全ポジションが SP 幅 316px で右端をはみ出さない（回転バッファ込み）", () => {
    const maxLeftPx =
      SP_PAGE_CONTENT_WIDTH_PX - STICKER_WIDTH_PX - STICKER_ROTATION_BUFFER_PX;
    const maxLeftPct = (maxLeftPx / SP_PAGE_CONTENT_WIDTH_PX) * 100;
    for (const pos of STICKER_PAGE_POSITIONS) {
      expect(leftPercent(pos)).toBeLessThanOrEqual(maxLeftPct);
    }
  });

  it("全ポジションが左端をはみ出さない（left%≥0）", () => {
    for (const pos of STICKER_PAGE_POSITIONS) {
      expect(leftPercent(pos)).toBeGreaterThanOrEqual(0);
    }
  });

  it("top も 0% 以上 100% 以下に収まる", () => {
    for (const pos of STICKER_PAGE_POSITIONS) {
      const t = topPercent(pos);
      expect(t).toBeGreaterThanOrEqual(0);
      expect(t).toBeLessThanOrEqual(100);
    }
  });

  it("各ポジションは互いに完全一致しない（重なって 1 つに見えない）", () => {
    const seen = new Set<string>();
    for (const pos of STICKER_PAGE_POSITIONS) {
      const key = `${pos.left}|${pos.top}`;
      expect(seen.has(key)).toBe(false);
      seen.add(key);
    }
  });
});

describe("getStickerPagePosition", () => {
  it("インデックスでポジションを返す", () => {
    expect(getStickerPagePosition(0)).toEqual(STICKER_PAGE_POSITIONS[0]);
    expect(getStickerPagePosition(5)).toEqual(STICKER_PAGE_POSITIONS[5]);
  });

  it("インデックスが 6 以上の場合は 6 周期でループする", () => {
    expect(getStickerPagePosition(6)).toEqual(STICKER_PAGE_POSITIONS[0]);
    expect(getStickerPagePosition(11)).toEqual(STICKER_PAGE_POSITIONS[5]);
  });
});
