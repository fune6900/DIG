import { GoogleGenerativeAI } from "@google/generative-ai";
import { OotdAnalysisResultSchema } from "@/types/ootd";
import type { OotdAnalysisResult } from "@/types/ootd";

/**
 * Notion 出典 (Master 提供):
 *   そのコーデを一言で表した言葉.md
 *   コーデを構成する説明文（DESCRIPTION）.md
 * AI に語彙・トーン・構造を継承させるための few-shot サンプル。
 */
const ONE_LINER_EXAMPLES = [
  "意志ある柔和の美学",
  "鋭利なノスタルジー",
  "静寂に宿る、柔らかな重み",
  "日常の解体、その詩学",
  "計算された「崩し」の美学",
  "胡蝶の午睡",
  "静謐な倦怠、野心の詩学",
  "現代のロマンティシズム。柔らかな構築美。",
  "地下に潜む気品",
  "都市の矛盾。響き合う旋律。",
  "日常を打破する、鮮烈な違和感",
  "大胆な存在感の詩学",
];

const DESCRIPTION_EXAMPLES = [
  `### チャイナボタン・トラックジャケット
主役はチャイナボタンを配したトラックジャケット。伝統的な技法とスポーツシルエットの融合。これは「国潮（グオチャオ）」ムーブメントを象徴する一着。ボトムスには極太のワイドパンツを選択。オーバーサイズなボリュームが、現代のストリートやAcubi（アクビ）的なバランスを生む。テックなヘッドフォンとニュートラルな配色。それらが文化的な参照点を日常の装いへと着地させる。伝統とユースカルチャーの知的な統合。`,
  `### スタジャンとダックハンターカモ
スタジャンとダックハンターカモを軸に据える。アメカジの王道を行くアーカイブだ。これをストリートの文脈でアップデートする。グラフィックキャップとワイドシルエットが、既存のテーラリングをボリュームへと変換する。厚底ローファーに白ソックス。アイビーの規範をハラジュク的な感性で解体する。ミリタリーとカレッジをモジュールとして再構成する。現代的なシティボーイのアイデンティティを表現した。`,
  `### ベルリンの匿名性とブルータリズム
全身を黒で統一する。重厚な靴で足元を固める。これはベルリンのクラブシーンが重んじる匿名性とタフネスの表現である。シャツとショーツはボクシーなオーバーサイズ。性別の境界を曖昧にする。シアリングのバッグが、その中性的なシルエットをさらに複雑にする。垂れ下がるストラップ。スクエアトゥのダービーシューズ。これらはブルータリズム建築のような、物質的な量感と構造への関心を反映している。`,
  `### 森ガールの本質と垂直レイヤード
森ガールの本質は垂直方向のレイヤードにある。チェックのチュニック、セージ色のティアードスカート、ワイドパンツを重ねる。柔らかく、余白のあるシルエットが生まれる。天然素材とアースカラーが基調だ。パフスリーブやハイネックが、田園的なロマンティシズムを添える。遊び心のあるヘアアクセサリーと独特のボリューム感は、原宿のDIY精神を象徴している。身体のラインは重要ではない。質感と個人の物語を優先した表現だ。`,
];

const SYSTEM_PROMPT = `You are a fashion editor analyzing an outfit photo. Output ONE JSON object (no markdown, no commentary) with exactly this structure:
{
  "oneLiner": string,
  "colorPalette": [{"name": string, "colorCode": "#RRGGBB", "percentage": number}],
  "styles": [{"name": string, "percentage": number}],
  "description": string,
  "detectedItems": [{"name": string, "imageHint": string}],
  "radarScores": {
    "casual": number,
    "subdued": number,
    "presence": number,
    "subtle": number,
    "formal": number,
    "colorful": number
  }
}

Language & tone (CRITICAL — write in Japanese, mirror the voice of the examples below):

# oneLiner — 1〜2 文の体言止め・短い詩のような一言
- 抽象名詞の対比 / 漢語の硬さ / 余白を残す表現を好む
- サブカルチャー名（Acubi, 原宿, Y2K, グランジ, 森ガール, ベルリン, ボヘミアン 等）を文中に引用してよい
- 語尾は「〜の美学」「〜の詩学」「〜の造形」「〜の再構築」「〜の残響」など、抽象的に閉じる
- 例:
${ONE_LINER_EXAMPLES.map((e) => `  - ${e}`).join("\n")}

# description — 番号タイトル無しの本文のみ。3〜6 文程度
- 短文を連ねるリズム。1 文 = 1 観察。
- 主役アイテムの言及 → 文化的参照（Acubi / 原宿 / Y2K / アメカジ / 森ガール / ベルリン / ボヘミアン / バロック / グランジ / クラブカルチャー 等）→ シルエット / 質感 / 配色 / 対比 で展開する
- 「〜である。」「〜だ。」と断定や、「〜が共存する。」「〜を解体する。」「〜が生まれる。」など、分析的・宣言的なトーン
- 余計な前置き（「この写真は〜」等）は禁止。観察対象の服そのものに飛び込む
- 例（参考スタイル）:
${DESCRIPTION_EXAMPLES.map((e) => e).join("\n\n---\n\n")}

# styles — 既存軸（ストリート / アメカジ / モード / 古着 / フェミニン etc.）を JP 表記。percentages should sum to ~100。

# radarScores — 6 軸を 0〜100 整数で評価
- casual:    カジュアルさ（ラフ / リラックス / 普段着寄り）
- subdued:   落ち着いたトーン（彩度の抑制 / 静的 / 渋い）
- presence:  存在感のある（強い主張 / インパクト / 視線を奪う）
- subtle:    さりげない（控えめ / 上品な抜け感 / 主張しない）
- formal:    フォーマル（ドレッシー / きちんと感 / テーラード）
- colorful:  カラフル（多彩 / 高彩度 / 色数の多さ）
注意: presence と subtle は対立軸。casual と formal も対立軸。両極端のスコアが同時に高い評価は避ける。

# colorPalette — percentages should sum to ~100。
# detectedItems — 写真に映る衣服 / アクセサリーを全件。

Return ONLY the JSON object.`;

export async function analyzeOutfit(
  imageBase64: string,
  mimeType: string,
): Promise<OotdAnalysisResult> {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
  });

  const result = await model.generateContent([
    {
      inlineData: {
        data: imageBase64,
        mimeType,
      },
    },
    SYSTEM_PROMPT,
  ]);

  const text = result.response.text().trim();
  const jsonText = text.startsWith("```")
    ? text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "")
    : text;

  const parsed = JSON.parse(jsonText) as unknown;
  return OotdAnalysisResultSchema.parse(parsed);
}
