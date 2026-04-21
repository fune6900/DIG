import { prisma } from "@/lib/prisma";
import {
  ColorPaletteItemSchema,
  StyleItemSchema,
  DetectedItemSchema,
  CreateOotdInput,
} from "@/types/ootd";
import type { Ootd, SortOrder } from "@/types/ootd";
import { Prisma } from "@prisma/client";
import { z } from "zod";

function parseColorPalette(raw: Prisma.JsonValue) {
  const parsed = z.array(ColorPaletteItemSchema).safeParse(raw);
  return parsed.success ? parsed.data : [];
}

function parseStyles(raw: Prisma.JsonValue) {
  const parsed = z.array(StyleItemSchema).safeParse(raw);
  return parsed.success ? parsed.data : [];
}

function parseDetectedItems(raw: Prisma.JsonValue) {
  const parsed = z.array(DetectedItemSchema).safeParse(raw);
  return parsed.success ? parsed.data : [];
}

function parseOotdRecord(record: {
  id: string;
  imageUrl: string;
  stickerUrl: string | null;
  oneLiner: string;
  colorPalette: Prisma.JsonValue;
  styles: Prisma.JsonValue;
  description: string;
  detectedItems: Prisma.JsonValue;
  date: Date;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}): Ootd {
  return {
    id: record.id,
    imageUrl: record.imageUrl,
    ...(record.stickerUrl ? { stickerUrl: record.stickerUrl } : {}),
    oneLiner: record.oneLiner,
    colorPalette: parseColorPalette(record.colorPalette),
    styles: parseStyles(record.styles),
    description: record.description,
    detectedItems: parseDetectedItems(record.detectedItems),
    date: record.date,
    tags: record.tags,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

export async function findOotds(params: { sort: SortOrder }): Promise<Ootd[]> {
  const records = await prisma.ootd.findMany({
    orderBy: { createdAt: params.sort },
  });
  return records.map(parseOotdRecord);
}

export async function findOotdById(id: string): Promise<Ootd | null> {
  const record = await prisma.ootd.findUnique({
    where: { id },
  });
  if (!record) return null;
  return parseOotdRecord(record);
}

export async function createOotd(
  input: CreateOotdInput & { date?: Date },
): Promise<Ootd> {
  const record = await prisma.ootd.create({
    data: {
      imageUrl: input.imageUrl,
      stickerUrl: input.stickerUrl ?? null,
      oneLiner: input.oneLiner,
      colorPalette: input.colorPalette,
      styles: input.styles,
      description: input.description,
      detectedItems: input.detectedItems,
      tags: input.tags,
      ...(input.date !== undefined ? { date: input.date } : {}),
    },
  });
  return parseOotdRecord(record);
}

export async function deleteOotd(id: string): Promise<void> {
  await prisma.ootd.delete({
    where: { id },
  });
}
