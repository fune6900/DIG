import type { ColorCategory } from "@/lib/color-catalog";

/**
 * `#RRGGBB` を 16 系統のカラーカテゴリに分類する。
 *
 * AI 解析（services/ai-analysis.ts）が生成する colorPalette[].name は
 * 「インディゴ」「深緑」など具体名で 16 系統と一致しない。フィルタを
 * 実用化するため、colorCode を HSL に変換し色相・彩度・明度ベースで
 * 機械的に分類する。
 *
 * 完璧な分類は不可能（境界値で揺れる）が、典型的なファッション配色を
 * 妥当な系統にマップすることが目的。
 */
export function categorizeColor(colorCode: string): ColorCategory | null {
  const rgb = hexToRgb(colorCode);
  if (!rgb) return null;
  const { h, s, l } = rgbToHsl(rgb.r, rgb.g, rgb.b);

  // 1. 無彩色 / 明度極値
  if (l < 0.12) return "ブラック系";
  if (l > 0.92) return "ホワイト系";
  if (s < 0.08) {
    if (l < 0.6) return "グレイ系";
    if (l < 0.85) return "シルバー系";
    return "ホワイト系";
  }

  // 2. 低彩度（くすみ）— 色相で大分類
  if (s < 0.25) {
    if (l < 0.35) {
      if (h >= 200 && h <= 260) return "ネイビー系";
      if (h >= 10 && h <= 50) return "ブラウン系";
      return "グレイ系";
    }
    if (h >= 25 && h <= 65) return "ベージュ系";
    if (h >= 65 && h <= 110) return "カーキ系";
    return "シルバー系";
  }

  // 3. 中彩度の薄茶（ベージュ）— 黄〜橙系で高明度・中彩度
  if (s < 0.55 && l > 0.65 && h >= 20 && h <= 55) return "ベージュ系";

  // 4. 色相帯
  if (h >= 345 || h < 12) {
    if (l > 0.7) return "ピンク系";
    if (l < 0.25) return "ブラウン系";
    return "レッド系";
  }
  if (h < 45) {
    if (l < 0.35) return "ブラウン系";
    return "オレンジ系";
  }
  if (h < 65) {
    // ゴールドは中-高彩度の「やや暗めの黄褐」（鮮やかすぎない金属感）。
    // s が過剰に高い場合は鮮やかなイエローとして扱う。
    if (l < 0.6 && s >= 0.55 && s <= 0.8) return "ゴールド系";
    // カーキは「くすんだ・暗めの」黄緑（中-低明度 + 中彩度）
    if (l < 0.5 && s < 0.55) return "カーキ系";
    if (l < 0.45) return "ブラウン系";
    return "イエロー系";
  }
  if (h < 90) {
    if (l < 0.5) return "カーキ系";
    return "イエロー系";
  }
  if (h < 170) {
    if (l < 0.35 && s < 0.45) return "カーキ系";
    return "グリーン系";
  }
  if (h < 200) return "グリーン系";
  if (h < 260) {
    if (l < 0.3) return "ネイビー系";
    return "ブルー系";
  }
  if (h < 320) return "パープル系";
  return "ピンク系";
}

/**
 * colorPalette 全要素を categorize して重複排除した配列を返す。
 * Snap.colorCategories に保存する用。
 */
export function categorizeColorPalette(
  palette: ReadonlyArray<{ colorCode: string }>,
): ColorCategory[] {
  const result = new Set<ColorCategory>();
  for (const item of palette) {
    const cat = categorizeColor(item.colorCode);
    if (cat) result.add(cat);
  }
  return Array.from(result);
}

// ---------------------------------------------------------------------------
// 内部: RGB / HSL 変換
// ---------------------------------------------------------------------------

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const m = /^#?([0-9A-Fa-f]{6})$/.exec(hex.trim());
  if (!m) return null;
  const v = parseInt(m[1], 16);
  return { r: (v >> 16) & 0xff, g: (v >> 8) & 0xff, b: v & 0xff };
}

interface HSL {
  h: number;
  s: number;
  l: number;
}

function rgbToHsl(r8: number, g8: number, b8: number): HSL {
  const r = r8 / 255;
  const g = g8 / 255;
  const b = b8 / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  if (max === min) {
    return { h: 0, s: 0, l };
  }

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  switch (max) {
    case r:
      h = (g - b) / d + (g < b ? 6 : 0);
      break;
    case g:
      h = (b - r) / d + 2;
      break;
    case b:
      h = (r - g) / d + 4;
      break;
  }
  h *= 60;
  return { h, s, l };
}
