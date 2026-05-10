import { prisma } from "@/lib/prisma";
import type { SnapSummary } from "@/types/snap";
import type { UnsplashPhoto } from "@/services/unsplash-service";

export async function findSnapsByQuery(params: {
  query: string;
  page: number;
  pageSize: number;
}): Promise<SnapSummary[]> {
  const { query, page, pageSize } = params;
  const records = await prisma.snap.findMany({
    where: { searchQuery: query },
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * pageSize,
    take: pageSize,
    select: {
      id: true,
      imageUrl: true,
      authorName: true,
      sourceUrl: true,
    },
  });
  return records;
}

export async function upsertSnaps(
  photos: UnsplashPhoto[],
  query: string,
): Promise<void> {
  await Promise.all(
    photos.map((photo) =>
      prisma.snap.upsert({
        where: {
          source_externalId: {
            source: "unsplash",
            externalId: photo.id,
          },
        },
        create: {
          source: "unsplash",
          externalId: photo.id,
          imageUrl: photo.urls.regular,
          sourceUrl: photo.links.html,
          authorName: photo.user.name,
          authorUrl: photo.user.links.html,
          title: null,
          description: photo.alt_description ?? photo.description,
          tags: photo.tags?.map((t) => t.title) ?? [],
          searchQuery: query,
        },
        // 既存レコードが別キーワードで再ヒットした場合、searchQuery を最新クエリで
        // 上書きすることで `findSnapsByQuery({ where: { searchQuery: query } })`
        // から欠落するのを防ぐ。多対多の履歴管理は PR2 以降で別テーブル化する。
        update: { searchQuery: query },
      }),
    ),
  );
}
