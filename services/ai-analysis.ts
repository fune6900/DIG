import Anthropic from "@anthropic-ai/sdk";
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
  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  const validMimeType = mimeType as
    | "image/jpeg"
    | "image/png"
    | "image/gif"
    | "image/webp";

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: validMimeType,
              data: imageBase64,
            },
          },
          {
            type: "text",
            text: SYSTEM_PROMPT,
          },
        ],
      },
    ],
  });

  const textContent = message.content.find((block) => block.type === "text");
  if (!textContent || textContent.type !== "text") {
    throw new Error("No text content in AI response");
  }

  const parsed = JSON.parse(textContent.text) as unknown;
  return OotdAnalysisResultSchema.parse(parsed);
}
