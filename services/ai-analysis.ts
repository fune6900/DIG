import { GoogleGenerativeAI } from "@google/generative-ai";
import { OotdAnalysisResultSchema } from "@/types/ootd";
import type { OotdAnalysisResult } from "@/types/ootd";

const SYSTEM_PROMPT = `Analyze this outfit photo and return a JSON object with exactly this structure:
{
  "oneLiner": "A single sentence describing the overall style (in Japanese)",
  "colorPalette": [{"name": "color name in Japanese", "colorCode": "#RRGGBB", "percentage": 0-100}],
  "styles": [{"name": "style name in Japanese (e.g. ストリート, アメカジ, モード)", "percentage": 0-100}],
  "description": "2-3 sentence description of the outfit in Japanese",
  "detectedItems": [{"name": "item name in Japanese", "imageHint": "brief English description"}]
}
Rules:
- colorPalette percentages should sum to ~100
- styles percentages should sum to ~100
- detectedItems should list all visible clothing/accessories
- Return ONLY the JSON object, no markdown`;

export async function analyzeOutfit(
  imageBase64: string,
  mimeType: string,
): Promise<OotdAnalysisResult> {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");
  const model = genAI.getGenerativeModel({
    model: "gemini-3.1-flash-lite-preview",
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
