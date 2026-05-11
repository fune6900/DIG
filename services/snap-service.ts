import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import type { Snap, SnapSummary } from "@/types/snap";
import type { UnsplashPhoto } from "@/services/unsplash-service";

export async function findSnapsByQuery(params: {
  query?: string;
  styles?: string[];
  colorCategories?: string[];
  page: number;
  pageSize: number;
}): Promise<SnapSummary[]> {
  const { query, styles, colorCategories, page, pageSize } = params;

  const hasQuery = Boolean(query);
  const hasStyles = (styles?.length ?? 0) > 0;
  const hasColors = (colorCategories?.length ?? 0) > 0;

  if (!hasQuery && !hasStyles && !hasColors) {
    return [];
  }

  const where: Prisma.SnapWhereInput = {};

  if (hasQuery && query) {
    where.searchQueries = { hasSome: [query] };
  }

  if (hasStyles && styles) {
    where.styles = { hasSome: styles } as Prisma.SnapWhereInput["styles"];
  }

  if (hasColors && colorCategories) {
    where.colorCategories = { hasSome: colorCategories };
  }

  // styles / colors フィルタが付くと AI 解析済み Snap のみを対象にする。
  // 未解析 Snap は colorCategories / styles が空 or null のため自然に除外
  // されることが多いが、PostgreSQL の JSON フィルタは null 列に対する
  // hasSome 挙動が型に依存するため、明示的に analyzedAt で絞り込んでおく。
  if (hasStyles || hasColors) {
    where.analyzedAt = { not: null };
  }

  const records = await prisma.snap.findMany({
    where,
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

export async function getSnapById(id: string): Promise<Snap | null> {
  return prisma.snap.findUnique({ where: { id } }) as Promise<Snap | null>;
}

export async function updateSnap(
  id: string,
  data: Prisma.SnapUpdateInput,
): Promise<Snap> {
  return prisma.snap.update({ where: { id }, data }) as Promise<Snap>;
}

export async function findSimilarSnaps(params: {
  snapId: string;
  searchQueries: string[];
  page: number;
  pageSize: number;
}): Promise<SnapSummary[]> {
  const { snapId, searchQueries, page, pageSize } = params;

  if (searchQueries.length === 0) return [];

  const records = await prisma.snap.findMany({
    where: {
      id: { not: snapId },
      searchQueries: { hasSome: searchQueries },
    },
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

/**
 * Unsplash から取得した写真群を Snap テーブルにキャッシュする。
 *
 * - 新規写真: `createMany({ skipDuplicates: true })` で 1 クエリにバルク INSERT
 *   （N 件並列 upsert を発行していた旧実装の DB コネクション枯渇リスクを解消）
 * - 既存写真: `searchQueries` に `query` が未登録のものだけ `update` で push
 *   （同一画像が別キーワードでヒットした履歴を保持し、過去キーワードからの
 *   再検索でも引き続き返るようにする）
 *
 * 競合: 別リクエストが同時に同 externalId を upsert する可能性は低いが、
 * `createMany.skipDuplicates` で重複は黙殺、`update.searchQueries.push` は
 * Prisma 内部で配列追記される。完全な原子性が必要になったら $transaction
 * （Interactive）に切り替える。
 */
export async function upsertSnaps(
  photos: UnsplashPhoto[],
  query: string,
): Promise<void> {
  if (photos.length === 0) return;

  const externalIds = photos.map((p) => p.id);
  const existing = await prisma.snap.findMany({
    where: {
      source: "unsplash",
      externalId: { in: externalIds },
    },
    select: { externalId: true, searchQueries: true },
  });
  const existingMap = new Map(
    existing.map((e) => [e.externalId, e.searchQueries]),
  );

  const toCreate = photos.filter((p) => !existingMap.has(p.id));
  const toAppend = photos.filter((p) => {
    const queries = existingMap.get(p.id);
    return queries !== undefined && !queries.includes(query);
  });

  if (toCreate.length > 0) {
    await prisma.snap.createMany({
      data: toCreate.map((photo) => ({
        source: "unsplash",
        externalId: photo.id,
        imageUrl: photo.urls.regular,
        sourceUrl: photo.links.html,
        authorName: photo.user.name,
        authorUrl: photo.user.links.html,
        title: null,
        description: photo.alt_description ?? photo.description,
        tags: photo.tags?.map((t) => t.title) ?? [],
        searchQueries: [query],
        colorCategories: [],
      })),
      skipDuplicates: true,
    });
  }

  if (toAppend.length > 0) {
    await Promise.all(
      toAppend.map((photo) =>
        prisma.snap.update({
          where: {
            source_externalId: { source: "unsplash", externalId: photo.id },
          },
          data: { searchQueries: { push: query } },
        }),
      ),
    );
  }
}
