import { unstable_noStore as noStore } from "next/cache";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import {
  SNAP_SOURCES,
  type Snap,
  type SnapSource,
  type SnapSummary,
} from "@/types/snap";
import type { UnsplashPhoto } from "@/services/unsplash-service";
import type { PexelsPhoto } from "@/services/pexels-service";

// Prisma 側で source カラムは string 型のため、DB から読んだ値を SnapSourceEnum
// に絞り込む型ガード。未知の source 値は呼び出し側で安全に "unsplash" などへ
// 正規化する（既存レコードはすべて "unsplash" のため実害なし）。
function isSnapSource(value: string): value is SnapSource {
  return (SNAP_SOURCES as readonly string[]).includes(value);
}

function normalizeSummary(record: {
  id: string;
  imageUrl: string;
  authorName: string | null;
  sourceUrl: string;
  source: string;
}): SnapSummary {
  return {
    id: record.id,
    imageUrl: record.imageUrl,
    authorName: record.authorName,
    sourceUrl: record.sourceUrl,
    source: isSnapSource(record.source) ? record.source : "unsplash",
  };
}

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
      source: true,
    },
  });
  return records.map(normalizeSummary);
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

/**
 * Snap テーブルから ORDER BY RANDOM() で limit 件をランダム抽出する。
 * LP の Showcase で使用し、Unsplash の rate limit に依存せず「毎回別画像」
 * 要件を満たす。limit は 50 で clamp する（DoS 防御）。
 *
 * noStore() で本関数を呼ぶ route を dynamic 化する。これを呼ばないと Next.js
 * のデフォルトで `/` が静的化され、ビルド時の 1 回しか抽出されなくなる。
 */
export async function findRandomSnaps(limit: number): Promise<SnapSummary[]> {
  noStore();
  const safeLimit = Math.min(Math.floor(limit), 50);
  if (!Number.isFinite(safeLimit) || safeLimit <= 0) return [];

  const rows = await prisma.$queryRaw<
    Array<{
      id: string;
      imageUrl: string;
      authorName: string | null;
      sourceUrl: string;
      source: string;
    }>
  >`
    SELECT id, "imageUrl", "authorName", "sourceUrl", source
    FROM "Snap"
    ORDER BY RANDOM()
    LIMIT ${safeLimit}
  `;

  return rows.map(normalizeSummary);
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
      source: true,
    },
  });

  return records.map(normalizeSummary);
}

// ---------------------------------------------------------------------------
// upsertSnaps: 取得元サービス（Unsplash / Pexels）から得た写真を Snap テーブル
// にキャッシュする。source ごとに正規化済みフィールド (ExternalPhoto) に変換
// してから 1 つの実装でハンドリングする。
// ---------------------------------------------------------------------------
interface ExternalPhoto {
  externalId: string;
  imageUrl: string;
  sourceUrl: string;
  authorName: string;
  authorUrl: string;
  description: string | null;
  tags: string[];
}

function normalizeUnsplash(photo: UnsplashPhoto): ExternalPhoto {
  return {
    externalId: photo.id,
    imageUrl: photo.urls.regular,
    sourceUrl: photo.links.html,
    authorName: photo.user.name,
    authorUrl: photo.user.links.html,
    description: photo.alt_description ?? photo.description,
    tags: photo.tags?.map((t) => t.title) ?? [],
  };
}

function normalizePexels(photo: PexelsPhoto): ExternalPhoto {
  return {
    externalId: String(photo.id),
    imageUrl: photo.src.large,
    sourceUrl: photo.url,
    authorName: photo.photographer,
    authorUrl: photo.photographer_url,
    description: photo.alt || null,
    tags: [],
  };
}

async function upsertExternalPhotos(
  source: SnapSource,
  photos: ExternalPhoto[],
  query: string,
): Promise<void> {
  if (photos.length === 0) return;

  const externalIds = photos.map((p) => p.externalId);
  const existing = await prisma.snap.findMany({
    where: {
      source,
      externalId: { in: externalIds },
    },
    select: { externalId: true, searchQueries: true },
  });
  const existingMap = new Map(
    existing.map((e) => [e.externalId, e.searchQueries]),
  );

  const toCreate = photos.filter((p) => !existingMap.has(p.externalId));
  const toAppend = photos.filter((p) => {
    const queries = existingMap.get(p.externalId);
    return queries !== undefined && !queries.includes(query);
  });

  if (toCreate.length > 0) {
    await prisma.snap.createMany({
      data: toCreate.map((photo) => ({
        source,
        externalId: photo.externalId,
        imageUrl: photo.imageUrl,
        sourceUrl: photo.sourceUrl,
        authorName: photo.authorName,
        authorUrl: photo.authorUrl,
        title: null,
        description: photo.description,
        tags: photo.tags,
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
            source_externalId: { source, externalId: photo.externalId },
          },
          data: { searchQueries: { push: query } },
        }),
      ),
    );
  }
}

/**
 * Unsplash から取得した写真群を Snap テーブルにキャッシュする。
 *
 * - 新規写真: `createMany({ skipDuplicates: true })` で 1 クエリにバルク INSERT
 * - 既存写真: `searchQueries` に `query` が未登録のものだけ `update` で push
 *   （同一画像が別キーワードでヒットした履歴を保持）
 *
 * 競合: `createMany.skipDuplicates` で重複は黙殺、`update.searchQueries.push`
 * は Prisma 内部で配列追記される。完全な原子性が必要になったら $transaction
 * （Interactive）に切り替える。
 */
export async function upsertSnaps(
  photos: UnsplashPhoto[],
  query: string,
): Promise<void> {
  await upsertExternalPhotos("unsplash", photos.map(normalizeUnsplash), query);
}

/**
 * Pexels から取得した写真群を Snap テーブルにキャッシュする。
 * upsertSnaps と同じ upsert ロジックを source: "pexels" で再利用する。
 */
export async function upsertPexelsSnaps(
  photos: PexelsPhoto[],
  query: string,
): Promise<void> {
  await upsertExternalPhotos("pexels", photos.map(normalizePexels), query);
}
