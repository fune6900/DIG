// OotdStickerBook の sticker 配置定数。
// SP（360px viewport）でも sticker (96px) が container をはみ出さないよう、
// 左綴じマージン 44px を引いた 316px のページ内容幅を基準に座標を決めている。
// 値を変更する際は tests/unit/lib/sticker-book-layout.test.ts のガードを通すこと。

export const STICKER_WIDTH_PX = 96;
// rotate(±5deg) と translateX 等で sticker の bounding box が広がる分のバッファ
export const STICKER_ROTATION_BUFFER_PX = 10;
// SP 360px viewport - 綴じマージン 44px = 316px のページ内容幅
export const SP_PAGE_CONTENT_WIDTH_PX = 316;

// 1 ページに 6 sticker を 3 列 × 2 行で配置。
// 右端列は left ≤ ((316 - 96 - 10) / 316) × 100 ≈ 66.4% に収める必要がある。
export const STICKER_PAGE_POSITIONS = [
  { top: "8%", left: "2%" },
  { top: "6%", left: "34%" },
  { top: "5%", left: "64%" },
  { top: "44%", left: "4%" },
  { top: "46%", left: "36%" },
  { top: "43%", left: "62%" },
] as const;

export type StickerPagePosition = (typeof STICKER_PAGE_POSITIONS)[number];

export function getStickerPagePosition(index: number): StickerPagePosition {
  return STICKER_PAGE_POSITIONS[index % STICKER_PAGE_POSITIONS.length];
}
