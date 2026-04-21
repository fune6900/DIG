import { z } from "zod";

export const ColorPaletteItemSchema = z.object({
  name: z.string().min(1),
  colorCode: z
    .string()
    .regex(
      /^#[0-9A-Fa-f]{6}$/,
      "colorCode must be a valid hex color (e.g. #1A2B3C)",
    ),
  percentage: z.number().min(0).max(100),
});
export type ColorPaletteItem = z.infer<typeof ColorPaletteItemSchema>;

export const StyleItemSchema = z.object({
  name: z.string().min(1),
  percentage: z.number().min(0).max(100),
});
export type StyleItem = z.infer<typeof StyleItemSchema>;

export const DetectedItemSchema = z.object({
  name: z.string().min(1),
  imageHint: z.string().optional(),
});
export type DetectedItem = z.infer<typeof DetectedItemSchema>;

export const OotdSchema = z.object({
  id: z.string().uuid(),
  imageUrl: z.string().min(1),
  stickerUrl: z.string().min(1).optional(),
  oneLiner: z.string().min(1),
  colorPalette: z.array(ColorPaletteItemSchema),
  styles: z.array(StyleItemSchema),
  description: z.string().min(1),
  detectedItems: z.array(DetectedItemSchema),
  date: z.date(),
  tags: z.array(z.string()).max(3),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type Ootd = z.infer<typeof OotdSchema>;

export const CreateOotdInputSchema = z.object({
  imageUrl: z.string().min(1),
  stickerUrl: z.string().min(1).optional(),
  oneLiner: z.string().min(1),
  colorPalette: z.array(ColorPaletteItemSchema),
  styles: z.array(StyleItemSchema),
  description: z.string().min(1),
  detectedItems: z.array(DetectedItemSchema),
  tags: z.array(z.string()).max(3),
});
export type CreateOotdInput = z.infer<typeof CreateOotdInputSchema>;

export const OotdListItemSchema = OotdSchema.pick({
  id: true,
  imageUrl: true,
  oneLiner: true,
  date: true,
  tags: true,
});
export type OotdListItem = z.infer<typeof OotdListItemSchema>;

export const OotdSummarySchema = OotdSchema.pick({
  id: true,
  imageUrl: true,
  stickerUrl: true,
  oneLiner: true,
  date: true,
  tags: true,
  createdAt: true,
});
export type OotdSummary = z.infer<typeof OotdSummarySchema>;

export const OotdAnalysisResultSchema = z.object({
  oneLiner: z.string().min(1),
  colorPalette: z.array(ColorPaletteItemSchema),
  styles: z.array(StyleItemSchema),
  description: z.string().min(1),
  detectedItems: z.array(DetectedItemSchema),
});
export type OotdAnalysisResult = z.infer<typeof OotdAnalysisResultSchema>;

export const SortOrderSchema = z.enum(["asc", "desc"]);
export type SortOrder = z.infer<typeof SortOrderSchema>;
