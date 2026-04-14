import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import {
  IdentificationPointSchema,
  IdentificationPoint,
  KnowledgeSummary,
  Knowledge,
  KnowledgeSearchInput,
  KnowledgeSearchResult,
} from "@/types/knowledge";

function parseIdentificationPoints(raw: Prisma.JsonValue): IdentificationPoint[] {
  const parsed = z.array(IdentificationPointSchema).safeParse(raw);
  return parsed.success ? parsed.data : [];
}

export const knowledgeService = {
  async search(input: KnowledgeSearchInput): Promise<KnowledgeSearchResult> {
    const { query, brand, category, era, page, limit } = input;
    const skip = (page - 1) * limit;

    const where: Prisma.KnowledgeWhereInput = {
      AND: [
        query
          ? {
              OR: [
                { brand: { contains: query, mode: "insensitive" } },
                { tags: { has: query } },
              ],
            }
          : {},
        brand ? { brand: { contains: brand, mode: "insensitive" } } : {},
        category ? { category } : {},
        era ? { era } : {},
      ],
    };

    const [items, total] = await prisma.$transaction([
      prisma.knowledge.findMany({
        where,
        select: {
          id: true,
          brand: true,
          category: true,
          era: true,
          tags: true,
          imageUrls: true,
        },
        orderBy: { brand: "asc" },
        skip,
        take: limit,
      }),
      prisma.knowledge.count({ where }),
    ]);

    return {
      items: items as KnowledgeSummary[],
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  },

  async findById(id: string): Promise<Knowledge | null> {
    const raw = await prisma.knowledge.findUnique({ where: { id } });
    if (!raw) return null;
    return {
      ...raw,
      identificationPoints: parseIdentificationPoints(raw.identificationPoints),
    };
  },
};
