"use server";

import { z } from "zod";
import {
  findOotds,
  findOotdById,
  createOotd,
  deleteOotd,
} from "@/services/ootd-service";
import { prisma } from "@/lib/prisma";
import { deleteImage } from "@/lib/storage";
import { CreateOotdInputSchema, SortOrderSchema } from "@/types/ootd";
import type { Ootd } from "@/types/ootd";

type ActionResult<T> =
  | { data: T; error: null }
  | { data: null; error: { message: string; code: string } };

const ListOotdsInputSchema = z.object({
  sort: SortOrderSchema.optional().default("desc"),
});

export async function listOotdsAction(
  input: unknown,
): Promise<ActionResult<Ootd[]>> {
  const parsed = ListOotdsInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      data: null,
      error: { message: "Invalid input", code: "VALIDATION_ERROR" },
    };
  }
  try {
    const result = await findOotds({ sort: parsed.data.sort });
    return { data: result, error: null };
  } catch (error) {
    console.error("[listOotdsAction]", error);
    return {
      data: null,
      error: { message: "Internal server error", code: "INTERNAL_ERROR" },
    };
  }
}

export async function getOotdByIdAction(
  id: unknown,
): Promise<ActionResult<Ootd>> {
  const parsed = z.string().uuid().safeParse(id);
  if (!parsed.success) {
    return {
      data: null,
      error: { message: "Invalid ID", code: "VALIDATION_ERROR" },
    };
  }
  try {
    const item = await findOotdById(parsed.data);
    if (!item) {
      return { data: null, error: { message: "Not found", code: "NOT_FOUND" } };
    }
    return { data: item, error: null };
  } catch (error) {
    console.error("[getOotdByIdAction]", error);
    return {
      data: null,
      error: { message: "Internal server error", code: "INTERNAL_ERROR" },
    };
  }
}

export async function createOotdAction(
  input: unknown,
): Promise<ActionResult<Ootd>> {
  const parsed = CreateOotdInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      data: null,
      error: { message: "Invalid input", code: "VALIDATION_ERROR" },
    };
  }
  try {
    const result = await createOotd(parsed.data);
    return { data: result, error: null };
  } catch (error) {
    console.error("[createOotdAction]", error);
    return {
      data: null,
      error: { message: "Internal server error", code: "INTERNAL_ERROR" },
    };
  }
}

export async function deleteOotdAction(
  id: unknown,
): Promise<ActionResult<void>> {
  const parsed = z.string().uuid().safeParse(id);
  if (!parsed.success) {
    return {
      data: null,
      error: { message: "Invalid ID", code: "VALIDATION_ERROR" },
    };
  }
  try {
    await deleteOotd(parsed.data);
    return { data: undefined, error: null };
  } catch (error) {
    console.error("[deleteOotdAction]", error);
    return {
      data: null,
      error: { message: "Internal server error", code: "INTERNAL_ERROR" },
    };
  }
}

const DeleteUploadedImagesInputSchema = z.object({
  urls: z.array(z.string().url()).min(1).max(8),
});

/**
 * 投稿失敗時に Storage 上に取り残されたアップロード画像を掃除する。
 * クライアントから service_role を使わせないためのラッパ。
 * 失敗は無視して常に成功扱いにする（best-effort cleanup）。
 *
 * セキュリティ:
 *   現状 DIG には認証基盤が無いため、Server Action のセッション認可ができない。
 *   そこで「DB 上の OOTD レコードに既に紐付いている URL は削除しない」という
 *   ガードを入れて、攻撃者が他人の投稿画像を消せないようにしている。
 *   削除可能なのは「まだ DB に登録されていない孤児アップロードのみ」。
 *   将来 auth を導入したらセッションユーザーとアップロード元の照合に置き換える。
 */
export async function deleteUploadedImagesAction(
  input: unknown,
): Promise<ActionResult<void>> {
  const parsed = DeleteUploadedImagesInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      data: null,
      error: { message: "Invalid input", code: "VALIDATION_ERROR" },
    };
  }

  const referenced = await prisma.ootd.findMany({
    where: {
      OR: [
        { imageUrl: { in: parsed.data.urls } },
        { stickerUrl: { in: parsed.data.urls } },
      ],
    },
    select: { imageUrl: true, stickerUrl: true },
  });
  const referencedSet = new Set<string>();
  for (const r of referenced) {
    referencedSet.add(r.imageUrl);
    if (r.stickerUrl) referencedSet.add(r.stickerUrl);
  }
  const orphans = parsed.data.urls.filter((u) => !referencedSet.has(u));

  await Promise.all(
    orphans.map(async (url) => {
      try {
        await deleteImage(url);
      } catch (error) {
        console.error("[deleteUploadedImagesAction]", { url, error });
      }
    }),
  );
  return { data: undefined, error: null };
}
