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

function parseIdentificationPoints(
  raw: Prisma.JsonValue,
): IdentificationPoint[] {
  const parsed = z.array(IdentificationPointSchema).safeParse(raw);
  return parsed.success ? parsed.data : [];
}

type ItemWithIdentificationPoints = KnowledgeSummary & {
  identificationPoints: { type: string; description: string }[];
};

export function filterByDetailType<T extends ItemWithIdentificationPoints>(
  items: T[],
  detailType: string | undefined,
): T[] {
  if (detailType === undefined) return items;
  return items.filter((item) =>
    item.identificationPoints.some((p) => p.type === detailType),
  );
}

export const knowledgeService = {
  async search(input: KnowledgeSearchInput): Promise<KnowledgeSearchResult> {
    const { query, brand, category, era, detailType, page, limit } = input;
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

    // detailType が指定された場合、identificationPoints JSON 配列内の type フィールドで絞り込む
    // Prisma の JSON path フィルタは配列要素の部分一致に対応していないため $queryRaw を使用
    if (detailType) {
      const matchingIds = await prisma.$queryRaw<Array<{ id: string }>>`
        SELECT id FROM "Knowledge"
        WHERE EXISTS (
          SELECT 1 FROM jsonb_array_elements("identificationPoints") AS elem
          WHERE elem->>'type' = ${detailType}
        )
      `;
      const ids = matchingIds.map((r) => r.id);
      where.AND = [
        ...(Array.isArray(where.AND) ? where.AND : []),
        { id: { in: ids } },
      ];
    }

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
